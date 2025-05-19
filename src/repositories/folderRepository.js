const { Types, default: mongoose } = require("mongoose");
const {
  getFolderModel,
  getFileModel,
  getFileReferenceModel,
} = require("../models/folderAndFileModel");
const filesRepository = require("../repositories/fileRepository");

async function createFolder(req) {
  try {
    const Folder = getFolderModel(req.userDbConnection);
    const { name, parentFolderId } = req.body;
    const parentFolder = await Folder.findById(parentFolderId);
    if (!parentFolder || parentFolder.isDeleted) {
      throw new Error("Parent folder not found");
    }

    const newFolder = await new Folder({ name, parentFolderId }).save();
    console.log("Folder created successfully:", newFolder);
    return newFolder;
  } catch (err) {
    console.error("Error creating folder:", err);
    throw err;
  }
}

async function deleteFolder(req) {
  const { id } = req.body;
  const Folder = getFolderModel(req.userDbConnection);
  const File = getFileModel(req.userDbConnection);
  const FileReference = getFileReferenceModel(req.userDbConnection);
  const session = await req.userDbConnection.startSession();
  session.startTransaction();

  try {
    const folderObjectId = new Types.ObjectId(id);

    // Fetch the folder and its subfolders
    const folderHierarchy = await Folder.aggregate([
      { $match: { _id: folderObjectId } },
      {
        $graphLookup: {
          from: "folders",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentFolderId",
          as: "allSubfolders",
        },
      },
    ]).session(session);

    if (folderHierarchy.length === 0) throw new Error("Folder not found");

    const rootFolder = folderHierarchy[0];
    const allSubfolders = rootFolder.allSubfolders || [];

    const trashFolderId = new Types.ObjectId("64e4a5f7c25e4b0a2c9d5678");

    if (!rootFolder.isDeleted) {
      // Soft delete: Move to trash and mark all as deleted
      await Folder.updateMany(
        { _id: { $in: [rootFolder._id, ...allSubfolders.map((f) => f._id)] } },
        { $set: { isDeleted: true, updatedAt: Date.now() } },
        { session }
      );
      await File.updateMany(
        {
          parentFolderId: {
            $in: [rootFolder._id, ...allSubfolders.map((f) => f._id)],
          },
        },
        { $set: { isDeleted: true, updatedAt: Date.now()} },
        { session }
      );

      // Move only the root folder to the trash
      await Folder.updateOne(
        { _id: rootFolder._id },
        {
          $set: {
            previousParentFolderId: rootFolder.parentFolderId,
            parentFolderId: trashFolderId,
          },
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();
      return { message: "Folder moved to trash", deletedFolder: rootFolder };
    } else {
      // Hard delete: Delete files and folders permanently
      await filesRepository.deleteFolderAndContents(
        rootFolder,
        FileReference,
        File,
        Folder,
        session
      );

      await session.commitTransaction();
      session.endSession();
      return { message: "Folder and all subfolders permanently deleted" };
    }
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error deleting folder:", err);
    throw err;
  }
}

async function getFoldersByParentId(req) {
  const { parentFolderId, from } = req.query;
  const Folder = getFolderModel(req.userDbConnection);
  const File = getFileModel(req.userDbConnection);
  const FileReference = getFileReferenceModel(req.userDbConnection);
  let isDeleted = from === "bin" ? true : false;
  try {
    if (!parentFolderId) {
      throw new Error("Parent folder ID is required");
    }

    const objectId = new mongoose.Types.ObjectId(parentFolderId);

    // Fetch the current folder
    const currentFolder = await Folder.findById(objectId).lean();
    if (!currentFolder) {
      throw new Error("Current folder not found");
    }

    // Fetch subfolders and count them
    const foldersWithCounts = await Folder.aggregate([
      {
        $match: {
          parentFolderId: objectId,
          isDeleted: isDeleted,
        },
      },
      {
        $lookup: {
          from: "files",
          let: { folderId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$parentFolderId", "$$folderId"] },
                    { $eq: ["$isDeleted", isDeleted] },
                  ],
                },
              },
            },
          ],
          as: "files",
        },
      },
      {
        $lookup: {
          from: "folders",
          localField: "_id",
          foreignField: "parentFolderId",
          as: "subFolders",
        },
      },
      {
        $addFields: {
          count: { $add: [{ $size: "$subFolders" }, { $size: "$files" }] },
        },
      },
      {
        $project: {
          name: 1,
          parentFolderId: 1,
          isDeleted: 1,
          createdAt: 1,
          updatedAt: 1,
          count: 1,
        },
      },
    ]);

    // Fetch files within the current folder
    const files = await File.find({
      parentFolderId: objectId,
      isDeleted: isDeleted,
    }).lean();

    // Extract file IDs to fetch from FileReference
    const fileReferenceIds = files.map((file) => file.file._id);

    // Fetch file references
    const fileReferences = await FileReference.find({
      _id: { $in: fileReferenceIds },
    }).lean();

    // Map file references to their URLs
    const fileUrlMap = fileReferences.reduce((acc, ref) => {
      acc[ref._id.toString()] = ref.fileUrl;
      return acc;
    }, {});

    // Add file URLs to the files
    const updatedFiles = files.map((file) => ({
      ...file,
      fileUrl: fileUrlMap[file.file._id.toString()] || null,
    }));

    return {
      currentFolder,
      data: [...foldersWithCounts, ...updatedFiles],
    };
  } catch (err) {
    console.error("Error getting folders and files:", err);
    throw err;
  }
}

