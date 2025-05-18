const path = require("path");
const env = require("dotenv");
const { name, version, repository } = require("../../package.json");

env.config({ path: path.join(__dirname, ".env") });

const port = process.env.PORT || 3000;

const swaggerDef = {
  openapi: "3.0.0",
  info: {
    title: `${name} API documentation`,
    version,
    license: {
      name: "MIT",
      url: repository.url || repository, // Ensure this works if `repository` is a string
    },
  },
  servers: [
    {
      url: `http://localhost:${port}`,
    },
  ],
};

module.exports = swaggerDef;
