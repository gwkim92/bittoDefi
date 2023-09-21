const { ethers } = require("hardhat");

const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");

require("../artifacts/contracts/swap/upgradeable/V2/BittoSwapFactory.sol");
require("../artifacts/contracts/swap/upgradeable/V2/BittoSwapPool.sol");
require("../artifacts/contracts/swap/upgradeable/V2/BittoSwapPoolProxy.sol");
require("../artifacts/contracts/swap/upgradeable/V2/BittoSwapPoolStorage.sol");
require("../artifacts/contracts/swap/upgradeable/V2/IERC20Extended.sol");
