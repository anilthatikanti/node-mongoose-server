const express = require("express");
const firebaseAuthMiddleware = require("../middlewares/firebaseMiddleware");
const docsRoute = require('./docRoute');
const router = express.Router();
const path = require('path');

// Import route modules
const userRoutes = require("./userRoutes");
const fileManager = require("./fileManager");
const stockRoutes = require("./stockRoutes");

// Register route modules
router.use("/docs", docsRoute);
router.use("/stocks", firebaseAuthMiddleware, stockRoutes); // Routes starting with /stocks
router.use("/user", firebaseAuthMiddleware, userRoutes); // Routes starting with /users
router.use("/files", firebaseAuthMiddleware, fileManager); // Routes starting with /vaults

// Serve the test client
// router.get('/test-client', (req, res) => {
//     res.sendFile(path.join(__dirname, '../html-content/test-client.html'));
// });

module.exports = router;