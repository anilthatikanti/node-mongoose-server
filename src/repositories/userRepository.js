const { admin } = require("../../admin-setup/firebase-initialize");
const UserIdGeneratorService = require("../utills/generateUserId");
const getUserModel = require("../models/userModel");

// Check if a user exists in Firebase Authentication
const checkUserExists = async (email) => {
  try {
    await admin.auth().getUserByEmail(email);
    return { status: true, message: "User already exists", statusCode: 200 };
  } catch (error) {
    if (error.code === "auth/user-not-found") {
      return { status: false, message: "User does not exist", statusCode: 404 };
    } else {
      return { status: false, message: "An unexpected error occurred", statusCode: 500 };
    }
  }
};

// Create a new user in MongoDB and add custom claims in Firebase Authentication
const createUser = async (body) => {
  try {
    // Generate a unique user ID
    const User = await getUserModel();
    const userIdGenerator = new UserIdGeneratorService("U");
    const userId = await userIdGenerator.generateUserId();
    // Create the user in the MongoDB database
    const user = await User.findOneAndUpdate(
      { email:body.email },
      {userId: userId,
      name: body.displayName,
      email: body.email,
      isVerified: body.emailVerified,
    },
    { new: true, upsert: true } )

    return user;
  } catch (error) {
    console.error("Error creating user:", error.message);
    throw error;
  }
};

module.exports = { checkUserExists, createUser };

