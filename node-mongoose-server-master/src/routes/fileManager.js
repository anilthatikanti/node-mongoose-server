const express = require("express");
const router = express.Router();
const upload = require('../middlewares/multer');

// Import controllers
const {
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
  updateFolderNameControl,
  searchFoldersAndFilesControl,
  updateFileNameControl,
  PermanentDeleteFromTrashController,
  restoreAllFromBinController
} = require("../controllers/folderController");

router.post("/create-folder", createFolderControl);     //done
router.post("/delete-folder", deleteFolderControl);
router.put("/move-folder", moveFolderControl);
router.post("/copy-folder", copyFolderControl);
router.put("/restore-folder", restoreFolderControl);
router.put("/edit-folder-name", updateFolderNameControl);   //done

router.get("/get-folder-file", getFoldersByParentIdControl);
router.get("/search", searchFoldersAndFilesControl);
router.delete("/delete-all", PermanentDeleteFromTrashController);
router.put("/restore-all", restoreAllFromBinController);

router.post("/upload-file",upload.single('file'), uploadFileControl);   //done
router.post("/delete-file", deleteFileControl);
router.put("/copy-file", copyFileControl);
router.put("/move-file", moveFileControl);
router.put("/restore-file", restoreFileControl);
router.put("/edit-file-name", updateFileNameControl);
module.exports = router;

/**
 * @swagger
 * /files/create-folder:
 *   post:
 *     summary: Create a new folder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: "New Folder"
 *               parentFolderId:
 *                 type: string
 *                 nullable: true
 *                 example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Folder created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
 *                     name:
 *                       type: string
 *                       example: "New Folder"
 *                     parentFolderId:
 *                       type: string
 *                       nullable: true
 *                       example: "60d21b4667d0d8992e610c85"
 *                     createdAt:
 *                       type: string
 *                       example: "2025-02-13T12:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       example: "2025-02-13T12:00:00.000Z"
 *                     isDeleted:
 *                       type: boolean
 *                       example: false
 *       404:
 *         description: Error creating folder
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error message"
 */

/**
 * @swagger
 * /files/delete-folder:
 *   post:
 *     summary: Delete a folder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Folder deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Folder deleted successfully"
 *       404:
 *         description: Error deleting folder
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error message"
 */

