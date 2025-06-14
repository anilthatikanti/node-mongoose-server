const mongoose = require("mongoose");
const path = require("path");
const env = require("dotenv");
env.config({ path: path.join(__dirname, "../../.env") });

const { initializeFolder } = require("../repositories/folderRepository");
const { initializeWatchLists } = require("../repositories/stockRepository");
const { getFolderModel } = require("../models/folderAndFileModel");
const {getWatchListModel} = require("../models/stockModel");

let userDbConnection = null;


// Initialize the main user database connection
async function initializeUserDbConnection() {
  if (userDbConnection) return userDbConnection; // Return if already initialized

  try {
    console.log("Initializing user DB connection...");
    userDbConnection = await mongoose.connect(`${process.env.DB_URL}`,
      {
        dbName: "user", // Replace with actual DB name
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );

    console.log(`MongoDB User DB Connected: ${userDbConnection.connection.host}/user`);
    return userDbConnection;
  } catch (error) {
    console.error("Error connecting to User DB:", error.message);
    throw new Error("Failed to connect to User DB");
  }
}

// Initialize a user-specific database connection
async function initializeUserSpecificDbConnection(dbName) {
  if (!dbName) throw new Error("Database name is required");
  try {
    console.log('process.env.DB_URL', process.env.DB_URL)
    console.log(`Connecting to user-specific DB: ${dbName}`);
    const connection = mongoose.createConnection(`${process.env.DB_URL}`,
      {
        dbName: `${dbName}`, // Replace with actual DB name
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
// Cache connection
    return connection;
  } catch (error) {
    console.error("Error connecting to User Specific DB:", error.message);
    throw new Error("Failed to connect to User Specific DB");
  }
}

// Get or create a database connection for a specific user
async function getDatabase(userId) {
  if (!userId) throw new Error("userId is required");

  try {
    const dbConnection = await initializeUserSpecificDbConnection(userId);
    
    // Ensure FolderModel is retrieved properly
    const WatchListModel = getWatchListModel(dbConnection);
    const FolderModel = getFolderModel(dbConnection);
    await initializeWatchLists(WatchListModel);
    await initializeFolder(FolderModel);


    console.log(`User ${userId} database initialized.`);
    return dbConnection; // Return full connection
  } catch (error) {
    console.error("Failed to get database for user:", error);
    throw error;
  }
}

// Close all MongoDB connections
async function closeMongoClient() {
  await mongoose.disconnect();
  console.log("All MongoDB connections closed.");
}

// Retrieve main user DB connection
async function getUserDB() {
  return userDbConnection ?? initializeUserDbConnection();
}

module.exports = { getDatabase, closeMongoClient, getUserDB, initializeUserDbConnection };
