// services/s3Client.ts
const AWS = require('aws-sdk');
require("aws-sdk/lib/maintenance_mode_message").suppress = true;
const dotenv = require('dotenv');

dotenv.config();

const s3 = new AWS.S3({
  credentials: {
    accessKeyId: process.env.ACCESS_KEY,
    secretAccessKey: process.env.SECRET_KEY,
  },
  region: process.env.REGION,
});

module.exports = s3;
