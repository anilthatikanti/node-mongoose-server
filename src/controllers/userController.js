// controllers/userController.js
const userService = require("../services/userServices");

const userExistWithEmail = async (req, res) => {
  try {
    const userEmail = req.body.email;
    if (!userEmail) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const user = await userService.userExistCheck(userEmail);
    res.status(user.statusCode).json({ success: user.status, data: user.message });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const createUser = async (req, res) => {

  try {
    const userEmail = req.body.email;
    if (!userEmail) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const user = await userService.createUser(req);
    res.status(user.statusCode).json({ success: user.success, data: user.data || user.message });
  } catch (error) {
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

module.exports = { userExistWithEmail, createUser };
