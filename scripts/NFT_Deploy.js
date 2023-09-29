const { ethers } = require("hardhat");
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");
const getCommonInfo = require("./commonDbInfos");
const nftArtifacts = require("../artifacts/contracts/pool/LiquidityNFT.sol/LiquidityNFT.json");

// npx hardhat run scripts/NFT_Deploy.js --network sepolia
async function main() {
  //   const commonInfo = await getCommonInfo();
  //   console.log(commonInfo.ownerAdress);

  const poolNft = await ethers.deployContract("LiquidityNFT");
  await poolNft.waitForDeployment();
  const poolNftAddress = await poolNft.getAddress();
  console.log("poolNftAddress  : ", poolNftAddress);

  await contractDB.contracts.saveContractInfo(
    "eth",
    "LiquidityNFT",
    "1.0",
    poolNftAddress,
    nftArtifacts.abi
  );
  console.log("== deploy completed ==");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
