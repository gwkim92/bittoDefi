const { ethers } = require("hardhat");
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");
const getCommonInfo = require("./commonDbInfos");
const poolArtifacts = require("../artifacts/contracts/pool/BittoSwapPool.sol/BittoSwapPool.json");

// npx hardhat run scripts/poolLogic_Deploy.js --network sepolia
async function main() {
  const poolLogic = await ethers.deployContract("BittoSwapPool");
  await poolLogic.waitForDeployment();
  const poolLogicAddress = await poolLogic.getAddress();
  console.log("poolLogicAddress  : ", poolLogicAddress);

  await contractDB.contracts.saveContractInfo(
    "eth",
    "BittoSwapPool",
    "1.0",
    poolLogicAddress,
    poolArtifacts.abi
  );
  console.log("== deploy completed ==");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
