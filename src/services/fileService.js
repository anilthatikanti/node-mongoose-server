const fileRepository = require("../repositories/fileRepository");
const _ = require("lodash");

async function uploadFileService(req) {
  const newFile = await fileRepository.uploadFile(req);
  // Return the result
  return newFile;
}

async function copyFileService(req) {
  const copiedFile = await fileRepository.copyFile(req);
  return copiedFile;
}

async function deleteFileService(req) {
  const deletedFile = await fileRepository.deleteFile(req);
  return deletedFile;
}

async function moveFileService(req) {
  const movedFile = await fileRepository.moveFile(req);
  return movedFile;
}

async function restoreFileService(req) {
  const restoredFile = await fileRepository.restoreFile(req);
  return restoredFile;
}

async function updateFileNameService(req) {
  try {
    const result = await fileRepository.updateFileName(req);
    return result;
  } catch (err) {
    console.error("Failed to edit file name:", err);
    throw err;
  }
}
async function deleteTrashedFoldersService(req) {
  try {
    const result = await fileRepository.deleteTrashedFoldersFiles(req);
    return result;
  } catch (err) {
    console.error("Failed to delete trashed folders: ", err);
    throw err;
  }
}
async function restoreAllFromBinService(req) {
  try {
    const result = await fileRepository.restoreAllFromBin(req);
    return result;
  } catch (err) {
    console.error("Failed to delete trashed folders: ", err);
    throw err;
  }
}

module.exports = {
  uploadFileService,
  copyFileService,
  deleteFileService,
  moveFileService,
  restoreFileService,
  updateFileNameService,
  deleteTrashedFoldersService,
  restoreAllFromBinService
};
