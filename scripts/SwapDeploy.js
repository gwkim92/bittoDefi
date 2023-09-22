const { ethers } = require("hardhat");

const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");

const BittoSwapFactoryArtifacts = require("../artifacts/contracts/swap/upgradeable/V2/BittoSwapFactory.sol/BittoSwapFactory.json");
const BittoSwapPoolArtifacts = require("../artifacts/contracts/swap/upgradeable/V2/BittoSwapPool.sol/BittoSwapPool.json");
const BittoSwapPoolProxyArtifacts = require("../artifacts/contracts/swap/upgradeable/V2/BittoSwapPoolProxy.sol/BittoSwapPoolProxy.json");
const BittoSwapPoolStorageArtifacts = require("../artifacts/contracts/swap/upgradeable/V2/BittoSwapPoolStorage.sol/BittoSwapPoolStorage.json");

// npx hardhat run scripts/SwapDeploy.js --network sepolia
async function main() {
  const [owner, admin, user] = await ethers.getSigners();
  const OwnerAddressDB = await addressDB.addresss.getAddressInfo("owner");
  const AdminAddressDb = await addressDB.addresss.getAddressInfo("admin");
  let ownerAddress = OwnerAddressDB.dataValues.address;
  let adminAddress = AdminAddressDb.dataValues.address;

  const MultiDataConsumerV3DB = await contractDB.contracts.getContractInfo(
    "MultiDataConsumerV3"
  );
  let MultiDataConsumerV3Abi = MultiDataConsumerV3DB.dataValues.abi;
  const MultiDataConsumerV3ProxyDB = await contractDB.contracts.getContractInfo(
    "MultiDataConsumerV3Proxy"
  );
  let MultiDataConsumerV3ProxyAddress =
    MultiDataConsumerV3ProxyDB.dataValues.address;

  //proxyAddress, logicAbi, Admin
  const MultiDataConsumerV3ProxyImpl = new ethers.Contract(
    MultiDataConsumerV3ProxyAddress,
    MultiDataConsumerV3Abi,
    admin
  );

  //swap pool deploy
  //not need
  const SwapPoolImpl = await ethers.deployContract("BittoSwapPool");
  await SwapPoolImpl.waitForDeployment();
  const SwapPoolAddress = await SwapPoolImpl.getAddress();

  //swap Factory deploy
  //need price oracle, pool logic
  const swapFactoryImpl = await ethers.deployContract("BittoSwapFactory", [
    MultiDataConsumerV3ProxyAddress,
    adminAddress,
    SwapPoolAddress,
  ]);
  await swapFactoryImpl.waitForDeployment();
  const swapFactoryAddress = await swapFactoryImpl.getAddress();

  // After deploying the factory contract...
  await MultiDataConsumerV3ProxyImpl.grantFeedSetterRole(swapFactoryAddress);

  //swap storage deploy
  const SwapPoolStorageImpl = await ethers.deployContract(
    "BittoSwapPoolStorage",
    [adminAddress]
  );
  await SwapPoolStorageImpl.waitForDeployment();
  const SwapPoolStorageAddress = await SwapPoolStorageImpl.getAddress();

  console.log("SwapPoolAddress : ", SwapPoolAddress);
  console.log("swapFactoryAddress : ", swapFactoryAddress);
  console.log("SwapPoolStorageAddress : ", SwapPoolStorageAddress);

  await contractDB.contracts.saveContractInfo(
    "eth",
    "BittoSwapPool",
    "1.0",
    SwapPoolAddress,
    BittoSwapPoolArtifacts.abi
  );

  await contractDB.contracts.saveContractInfo(
    "eth",
    "BittoSwapFactory",
    "1.0",
    swapFactoryAddress,
    BittoSwapFactoryArtifacts.abi
  );

  await contractDB.contracts.saveContractInfo(
    "eth",
    "BittoSwapStorage",
    "1.0",
    SwapPoolStorageAddress,
    BittoSwapPoolStorageArtifacts.abi
  );
  console.log("== deploy completed ==");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
