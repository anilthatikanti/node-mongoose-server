const { admin } = require("../../admin-setup/firebase-initialize");
const { getDatabase } = require("../config/mongoDBConnections");
const { createUser } = require("../repositories/userRepository");
const getUserModel = require("../models/userModel");

const firebaseMiddleware = async (req, res, next) => {
  try {
    const idToken = req.headers.authorization?.split(" ")[1];
    if (!idToken) throw { status: 401, message: "Unauthorized: Invalid token" };

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUser = await admin.auth().getUser(decodedToken.uid);
    if (!decodedToken.email) throw { status: 400, message: "Invalid token: Email not found" };
    // Get or create user
    const User = await getUserModel();
    let user = await User.findOne({ email: decodedToken.email }) || await createUser(firebaseUser);

    const userId = user.userId;
    // Connect to user's database
    req.userDbConnection = await getDatabase(userId);
    req.user = { ...decodedToken };
    req.userId = userId;
    console.log("Connected Successfully to MongoDB");
    res.on("finish", async () => {
      if (req.userDbConnection) {
        req.userDbConnection
          .close()
          .then(() => console.log(`Closed DB connection for user ${userId}`))
          .catch((err) => console.error("Error closing user DB connection:", err));
      }
    });
  
    next();
  } catch (error) {
    console.error("Firebase Middleware Error:", error);
    const status = error.status || (error.codePrefix === "auth" ? 401 : 500);
    res.status(status).send(error.message || "Internal Server Error");
  }
};

module.exports = firebaseMiddleware;
