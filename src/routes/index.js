const express = require("express");
const firebaseAuthMiddleware = require("../middlewares/firebaseMiddleware");
const docsRoute = require("./docRoute");
const router = express.Router();
const path = require("path");

// Import route modules
const userRoutes = require("./userRoutes");
const fileManager = require("./fileManager");
const stockRoutes = require("./stockRoutes");

// Register route modules
router.use("/docs", docsRoute);
router.use("/stocks", firebaseAuthMiddleware, stockRoutes); // Routes starting with /stocks
router.use("/user", firebaseAuthMiddleware, userRoutes); // Routes starting with /users
router.use("/files", firebaseAuthMiddleware, fileManager); // Routes starting with /vaults

module.exports = router;
