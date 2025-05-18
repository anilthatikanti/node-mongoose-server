const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config();

function unescapePrivateKey(key) {
  // Convert literal \n in the env var to real newlines
  return key.replace(/\\n/g, "\n");
}

const firebaseConfig = {
  type: process.env.FIREBASE_TYPE,
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: unescapePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: process.env.FIREBASE_AUTH_URI,
  token_uri: process.env.FIREBASE_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL,
  universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN,
};

const targetPath = path.join(__dirname, "admin-setup", "firebase.service.account.json");

// Make sure the directory exists or create it
const dir = path.dirname(targetPath);

if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

fs.writeFile(targetPath, JSON.stringify(firebaseConfig, null, 2), (err) => {
  if (err) {
    console.error("❌ Error writing firebase service account JSON:", err);
    process.exit(1);
  } else {
    console.log("✅ Successfully generated firebase.service.account.json");
  }
});
