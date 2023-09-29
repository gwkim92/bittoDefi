const { expect } = require("chai");
const { ethers } = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");

///////////////////working_0922/////////////
async function getSigners() {
  const [owner, admin, user] = await ethers.getSigners();
  return { owner, admin, user };
}

describe("MultiDataConsumerV3 and BittoSwapV1", function () {
  this.timeout(1200000);
  let ownerAddress, adminAddress, userAddress;
  before(async function () {
    ({ owner, admin, user } = await getSigners());
    const OwnerAddressDB = await addressDB.addresss.getAddressInfo("owner");
    const AdminAddressDb = await addressDB.addresss.getAddressInfo("admin");
    const UserAddressDb = await addressDB.addresss.getAddressInfo("user");
    ownerAddress = OwnerAddressDB.dataValues.address;
    adminAddress = AdminAddressDb.dataValues.address;
    userAddress = UserAddressDb.dataValues.address;

    // price oracle Db get
    const MultiDataConsumerV3DB = await contractDB.contracts.getContractInfo(
      "MultiDataConsumerV3"
    );
    const MultiDataConsumerV3ProxyDB =
      await contractDB.contracts.getContractInfo("MultiDataConsumerV3Proxy");

    // Swap contract Db get
    const BittoSwapFactoryDB = await contractDB.contracts.getContractInfo(
      "BittoSwapFactory"
    );
    const BittoSwapPoolDB = await contractDB.contracts.getContractInfo(
      "BittoSwapPool"
    );
    const BittoSwapStorageDB = await contractDB.contracts.getContractInfo(
      "BittoSwapStorage"
    );

    priceAbi = await MultiDataConsumerV3DB.dataValues.abi;
    priceProxyAddress = await MultiDataConsumerV3ProxyDB.dataValues.address;

    priceInstance = new ethers.Contract(priceProxyAddress, priceAbi, admin);
  });
});
