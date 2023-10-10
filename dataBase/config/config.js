const dotenv = require("dotenv");
dotenv.config();

const contractDB = {
  username: process.env.HARDHAT_USERNAME,
  password: process.env.HARDHAT_PASSWORD,
  database: process.env.HARDHAT_NAME,
  host: process.env.HARDHAT_HOST,
  dialect: "mysql",
};

module.exports = {
  development: contractDB,
};
