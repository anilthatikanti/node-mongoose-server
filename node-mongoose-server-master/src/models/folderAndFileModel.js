// models/userSpecificModels.js

const mongoose = require("mongoose");
const { Schema } = mongoose;

const folderSchema = new Schema(
  {
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      default: function () {
        return new mongoose.Types.ObjectId();
      },
    },
    name: { type: String, required: true, index: true },
    parentFolderId: {
      type: mongoose.Types.ObjectId,
      ref: "Folder",
      default: null,
      index: true 
    },
    previousParentFolderId: {
      type: mongoose.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false },
  },
  { collection: "folders", versionKey: false ,autoIndex: true }
);

const fileSchema = new Schema(
  {
    file: {
      _id: {
        type: mongoose.Types.ObjectId,
        ref: "FileReference",
        required: true,
      },
      fileType: { type: String, required: true },
      size: { type: Number, required: true },
      fileName: { type: String, required: true, index: true  },
    },
    parentFolderId: {
      type: mongoose.Types.ObjectId,
      ref: "Folder",
      required: true,
      index: true 
    },
    previousParentFolderId: {
      type: mongoose.Types.ObjectId,
      ref: "Folder",
      default: null,
    },
    isDeleted:{ type: Boolean, default: false },
    uploadedAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "files", versionKey: false,autoIndex: true }
);

const fileReference = new Schema(
  {
    fileUrl: { type: String, required: true },
    copiedCount: { type: Number, default: 0 },
    key: { type: String },
  },
  {
    collection: "fileReferences",
    versionKey: false,
  }
);
function getFolderModel(userDbConnection) {
  return (
    userDbConnection.models["Folder"] ||
    userDbConnection.model("Folder", folderSchema)
  );
}

function getFileModel(userDbConnection) {
  return (
    userDbConnection.models["File"] ||
    userDbConnection.model("File", fileSchema)
  );
}

function getFileReferenceModel(userDbConnection) {
  return (
    userDbConnection.models["FileReference"] ||
    userDbConnection.model("FileReference", fileReference)
  );
}

module.exports = { getFolderModel, getFileModel, getFileReferenceModel };
