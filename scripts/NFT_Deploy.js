const { ethers } = require("hardhat");
const contractDB = require("../dataBase/controller/contractController");
const nftArtifacts = require("../artifacts/contracts/pool/LiquidityNFT.sol/LiquidityNFT.json");

// npx hardhat run scripts/NFT_Deploy.js --network sepolia
async function main() {
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
