require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
// require("@nomiclabs/hardhat-ethers");

const {
  SEPOLIA_ALCHEMY_API_URL,
  SEPOLIA_INFURA_API_URL,
  SEPOLIA_DEPLOYER_PRIVATE_KEY,
  SEPOLIA_MINTER_PRIVATE_KEY,
  GOERIL_ALCHEMY_API_URL,
  GOERIL_INFURA_API_URL,
  GOERIL_DEPLOYER_PRIVATE_KEY,
  GOERIL_MINTER_PRIVATE_KEY,
} = process.env;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  // defaultNetwork: "sepolia",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: SEPOLIA_ALCHEMY_API_URL,
      accounts: [
        `0x${SEPOLIA_DEPLOYER_PRIVATE_KEY}`,
        `0x${SEPOLIA_MINTER_PRIVATE_KEY}`,
      ],
    },
    goeril: {
      url: GOERIL_INFURA_API_URL,
      accounts: [
        `0x${GOERIL_DEPLOYER_PRIVATE_KEY}`,
        `0x${GOERIL_MINTER_PRIVATE_KEY}`,
      ],
    },
  },
};
