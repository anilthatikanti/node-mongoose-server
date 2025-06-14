const folderRepository = require("../repositories/folderRepository");

async function createFolderService(req) {
  // Call the repository function
  const newFolder = await folderRepository.createFolder(req);
  // Return the result
  return newFolder;
}

async function deleteFolderService(req) {
  // Call the repository function
  const result = await folderRepository.deleteFolder(req);
  // Return the result
  return result;
}
async function getFoldersByParentIdService(req) {
  // Call the repository function
  const folders = await folderRepository.getFoldersByParentId(req);
  // Return the result
  return folders;
}

async function moveFolderService(req) {
  // Call the repository function
  const result = await folderRepository.moveFolder(req);
  // Return the result
  return result;
}

async function copyFolderService(req) {
  try {
    const folder = await folderRepository.copyFolder(req, req.body.folderId);
    return folder;
  } catch (err) {
    console.error("Failed to copy folder: ", err);
    throw err;
  }
}

async function initializeFolder(connection) {
  try {
    await folderRepository.initializeFolder(connection);
  } catch (err) {
    console.error("Failed to initialize folders: ", err);
    throw err;
  }
}

async function restoreFolderService(req) {
  try {
    await folderRepository.restoreFolderRepository(req);
  } catch (err) {
    console.error("Failed to restore folder: ", err);
    throw err;
  }
}
async function searchFoldersAndFilesService(req) {
  try {
    const result = await folderRepository.searchFoldersAndFiles(req);
    return result;
  } catch (err) {
    console.error("Failed to search folders and files:", err);
    throw err;
  }
}

async function updateFolderNameService(req) {
  try {
    const result = await folderRepository.updateFolderName(req);
    return result;
  } catch (err) {
    console.error("Failed to edit folder name:", err);
    throw err;
  }
}

module.exports = {
  createFolderService,
  deleteFolderService,
  getFoldersByParentIdService,
  moveFolderService,
  copyFolderService,
  restoreFolderService,
  initializeFolder,
  searchFoldersAndFilesService,
  updateFolderNameService,
};
