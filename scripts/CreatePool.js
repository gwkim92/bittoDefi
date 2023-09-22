const { ethers } = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");
const BittoSwapFactoryArtifacts = require("../artifacts/contracts/swap/upgradeable/V2/BittoSwapFactory.sol/BittoSwapFactory.json");
const BittoSwapPoolArtifacts = require("../artifacts/contracts/swap/upgradeable/V2/BittoSwapPool.sol/BittoSwapPool.json");
const BittoSwapPoolProxyArtifacts = require("../artifacts/contracts/swap/upgradeable/V2/BittoSwapPoolProxy.sol/BittoSwapPoolProxy.json");
const BittoSwapPoolStorageArtifacts = require("../artifacts/contracts/swap/upgradeable/V2/BittoSwapPoolStorage.sol/BittoSwapPoolStorage.json");

// npx hardhat run scripts/CreatePool.js --network sepolia

// SwapPoolAddress :  0x1790Bff4DC8571b79f8ccEb438B83248dAD423a0
// swapFactoryAddress :  0x2EE73945D51F30fefe90059d1220D8746cbEd27c
// SwapPoolStorageAddress :  0xb700fb3496F2e4602ede6e6905CA755F06f2A457

async function main() {
  const [owner, admin, user] = await ethers.getSigners();
  const OwnerAddressDB = await addressDB.addresss.getAddressInfo("owner");
  const AdminAddressDb = await addressDB.addresss.getAddressInfo("admin");
  let ownerAddress = OwnerAddressDB.dataValues.address;
  let adminAddress = AdminAddressDb.dataValues.address;
  btcUsdAddress = process.env.BTCUSDADDRESS;
  daiUsdAddress = process.env.DAIUSDADDERSS;
  ethUsdAddress = process.env.ETHUSDADDRESS;
  linkUsdAddress = process.env.LINKUSDADDRESS;
  usdcUsdAddress = process.env.USDCUSDADDRESS;

  const MockToken1DB = await contractDB.contracts.getContractInfo("MockToken1");
  const MockToken2DB = await contractDB.contracts.getContractInfo("MockToken2");
  const MockToken3DB = await contractDB.contracts.getContractInfo("MockToken3");
  const MockToken4DB = await contractDB.contracts.getContractInfo("MockToken4");
  const MockToken5DB = await contractDB.contracts.getContractInfo("MockToken5");
  let MockToken1Address = await MockToken1DB.dataValues.address;
  let MockToken2Address = await MockToken2DB.dataValues.address;
  let MockToken3Address = await MockToken3DB.dataValues.address;
  let MockToken4Address = await MockToken4DB.dataValues.address;
  let MockToken5Address = await MockToken5DB.dataValues.address;

  const MultiDataConsumerV3DB = await contractDB.contracts.getContractInfo(
    "MultiDataConsumerV3"
  );
  let MultiDataConsumerV3Abi = await MultiDataConsumerV3DB.dataValues.abi;

  const MultiDataConsumerV3ProxyDB = await contractDB.contracts.getContractInfo(
    "MultiDataConsumerV3Proxy"
  );
  let MultiDataConsumerV3ProxyAddress = await MultiDataConsumerV3ProxyDB
    .dataValues.address;
  console.log(
    "MultiDataConsumerV3ProxyAddress : ",
    MultiDataConsumerV3ProxyAddress
  );
  const BittoSwapFactoryDB = await contractDB.contracts.getContractInfo(
    "BittoSwapFactory"
  );
  let BittoSwapFactoryAbi = await BittoSwapFactoryDB.dataValues.abi;
  let BittoSwapFactoryAddress = await BittoSwapFactoryDB.dataValues.address;

  const BittoSwapStorageDB = await contractDB.contracts.getContractInfo(
    "BittoSwapStorage"
  );
  let BittoSwapStorageAddress = await BittoSwapStorageDB.dataValues.address;

  const BittoSwapPoolDB = await contractDB.contracts.getContractInfo(
    "BittoSwapPool"
  );

  console.log("===DataBase Setting End===");
  const swapFactoryInstance = new ethers.Contract(
    BittoSwapFactoryAddress,
    BittoSwapFactoryAbi,
    admin
  );
  const MultiDataConsumerV3ProxyInstance = new ethers.Contract(
    MultiDataConsumerV3ProxyAddress,
    MultiDataConsumerV3Abi,
    admin
  );

  console.log("===Check Role Start===");
  const SWAP_ADMIN_ROLE = ethers.keccak256(
    ethers.toUtf8Bytes("SWAP_ADMIN_ROLE")
  );
  let hasRole = await swapFactoryInstance.hasRole(
    SWAP_ADMIN_ROLE,
    admin.address
  );
  console.log(`Does the admin have the SWAP_ADMIN_ROLE?: ${hasRole}`);

  if (!hasRole) {
    console.error("The provided address does not have the required role!");
    process.exit(1);
  }

  console.log("===Check setPriceFeed Role Start===");

  const FEED_SETTER_ROLE = ethers.keccak256(
    ethers.toUtf8Bytes("FEED_SETTER_ROLE")
  );
  let hasRolesFactory = await MultiDataConsumerV3ProxyInstance.hasRole(
    FEED_SETTER_ROLE,
    BittoSwapFactoryAddress
  );
  console.log(
    `Does the BittoSwapFactoryAddress have the FEED_SETTER_ROLE?: ${hasRolesFactory}`
  );
  let hasRolesAdmin = await MultiDataConsumerV3ProxyInstance.hasRole(
    FEED_SETTER_ROLE,
    adminAddress
  );
  console.log(
    `Does the BittoSwapFactoryAddress have the FEED_SETTER_ROLE?: ${hasRolesAdmin}`
  );

  if (!hasRole) {
    console.error("The provided address does not have the required role!");
    process.exit(1);
  }

  console.log("===Create Pool Start===");

  console.log(
    "createPool Data Check : ",
    MockToken3Address,
    MockToken4Address,
    btcUsdAddress,
    daiUsdAddress,
    BittoSwapStorageAddress,
    MultiDataConsumerV3ProxyAddress,
    BittoSwapFactoryAddress
  );

  let result = await swapFactoryInstance.createPool(
    MockToken3Address,
    MockToken4Address,
    btcUsdAddress, // Assuming this is the price feed for MockToken1
    daiUsdAddress, // Assuming this is the price feed for MockToken2
    BittoSwapStorageAddress // The address of the already deployed BittoSwapStorage contract.
  );

  console.log("Transaction hash:", result.hash);

  let receipt = await result.wait(); // Wait for the transaction to be mined.

  console.log("receipt : ", receipt);
  // Get a filter for the "PoolCreated" event.
  let filter = swapFactoryInstance.filters.PoolCreated();

  // Query the contract events with this filter.
  let events = await swapFactoryInstance.queryFilter(filter, "latest");

  if (events.length > 0) {
    let event = events[0]; // If there are multiple events, you might need to find the correct one.

    console.log("Event found: ", event);

    let poolAddress;

    if (event.args && event.args.pool) {
      poolAddress = event.args.pool;
    } else if (event.topics && event.topics[2]) {
      // If the pool address is in the topics field.
      poolAddress = ethers.utils.getAddress(event.topics[2]);
    }

    console.log("The address of the newly created pool is:", poolAddress);
  } else {
    console.error("'PoolCreated' event not found.");
  }
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
