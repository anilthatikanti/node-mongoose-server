const mongoose = require("mongoose");
const { Schema } = mongoose;
const { getUserDB } = require("../config/mongoDBConnections");

const userSchema = new Schema(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true },
    email: { type: String, required: true, index: true  },
    isVerified: { type: Boolean, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "user", versionKey: false,autoIndex: true }
);

async function getUserModel() {
  const userDbConnection = await getUserDB();
  return userDbConnection.model("User", userSchema);
}

module.exports = getUserModel;