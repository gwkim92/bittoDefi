const { ethers } = require("hardhat");

const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");
const SwapStorageAddressArtifacts = require("../artifacts/contracts/swap/upgradeable/BittoSwapStorage.sol/BittoSwapStorage.json");
const BittoSwapV1Artifacts = require("../artifacts/contracts/swap/upgradeable/BittoSwapV1.sol/bittoSwapV1.json");
const BittoSwapProxyArtifacts = require("../artifacts/contracts/swap/upgradeable/BittoSwapProxy.sol/BittoSwapProxy.json");

// npx hardhat run scripts/SwapDeploy.js --network sepolia
async function main() {
  const OwnerAddressDB = await addressDB.addresss.getAddressInfo("owner");
  const AdminAddressDb = await addressDB.addresss.getAddressInfo("admin");
  let ownerAddress = OwnerAddressDB.dataValues.address;
  let adminAddress = AdminAddressDb.dataValues.address;

  const MultiDataConsumerV3ProxyDB = await contractDB.contracts.getContractInfo(
    "MultiDataConsumerV3Proxy"
  );
  let MultiDataConsumerV3ProxyAddress =
    MultiDataConsumerV3ProxyDB.dataValues.address;
  //swapStorage
  const swapStorageImpl = await ethers.deployContract("BittoSwapStorage", [
    ownerAddress,
  ]);
  await swapStorageImpl.waitForDeployment();
  const swapStorageAddress = await swapStorageImpl.getAddress();

  console.log("swapStorageAddress : ", swapStorageAddress);

  const BittoSwapV1Impl = await ethers.deployContract("bittoSwapV1");
  await BittoSwapV1Impl.waitForDeployment();
  const swapAddress = await BittoSwapV1Impl.getAddress();

  const encodedInitializeSwapData =
    BittoSwapV1Impl.interface.encodeFunctionData("initialize", [
      MultiDataConsumerV3ProxyAddress,
      swapStorageAddress,
      adminAddress,
    ]);

  const BittoSwapProxyImpl = await ethers.deployContract("BittoSwapProxy", [
    swapAddress,
    ownerAddress,
    encodedInitializeSwapData,
  ]);

  await BittoSwapProxyImpl.waitForDeployment();

  const swapProxyAddress = await BittoSwapProxyImpl.getAddress();

  await contractDB.contracts.saveContractInfo(
    "eth",
    "BittoSwapStorage",
    "1.0",
    swapStorageAddress,
    SwapStorageAddressArtifacts.abi
  );

  await contractDB.contracts.saveContractInfo(
    "eth",
    "bittoSwapV1",
    "1.0",
    swapAddress,
    BittoSwapV1Artifacts.abi
  );

  await contractDB.contracts.saveContractInfo(
    "eth",
    "BittoSwapProxy",
    "1.0",
    swapProxyAddress,
    BittoSwapProxyArtifacts.abi
  );

  console.log("== deploy completed ==");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