/**
 * @swagger
 * /files/get-folder-file:
 *   get:
 *     summary: Get folders by parent folder ID
 *     parameters:
 *       - in: query
 *         name: parentFolderId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the parent folder
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Folders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "60d21b4667d0d8992e610c85"
 *                       name:
 *                         type: string
 *                         example: "New Folder"
 *                       parentFolderId:
 *                         type: string
 *                         nullable: true
 *                         example: "60d21b4667d0d8992e610c85"
 *                       createdAt:
 *                         type: string
 *                         example: "2025-02-13T12:00:00.000Z"
 *                       updatedAt:
 *                         type: string
 *                         example: "2025-02-13T12:00:00.000Z"
 *                       isDeleted:
 *                         type: boolean
 *                         example: false
 *       404:
 *         description: No folders found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No folders found"
 *       400:
 *         description: Parent Folder ID is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Parent Folder ID is required"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /files/move-folder:
 *   put:
 *     summary: Move a folder to a new parent folder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               folderId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               newParentFolderId:
 *                 type: string
 *                 nullable: true
 *                 example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Folder moved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Folder moved successfully"
 *       404:
 *         description: Folder not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Folder not found"
 *       400:
 *         description: Folder ID is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Folder ID is required"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /files/copy-folder:
 *   post:
 *     summary: Copy a folder to a new parent folder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               folderId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Folder copied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Folder copied successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c87"
 *                     name:
 *                       type: string
 *                       example: "New Folder"
 *                     parentFolderId:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c86"
 *                     files:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "60d21b4667d0d8992e610c88"
 *                     createdAt:
 *                       type: string
 *                       example: "2025-02-13T12:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       example: "2025-02-13T12:00:00.000Z"
 *                     isDeleted:
 *                       type: boolean
 *                       example: false
 *       404:
 *         description: Folder not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Folder not found"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid input"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /files/restore-folder:
 *   put:
 *     summary: Restore a folder from the bin to its previous parent folder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               folderId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Folder restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Folder restored successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
 *                     name:
 *                       type: string
 *                       example: "Restored Folder"
 *                     parentFolderId:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c86"
 *                     files:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "60d21b4667d0d8992e610c88"
 *                     createdAt:
 *                       type: string
 *                       example: "2025-02-13T12:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       example: "2025-02-13T12:00:00.000Z"
 *                     isDeleted:
 *                       type: boolean
 *                       example: false
 *       404:
 *         description: Folder not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Folder not found"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid input"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /files/move-file:
 *   put:
 *     summary: Move a file to a new parent folder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               destinationFolderId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c86"
 *     responses:
 *       200:
 *         description: File moved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "File moved successfully"
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "File not found"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid input"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /files/upload-file:
 *   post:
 *     summary: Upload a file
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               parentFolderId:
 *                 type: string
 *                 nullable: true
 *                 example: "60d21b4667d0d8992e610c85"
 *               fileUrl:
 *                 type: string
 *                 example: "https://example.com/file.pdf"
 *               fileType:
 *                 type: string
 *                 example: "pdf"
 *               size:
 *                 type: number
 *                 example: 1024
 *               fileName:
 *                 type: string
 *                 example: "file.pdf"
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
 *                     parentFolderId:
 *                       type: string
 *                       nullable: true
 *                       example: "60d21b4667d0d8992e610c85"
 *                     fileUrl:
 *                       type: string
 *                       example: "https://example.com/file.pdf"
 *                     fileType:
 *                       type: string
 *                       example: "pdf"
 *                     size:
 *                       type: number
 *                       example: 1024
 *                     fileName:
 *                       type: string
 *                       example: "file.pdf"
 *                     uploadedAt:
 *                       type: string
 *                       example: "2025-02-13T12:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       example: "2025-02-13T12:00:00.000Z"
 *       404:
 *         description: Error uploading file
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error message"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid input"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /files/copy-file:
 *   put:
 *     summary: Copy a file to a new parent folder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               destinationFolderId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c86"
 *     responses:
 *       200:
 *         description: File copied successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "File copied successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
 *                     fileUrl:
 *                       type: string
 *                       example: "https://example.com/file.pdf"
 *                     fileType:
 *                       type: string
 *                       example: "pdf"
 *                     size:
 *                       type: number
 *                       example: 1024
 *                     fileName:
 *                       type: string
 *                       example: "file.pdf"
 *                     copiedCount:
 *                       type: number
 *                       example: 1
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "File not found"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid input"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /files/delete-file:
 *   post:
 *     summary: Delete a file
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               folderId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c86"
 *     responses:
 *       200:
 *         description: File deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "File deleted successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
 *                     fileUrl:
 *                       type: string
 *                       example: "https://example.com/file.pdf"
 *                     fileType:
 *                       type: string
 *                       example: "pdf"
 *                     size:
 *                       type: number
 *                       example: 1024
 *                     fileName:
 *                       type: string
 *                       example: "file.pdf"
 *                     copiedCount:
 *                       type: number
 *                       example: 0
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "File not found"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid input"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /files/move-file:
 *   put:
 *     summary: Move a file to a new parent folder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *               destinationFolderId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c86"
 *     responses:
 *       200:
 *         description: File moved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "File moved successfully"
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "File not found"
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Invalid input"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /files/restore-file:
 *   post:
 *     summary: Restore a file from the bin to its previous folder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: File restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "File restored successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c85"
 *                     parentFolderId:
 *                       type: string
 *                       example: "60d21b4667d0d8992e610c86"
 *                     fileUrl:
 *                       type: string
 *                       example: "https://example.com/file.pdf"
 *                     fileType:
 *                       type: string
 *                       example: "pdf"
 *                     size:
 *                       type: number
 *                       example: 1024
 *                     fileName:
 *                       type: string
 *                       example: "file.pdf"
 *                     uploadedAt:
 *                       type: string
 *                       example: "2025-02-13T12:00:00.000Z"
 *                     updatedAt:
 *                       type: string
 *                       example: "2025-02-13T12:00:00.000Z"
 *       400:
 *         description: File ID is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "File ID is required"
 *       404:
 *         description: File not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "File not found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /files/search:
 *   get:
 *     summary: Search for folders and files
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         required: true
 *         description: The search query
 *         example: "example"
 *       - in: query
 *         name: currentFolderId
 *         schema:
 *           type: string
 *         required: false
 *         description: The ID of the current folder for searching within a specific folder
 *         example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     folders:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c85"
 *                           name:
 *                             type: string
 *                             example: "New Folder"
 *                           parentFolderId:
 *                             type: string
 *                             nullable: true
 *                             example: "60d21b4667d0d8992e610c85"
 *                           createdAt:
 *                             type: string
 *                             example: "2025-02-13T12:00:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             example: "2025-02-13T12:00:00.000Z"
 *                           isDeleted:
 *                             type: boolean
 *                             example: false
 *                     files:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             example: "60d21b4667d0d8992e610c85"
 *                           fileName:
 *                             type: string
 *                             example: "file.pdf"
 *                           parentFolderId:
 *                             type: string
 *                             nullable: true
 *                             example: "60d21b4667d0d8992e610c85"
 *                           fileUrl:
 *                             type: string
 *                             example: "https://example.com/file.pdf"
 *                           fileType:
 *                             type: string
 *                             example: "pdf"
 *                           size:
 *                             type: number
 *                             example: 1024
 *                           uploadedAt:
 *                             type: string
 *                             example: "2025-02-13T12:00:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             example: "2025-02-13T12:00:00.000Z"
 *       400:
 *         description: Search query is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Search query is required"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /files/edit-folder-name:
 *   put:
 *     summary: Update a new folder
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newName:
 *                 type: string
 *                 example: "Folder new name"
 *               folderId:
 *                 type: string
 *                 example: "60d21b4667d0d8992e610c85"
 *     responses:
 *       200:
 *         description: Folder Updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Folder name updated successfully"
 *       404:
 *         description: Error creating folder
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Error message"
 */

/**
 * @swagger
 * /files/delete-all:
 *   delete:
 *     summary: Delete all folders and files permanently
 *     responses:
 *       200:
 *         description: Folders and files deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Folders and files deleted successfully"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /files/restore-all:
 *   put:
 *     summary: Restore all folders and files from the bin to their previous parent folders
 *     responses:
 *       200:
 *         description: Folders and files restored successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "All folders and files restored successfully"

 *       404:
 *         description: No folders or files found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "No folders or files found"
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Internal Server Error"
 */

