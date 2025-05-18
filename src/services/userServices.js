// services/userService.js
const userRepository = require("../repositories/userRepository");

const userExistCheck = async (email) => {
  const userExist = await userRepository.checkUserExists(email);
  return userExist;
};

const createUser = async (req) => {

  try {
    // Create the user
    const user = await userRepository.createUser(
      req.body
    );

    return { success: true, data: user, statusCode: 201 };
  } catch (error) {
    console.error("Error creating user:", error.message);
    return { success: false, message: "Internal Server Error", statusCode: 500 };
  }
};

module.exports = { userExistCheck, createUser };