async function moveFolder(req) {
  const { folderId, newParentFolderId } = req.body;
  const Folder = getFolderModel(req.userDbConnection);
  try {
    const result = await Folder.updateOne(
      { _id: folderId },
      { $set: { parentFolderId: newParentFolderId, updatedAt: Date.now() } }
    );
    return result;
  } catch (err) {
    console.error("Error moving folder:", err);
    throw err;
  }
}

const initializeFolder = async (FolderModel) => {
  try {
    if (!FolderModel) throw new Error("FolderModel is required");

    const folders = [
      { _id: new Types.ObjectId("64e4a5f7c25e4b0a2c9d1234"), name: "root" },
      {
        _id: new Types.ObjectId("64e4a5f7c25e4b0a2c9d5678"),
        name: "bin",
        isDeleted: true,
      },
    ];

    const operations = folders.map((folder) =>
      FolderModel.updateOne(
        { _id: folder._id },
        { $setOnInsert: folder },
        { upsert: true }
      )
    );

    const results = await Promise.all(operations);

    results.forEach((result, index) => {
      const folderName = folders[index].name;
      console.log(
        result.upsertedCount > 0
          ? `Folder '${folderName}' created.`
          : `Folder '${folderName}' already exists. Skipping.`
      );
    });
    return results;
  } catch (err) {
    console.error("Failed to initialize folders:", err);
    throw err;
  }
};

