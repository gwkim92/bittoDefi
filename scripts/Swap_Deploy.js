const { ethers } = require("hardhat");
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");
const getCommonInfo = require("./commonDbInfos");
const sawpArtifacts = require("../artifacts/contracts/swap/BittoSwapContract.sol/BittoSwapContract.json");

// npx hardhat run scripts/Swap_Deploy.js --network sepolia

async function main() {
  const [owner, admin, user] = await ethers.getSigners();
  // const commonInfo = await getCommonInfo();
  // console.log(commonInfo.ownerAdress);

  const AdminAddressDb = await addressDB.addresss.getAddressInfo("admin");
  const bittoSwapFactoryDB = await contractDB.contracts.getContractInfo(
    "BittoPoolFactory"
  );
  const priceOracleDB = await contractDB.contracts.getContractInfo(
    "MultiDataConsumerV3Proxy"
  );

  let swapFactoryAddress = bittoSwapFactoryDB.dataValues.address;
  let priceOracleAddress = priceOracleDB.dataValues.address;

  const swapImpl = await ethers.deployContract("BittoSwapContract", [
    swapFactoryAddress,
    priceOracleAddress,
  ]);

  await swapImpl.waitForDeployment();
  const swapAddress = await swapImpl.getAddress();
  console.log("swap Address  : ", swapAddress);

  await contractDB.contracts.saveContractInfo(
    "eth",
    "BittoSwapContract",
    "1.0",
    swapAddress,
    sawpArtifacts.abi
  );
  console.log("== deploy completed ==");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
