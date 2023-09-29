const { ethers } = require("hardhat");
const contractDB = require("../dataBase/controller/contractController");
const MockTokenArtifacts = require("../artifacts/contracts/swap/tokenSample/MockToken.sol/MockToken.json");

// npx hardhat run scripts/SampleTokenDeploy.js --network sepolia
async function main() {
  const MockToken1Impl = await ethers.deployContract("MockToken", [
    "mock",
    "mock",
  ]);
  await MockToken1Impl.waitForDeployment();
  const MockToken1Address = await MockToken1Impl.getAddress();

  const MockToken2Impl = await ethers.deployContract("MockToken", [
    "mock",
    "mock",
  ]);
  await MockToken2Impl.waitForDeployment();
  const MockToken2Address = await MockToken2Impl.getAddress();

  const MockToken3Impl = await ethers.deployContract("MockToken", [
    "mock",
    "mock",
  ]);
  await MockToken3Impl.waitForDeployment();
  const MockToken3Address = await MockToken3Impl.getAddress();

  const MockToken4Impl = await ethers.deployContract("MockToken", [
    "mock",
    "mock",
  ]);
  await MockToken4Impl.waitForDeployment();
  const MockToken4Address = await MockToken4Impl.getAddress();

  const MockToken5Impl = await ethers.deployContract("MockToken", [
    "mock",
    "mock",
  ]);
  await MockToken5Impl.waitForDeployment();
  const MockToken5Address = await MockToken5Impl.getAddress();

  await contractDB.contracts.saveContractInfo(
    "eth",
    "MockToken1",
    "1.0",
    MockToken1Address,
    MockTokenArtifacts.abi
  );

  await contractDB.contracts.saveContractInfo(
    "eth",
    "MockToken2",
    "1.0",
    MockToken2Address,
    MockTokenArtifacts.abi
  );
  await contractDB.contracts.saveContractInfo(
    "eth",
    "MockToken3",
    "1.0",
    MockToken3Address,
    MockTokenArtifacts.abi
  );
  await contractDB.contracts.saveContractInfo(
    "eth",
    "MockToken4",
    "1.0",
    MockToken4Address,
    MockTokenArtifacts.abi
  );
  await contractDB.contracts.saveContractInfo(
    "eth",
    "MockToken5",
    "1.0",
    MockToken5Address,
    MockTokenArtifacts.abi
  );

  console.log("== deploy completed ==");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
