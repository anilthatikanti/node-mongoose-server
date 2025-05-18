const { Types } = require("mongoose");
const mongoose = require("mongoose");
const s3 = require('../services/s3ClientConfig');
const path = require("path");
const env = require("dotenv");
env.config({ path: path.join(__dirname, "../../.env") });
const {
  getFileModel,
  getFolderModel,
  getFileReferenceModel,
} = require("../models/folderAndFileModel");
// Create a new ImgurClient instance

async function uploadFile(req) {
  const { folderId } = req.body;
  const { file } = req;
  const userId = req.userId;
  const File = getFileModel(req.userDbConnection);
  const FileReference = getFileReferenceModel(req.userDbConnection);

  // Start session from the correct connection
  const session = await req.userDbConnection.startSession();
  session.startTransaction();

  try {
    if (!file || !file.buffer) {
      throw new Error("Invalid file input.");
    }

    const key = `uploads/${userId}/${Date.now()}_${file.originalname}`;

    const s3Response = await s3
      .upload({
        Bucket: process.env.BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
      .promise();

    console.log('s3Response', s3Response)
    const imageUrl = s3Response.Location;

    const newFileRef = await new FileReference({
      fileUrl: imageUrl,
      key,
    }).save({ session });
    // Save file metadata including deleteHash
    const newFile = await new File({
      userId,
      file: {
        _id: newFileRef._id,
        fileType: file.mimetype,
        size: file.size,
        fileName: file.originalname,
      },
      parentFolderId:new Types.ObjectId(folderId)
    }).save({ session });

    await session.commitTransaction();
    session.endSession();

    return {
      ...newFile.toObject(),
      fileUrl: newFileRef.fileUrl,
    };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    if (err.message.includes('Too Many Requests')) {
      throw new Error(" Too many requests. Try again later.");
    }
    throw err;
  }
}

async function incrementFileCopyCount(req, session) {
  const { fileId } = req.body;
  const File = getFileModel(req.userDbConnection);
  const FileReference = getFileReferenceModel(req.userDbConnection);
  try {
    const file = await File.findById(fileId);
    if (file) {
      const ref = await FileReference.findById(file.file._id);
      if (ref) {
        ref.copiedCount += 1;
        await ref.save({ session });
      }
    }
  } catch (err) {
    console.error("Error incrementing file copy count:", err);
    throw err;
  }
}

async function copyFile(req) {
  const { fileId } = req.body;
  const File = getFileModel(req.userDbConnection);
  const FileReference = getFileReferenceModel(req.userDbConnection);
  const session = await req.userDbConnection.startSession();
  session.startTransaction();
  try {
    // Find the file
    const file = await File.findById(fileId);
    if (!file) {
      throw new Error("File not found");
    }
    let duplicatedFile = new File({
      file: {
        _id: file.file._id, // Keep reference to the same FileReference
        fileType: file.file.fileType,
        size: file.file.size,
        fileName: `copy_${file.file.fileName}`,
      },
      uploadedAt: new Date(),
      updatedAt: new Date(),
      parentFolderId: file.parentFolderId,
      previousParentFolderId: file.previousParentFolderId,
      isDeleted: file.isDeleted,
    });

    // Save the new file with a unique _id
    await duplicatedFile.save({ session });
    if (file) {
      const ref = await FileReference.findById(file.file._id);
      if (ref) {
        ref.copiedCount += 1;
        await ref.save({ session });
        duplicatedFile = { ...duplicatedFile.toObject(), fileUrl: ref.fileUrl };
      }
    }

    // Increment the copiedCount for the file
    await incrementFileCopyCount(req, session);
    await session.commitTransaction();
    session.endSession();
    return duplicatedFile;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Failed to copy file: ", err);
    throw err;
  }
}

async function moveFile(req) {
  const { fileId, destinationFolderId } = req.body;
  const File = getFileModel(req.userDbConnection);
  const session = await req.userDbConnection.startSession();
  session.startTransaction();

  try {
    const file = await File.findById(fileId);
    if (!file) {
      throw new Error("File not found");
    }
    file.parentFolderId = destinationFolderId
    await file.save({ session });
    await session.commitTransaction();
    session.endSession();
    return file;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Failed to move file: ", err);
    throw err;
  }
}

async function deleteFile(req) {
  const { fileId } = req.body;
  const File = getFileModel(req.userDbConnection);
  const FileReference = getFileReferenceModel(req.userDbConnection);
  // Start session from the correct connection
  const session = await req.userDbConnection.startSession();
  session.startTransaction();
  try {
    const binFolderId = new Types.ObjectId("64e4a5f7c25e4b0a2c9d5678");
    const file = await File.findById(fileId).session(session);
    if (!file) {
      throw new Error("File not found");
    }
    if (!file.previousParentFolderId) {
      file.previousParentFolderId = file.parentFolderId;
      file.parentFolderId = binFolderId;
      file.isDeleted=true
      await file.save({ session });
    } else {
      const ref = await FileReference.findById(file.file._id).session(session);
      if (ref.copiedCount > 0) {
        ref.copiedCount -= 1;
        await ref.save({ session });
      } else {
        let res = await s3
        .deleteObject({
          Bucket: process.env.BUCKET_NAME,
          Key: ref.key,
        })
        .promise();
        console.log('res', res)
        await FileReference.deleteOne({ _id: ref._id }).session(session);
      }
      await File.deleteOne({ _id: fileId }).session(session);
    }

    await session.commitTransaction();
    session.endSession();
    return file;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Failed to delete file: ", err);
    throw err;
  }
}

async function restoreFile(req) {
  const { fileId } = req.body;
  const session = await req.userDbConnection.startSession();
  session.startTransaction();
  try {
    const File = getFileModel(req.userDbConnection);
    const Folder = getFolderModel(req.userDbConnection);
    const file = await File.findById(fileId).session(session);
    if (!file) {
      throw new Error("File not found");
    }
    // Determine the target folder for restoration
    let targetFolderId;
    const previousParentFolder = await Folder.findById(
      file.previousParentFolderId
    ).session(session);
    if (!previousParentFolder||previousParentFolder.isDeleted) {
      targetFolderId = new Types.ObjectId("64e4a5f7c25e4b0a2c9d1234");
    } else {
      // Otherwise, move the file to the previous parent folder
      targetFolderId = file.previousParentFolderId;
    }
    file.previousParentFolderId = null;
    file.parentFolderId = targetFolderId;
    file.isDeleted=false;
    await file.save({ session });
    await session.commitTransaction();
    session.endSession();
    return file;
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Failed to restore file: ", err);
    throw err;
  }
}

async function updateFileName(req) {
  const { fileId, newName } = req.body;
  const File = getFileModel(req.userDbConnection);
  try {
    const file = await File.findById(fileId);
    if (!file) {
      throw new Error("File not found");
    }
    file.file.fileName = newName;
    await file.save();

    return file;
  } catch (err) {
    console.error("Failed to edit file name: ", err);
    throw err;
  }
}

async function deleteTrashedFoldersFiles(req) {
  const File = getFileModel(req.userDbConnection);
  const Folder = getFolderModel(req.userDbConnection);
  const FileReference = getFileReferenceModel(req.userDbConnection);
  const session = await req.userDbConnection.startSession();
  session.startTransaction();

  try {
    // **Step 1: Find the Bin Folder by ID**
    const binFolderId = new Types.ObjectId("64e4a5f7c25e4b0a2c9d5678");
    
    await deleteAllTrashFiles(binFolderId, FileReference, File, session);

    // **Step 3: Get all trashed folders (folders inside the Bin)**
    const trashedFolders = await Folder.find({ parentFolderId: binFolderId }).session(session);
    // **Step 4: Process each folder & delete recursively**
    for (const folder of trashedFolders) {
      await deleteFolderAndContents(
        folder,
        FileReference,
        File,
        Folder,
        session
      );
    }

    await session.commitTransaction();
    session.endSession();
    return { message: "Trashed folders and files permanently deleted." };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error(" Error deleting trashed files & folders:", err);
    throw err;
  }
}

/**  **Delete all files in a folder** */
async function deleteAllTrashFiles(folderId,FileReference, File, session) {

  const files = await File.find({ parentFolderId:folderId }).session(session);
  for (const file of files) {
    const fileDoc = await File.findById(file._id).session(session);
    if (!fileDoc) continue;

    const ref = await FileReference.findById(fileDoc.file._id).session(session);
    if (ref.copiedCount > 0) {
      ref.copiedCount -= 1;
      await ref.save({ session });
    } else {
      try {
         const deleteParams = {
          Bucket: process.env.BUCKET_NAME,
          Key: ref.key,
        };
        await s3.deleteObject(deleteParams).promise();
        await FileReference.deleteOne({ _id: ref._id }).session(session);
      } catch (s3Error) {
        console.error(
            `Error deleting file ${file._id} from S3:`,
          s3Error.message || s3Error
        );
      }
    }
    await File.deleteOne({ _id: fileDoc._id }).session(session);
  }
}

async function deleteFolderAndContents(
  folder,
  FileReference,
  File,
  Folder,
  session
) {
  // **Step 1: Delete files inside the folder**
  await deleteAllTrashFiles(folder._id, FileReference, File, session);

  // **Step 2: Get all subfolders**
  const subfolders = await Folder.find({ parentFolderId: new Types.ObjectId(folder._id)}).session(session);

  // **Step 3: Recursively delete subfolders**
  for (const subfolder of subfolders) {
    await deleteFolderAndContents(subfolder,FileReference, File, Folder, session);
  }

  // **Step 4: Delete the folder itself**
  await Folder.deleteOne({ _id: folder._id }).session(session);
}
async function restoreAllFromBin(req) {
  const File = getFileModel(req.userDbConnection);
  const Folder = getFolderModel(req.userDbConnection);
  const session = await req.userDbConnection.startSession();
  session.startTransaction();

  try {
    const binFolderId = new mongoose.Types.ObjectId("64e4a5f7c25e4b0a2c9d5678");

    // Restore folders first
    const subFolders = await Folder.find({ _id: { $ne: binFolderId }, isDeleted: true })
      .sort({ updatedAt: -1 })
      .session(session);

    await Promise.all(
      subFolders.map(async (folder) => {
        const updateData = {
          isDeleted: false,
          updatedAt: Date.now(),
        };

        if (folder.previousParentFolderId) {
          updateData.parentFolderId = folder.previousParentFolderId;
        } else {
          // Fallback to bin folder or handle error as needed
          console.warn(`Folder ${folder._id} has no previousParentFolderId`);
        }

        updateData.previousParentFolderId = null;

        await Folder.updateOne({ _id: folder._id }, { $set: updateData }, { session });
      })
    );

    // Restore files next
    const files = await File.find({ isDeleted: true }).session(session);

    await Promise.all(
      files.map(async (file) => {
        const updateData = {
          isDeleted: false,
          updatedAt: Date.now(),
        };

        if (file.previousParentFolderId) {
          updateData.parentFolderId = file.previousParentFolderId;
        } else {
          console.warn(`File ${file._id} has no previousParentFolderId`);
        }

        updateData.previousParentFolderId = null;

        await File.updateOne({ _id: file._id }, { $set: updateData }, { session });
      })
    );

    await session.commitTransaction();
    session.endSession();
    return { message: "All files and folders restored successfully." };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error restoring from bin:", err);
    throw err;
  }
}


module.exports = {
  uploadFile,
  incrementFileCopyCount,
  copyFile,
  deleteFile,
  moveFile,
  restoreFile,
  updateFileName,
  deleteTrashedFoldersFiles,
  restoreAllFromBin,
  deleteFolderAndContents,
};
