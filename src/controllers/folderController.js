const folderService = require("../services/folderService");
const fileService = require("../services/fileService");

const createFolderControl = async (req, res) => {
  try {
    const { name, parentFolderId } = req.body;
    if (!name || !parentFolderId) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Folder name and Parent folder id is required",
        });
    }

    const folder = await folderService.createFolderService(req);
    res.status(200).json({ success: true, data: {...folder.toObject(), count: 0 } });
  } catch (error) {
    console.error("Error creating folder:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deleteFolderControl = async (req, res) => {
  const { id } = req.body;
  try {
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Folder ID is required" });
    }
    const result = await folderService.deleteFolderService(req);
    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Folder not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Error deleting folder:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const getFoldersByParentIdControl = async (req, res) => {
  const { parentFolderId } = req.query;
  try {
    if (!parentFolderId) {
      return res
        .status(400)
        .json({ success: false, message: "Parent Folder ID is required" });
    }
    const folders = await folderService.getFoldersByParentIdService(req);
    res.status(200).json({ success: true, data: folders });
  } catch (error) {
    console.error("Error getting folders:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const moveFolderControl = async (req, res) => {
  const { folderId, newParentFolderId } = req.body;
  try {
    if (!folderId || !newParentFolderId) {
      return res.status(400).json({
        success: false,
        message: "Folder ID and New Parent Folder ID are required",
      });
    }
    const result = await folderService.moveFolderService(req);
    if (result.nModified === 0) {
      return res.status(404).json({
        success: false,
        message: "Folder not found or new parent folder not found",
      });
    }
    res
      .status(200)
      .json({ success: true, message: "Folder moved successfully" });
  } catch (err) {
    console.error("Error moving folder:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const uploadFileControl = async (req, res) => {
  const { folderId } = req.body;
  const { file } = req;
  try {
    if (!folderId) {
      return res
        .status(400)
        .json({ success: false, message: "Folder ID is required" });
    }
    if (!file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }
    const result = await fileService.uploadFileService(req);
    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("Error uploading file:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

const copyFolderControl = async (req, res) => {
  const { folderId } = req.body;
  try {
    if (!folderId) {
      return res.status(400).json({
        success: false,
        message: "Folder ID are required",
      });
    }
    const result = await folderService.copyFolderService(req);
    res.status(200).json({
      success: true,
      message: "Folder copied successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error copying folder:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const copyFileControl = async (req, res) => {
  const { fileId, destinationFolderId } = req.body;
  try {
    if (!fileId || !destinationFolderId) {
      return res.status(400).json({
        success: false,
        message: "File ID and Destination Folder ID are required",
      });
    }
    const result = await fileService.copyFileService(req);
    res.status(200).json({
      success: true,
      message: "File copied successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error copying file:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const deleteFileControl = async (req, res) => {
  const { fileId, folderId } = req.body;
  try {
    if (!fileId || !folderId) {
      return res.status(400).json({
        success: false,
        message: "File ID and Folder ID are required",
      });
    }
    const result = await fileService.deleteFileService(req);
    res.status(200).json({
      success: true,
      message: "File deleted successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error deleting file:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const moveFileControl = async (req, res) => {
  const { fileId, destinationFolderId } = req.body;
  try {
    if (!fileId || !destinationFolderId ) {
      return res.status(400).json({
        success: false,
        message:
          "File ID and Destination Folder ID, currentFolderId ID are required",
      });
    }
    const result = await fileService.moveFileService(req);
    res.status(200).json({
      success: true,
      message: "File moved successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error moving file:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const restoreFileControl = async (req, res) => {
  const { fileId } = req.body;
  try {
    if (!fileId) {
      return res
        .status(400)
        .json({ success: false, message: "File ID is required" });
    }
    const result = await fileService.restoreFileService(req);
    res.status(200).json({
      success: true,
      message: "File restored successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error restoring file:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const restoreFolderControl = async (req, res) => {
  const { folderId } = req.body;
  try {
    if (!folderId) {
      return res
        .status(400)
        .json({ success: false, message: "Folder ID is required" });
    }
    const result = await folderService.restoreFolderService(req);
    res.status(200).json({
      success: true,
      message: "Folder restored successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error restoring folder:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const searchFoldersAndFilesControl = async (req, res) => {
  const { query } = req.query;
  try {
    if (!query) {
      return res
        .status(400)
        .json({ success: false, message: "Search query is required" });
    }
    const result = await folderService.searchFoldersAndFilesService(req);
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error("Error searching folders and files:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateFolderNameControl = async (req, res) => {
  const { folderId, newName } = req.body;
  try {
    if (!folderId || !newName) {
      return res.status(400).json({
        success: false,
        message: "Folder ID and new name are required",
      });
    }
    const result = await folderService.updateFolderNameService(req);
    res.status(200).json({
      success: true,
      message: "Folder name updated successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error editing folder name:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateFileNameControl = async (req, res) => {
  const { fileId, newName } = req.body;
  try {
    if (!fileId || !newName) {
      return res.status(400).json({
        success: false,
        message: "File ID and new name are required",
      });
    }
    const result = await fileService.updateFileNameService(req);
    res.status(200).json({
      success: true,
      message: "File name updated successfully",
      data: result,
    });
  } catch (err) {
    console.error("Error editing file name:", err.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const PermanentDeleteFromTrashController= async (req, res) => {
  try{
    await fileService.deleteTrashedFoldersService(req);
    res.status(200).json({ success: true, message: "Permanently deleted" });
  }catch(error){
    console.error("Error permanent deleting folders from trash:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}

const restoreAllFromBinController= async (req, res) => {
  try{
    await fileService.restoreAllFromBinService(req);
    res.status(200).json({ success: true, message: "Permanently deleted" });
  }catch(error){
    console.error("Error Restore folders from trash:", error.message);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
}



module.exports = {
  createFolderControl,
  deleteFolderControl,
  getFoldersByParentIdControl,
  moveFolderControl,
  uploadFileControl,
  copyFolderControl,
  copyFileControl,
  deleteFileControl,
  moveFileControl,
  restoreFileControl,
  restoreFolderControl,
  searchFoldersAndFilesControl,
  updateFolderNameControl,
  updateFileNameControl,
  PermanentDeleteFromTrashController,
  restoreAllFromBinController
};