async function restoreFolderRepository(req) {
  const { folderId } = req.body;
  const Folder = getFolderModel(req.userDbConnection);
  const File = getFileModel(req.userDbConnection);
  const session = await req.userDbConnection.startSession();
  session.startTransaction();

  try {
    const folder = await Folder.findById(folderId).session(session);
    if (!folder) {
      throw new Error("Folder not found");
    }

    let newParentId = new Types.ObjectId("64e4a5f7c25e4b0a2c9d1234"); // Default parent (if needed)

    if (folder.previousParentFolderId) {
      const previousParentFolder = await Folder.findById(folder.previousParentFolderId).session(session);
      if (previousParentFolder && !previousParentFolder.isDeleted) {
        newParentId = folder.previousParentFolderId;
      }
    }

    // Step 1: Restore the root folder
    await Folder.updateOne(
      { _id: folderId },
      {
        $set: {
          isDeleted: false,
          parentFolderId: newParentId,
          previousParentFolderId: null,
        },
      },
      { session }
    );

    // Step 2: Restore files in the current folder
    await File.updateMany(
      { parentFolderId: folderId, isDeleted: true },
      [
        {
          $set: {
            isDeleted: false,
            updatedAt: new Date(),
          },
        },
      ]
    ).session(session);

    // Step 3: Fetch all child folders (including nested) with $graphLookup
    const folderHierarchy = await Folder.aggregate([
      { $match: { _id: new Types.ObjectId(folderId) } },
      {
        $graphLookup: {
          from: "folders",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentFolderId",
          as: "allFolders",
        },
      },
    ]).session(session);

    const allChildFolders = folderHierarchy[0]?.allFolders || [];

    if (allChildFolders.length > 0) {
      const folderIds = allChildFolders.map((f) => f._id);

      // Step 4: Restore all child folders
      await Folder.updateMany(
        { _id: { $in: folderIds } },
        { $set: { isDeleted: false } },
        { session }
      );

      // Step 5: Restore all files within child folders
      await File.updateMany(
        { parentFolderId: { $in: folderIds }, isDeleted: true },
        [
          {
            $set: {
              isDeleted: false,
              updatedAt: new Date(),
            },
          },
        ]
      ).session(session);
    }

    await session.commitTransaction();
    session.endSession();

    console.log("Folder and its subfolders restored:", folderId);
    return { message: "Folder and subfolders restored", folderId };
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error restoring folder:", err);
    throw err;
  }
}

async function searchFoldersAndFiles(req) {
  const { query, currentFolderId, global,from } = req.query;
  const Folder = getFolderModel(req.userDbConnection);
  const File = getFileModel(req.userDbConnection);
  // const FileReference = getFileReferenceModel(req.userDbConnection);
  const currentFolderObjectId = new Types.ObjectId(currentFolderId);
  let isDeleted = from === "bin" ? true : false;

  try {
    const folderPipeline = [
      {
        $match: {
          isDeleted: isDeleted,
          ...(global === "false" && { parentFolderId: currentFolderObjectId }),
          name: {
            $regex:`^${query}`,
            $options: "i",
          },
        },
      },
      {
        $lookup: {
          from: "files",
          let: { folderId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$parentFolderId", "$$folderId"] },
                    { $eq: ["$isDeleted", isDeleted] },
                  ],
                },
              },
            },
          ],
          as: "files",
        },
      },
      {
        $lookup: {
          from: "folders",
          localField: "_id",
          foreignField: "parentFolderId",
          as: "subFolders",
        },
      },
      {
        $addFields: {
          count: { $add: [{ $size: "$subFolders" }, { $size: "$files" }] },
        },
      },
      {
        $project: {
          name: 1,
          parentFolderId: 1,
          isDeleted: 1,
          createdAt: 1,
          updatedAt: 1,
          count: 1,
        },
      },
    ];
    
    const filePipeline = [
      {
        $match: {
          isDeleted: isDeleted,
          ...(global === "false" && { parentFolderId: currentFolderObjectId }),
          "file.fileName": {
            $regex: `^${query}`,
            $options: "i",
          },
        },
      },
      {
        $lookup: {
          from: "fileReferences",
          localField: "file._id",
          foreignField: "_id",
          as: "fileRef",
        },
      },
      {
        $addFields: {
          fileUrl: { $arrayElemAt: ["$fileRef.fileUrl", 0] },
        },
      },
      {
        $project: {
          fileRef: 0,
        },
      },
    ];
    const currentFolder = await Folder.findOne({ _id: currentFolderObjectId });
    const folders = await Folder.aggregate(folderPipeline);
    const files = await File.aggregate(filePipeline);
    return {
      currentFolder,
      data: [...folders, ...files],
    };
  } catch (err) {
    console.error("Error searching folders and files:", err);
    throw err;
  }
}

