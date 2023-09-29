const { ethers } = require("hardhat");
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");
const dotenv = require("dotenv");
dotenv.config();

async function getCommonInfo() {
  const OwnerAddressDB = await addressDB.addresss.getAddressInfo("owner");
  const AdminAddressDb = await addressDB.addresss.getAddressInfo("admin");
  let ownerAddress = OwnerAddressDB.dataValues.address;
  let adminAddress = AdminAddressDb.dataValues.address;

  // Price Oracle Token Address
  btcUsdAddress = process.env.BTCUSDADDRESS;
  daiUsdAddress = process.env.DAIUSDADDERSS;
  ethUsdAddress = process.env.ETHUSDADDRESS;
  linkUsdAddress = process.env.LINKUSDADDRESS;
  usdcUsdAddress = process.env.USDCUSDADDRESS;

  //bitton Token abi, address

  const BittoTokenDB = await contractDB.contracts.getContractInfo("ERC20V2");
  let bittoTokenAbi = BittoTokenDB.dataValues.abi;

  return {
    ownerAddress,
    adminAddress,
    btcUsdAddress,
    daiUsdAddress,
    ethUsdAddress,
    linkUsdAddress,
    usdcUsdAddress,
    bittoTokenAddress,
    bittoTokenAbi,
  };
}

module.exports.getCommonInfo = getCommonInfo;