async function updateFolderName(req) {
  const { folderId, newName } = req.body;
  try {
    const Folder = getFolderModel(req.userDbConnection);
    const folder = await Folder.findById(folderId);
    if (!folder) {
      throw new Error("Folder not found");
    }
    folder.name = newName;
    folder.updatedAt = Date.now();
    await folder.save();
    console.log("Folder name updated: ", folder);

    return folder;
  } catch (err) {
    console.error("Failed to edit folder name: ", err);
    throw err;
  }
}

async function copyFolder(req, folderId) {
  const Folder = getFolderModel(req.userDbConnection);
  const File = getFileModel(req.userDbConnection);
  const FileReference = getFileReferenceModel(req.userDbConnection);
  const session = await req.userDbConnection.startSession();
  session.startTransaction();

  try {
    const folderObjectId = new mongoose.Types.ObjectId(folderId);

    // Step 1: Fetch the folder and its subfolders
    const folderHierarchy = await Folder.aggregate([
      { $match: { _id: folderObjectId } },
      {
        $graphLookup: {
          from: "folders",
          startWith: "$_id",
          connectFromField: "_id",
          connectToField: "parentFolderId",
          as: "allSubfolders",
        },
      },
    ]).session(session);

    if (folderHierarchy.length === 0)
      throw new Error(`Folder not found: ${folderId}`);

    const allFolders = [
      folderHierarchy[0],
      ...folderHierarchy[0].allSubfolders,
    ];

    // Step 2: Map old folder IDs to new folder IDs
    const folderIdMap = new Map();
    const newFolderId = new mongoose.Types.ObjectId(); // For the root folder

    for (const folder of allFolders) {
      const newId =
        folder._id.toString() === folderId
          ? newFolderId
          : new mongoose.Types.ObjectId();
      folderIdMap.set(folder._id.toString(), newId.toString());
    }

    for (const folder of allFolders) {
      const files = await File.find({ parentFolderId: folder._id }).session(
        session
      );

      const newFiles = await Promise.all(
        files.map(async (fileDoc) => {
          const newFile = new File({
            file: {
              _id: fileDoc.file._id, // Keep reference to the same FileReference
              fileType: fileDoc.file.fileType,
              size: fileDoc.file.size,
              fileName: fileDoc.file.fileName,
            },
            uploadedAt: new Date(),
            updatedAt: new Date(),
            parentFolderId: folderIdMap.get(folder._id.toString()),
            previousParentFolderId: fileDoc.previousParentFolderId,
          });

          await newFile.save({ session });

          // Increment copyCount in FileReference
          await FileReference.updateOne(
            { _id: fileDoc.file._id },
            { $inc: { copiedCount: 1 } },
            { session }
          );
          return newFile;
        })
      );

      // Replace file IDs in the new folder
      folder.files = newFiles.filter(Boolean); // Remove null entries
    }

    // Step 4: Prepare batch insert of folders
    const foldersToInsert = allFolders.map((folder) => ({
      _id: folderIdMap.get(folder._id.toString()),
      name:
        folder._id.toString() === folderId
          ? `copy_${folder.name}`
          : folder.name,
      parentFolderId:
        folderIdMap.get(folder.parentFolderId?.toString()) ||
        folder.parentFolderId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isDeleted: false,
    }));

    await Folder.insertMany(foldersToInsert, { session });

    // Step 5: Commit the transaction
    await session.commitTransaction();
    session.endSession();

    // Return the copied root folder
    return foldersToInsert.find(
      (folder) => folder._id.toString() === newFolderId.toString()
    );
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Transaction Failed:", err);
    throw err;
  }
}

module.exports = {
  createFolder,
  deleteFolder,
  getFoldersByParentId,
  moveFolder,
  initializeFolder,
  restoreFolderRepository,
  searchFoldersAndFiles,
  updateFolderName,
  copyFolder,
};
