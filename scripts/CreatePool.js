const { ethers } = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");
const BittoSwapFactoryArtifacts = require("../artifacts/contracts/swap/upgradeable/V2/BittoSwapFactory.sol/BittoSwapFactory.json");
const BittoSwapPoolArtifacts = require("../artifacts/contracts/swap/upgradeable/V2/BittoSwapPool.sol/BittoSwapPool.json");
// npx hardhat run scripts/CreatePool.js --network sepolia

async function setup() {
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

  return {
    swapFactoryInstance: swapFactoryInstance,
    MultiDataConsumerV3ProxyInstance: MultiDataConsumerV3ProxyInstance,
    adminAddress: adminAddress,
    BittoSwapFactoryAddress: BittoSwapFactoryAddress,
    tokenAddresses: [
      MockToken1Address,
      MockToken2Address,
      MockToken3Address,
      MockToken4Address,
      MockToken5Address,
    ],
    priceFeedAddresses: [
      btcUsdAddress,
      daiUsdAddress,
      ethUsdAddress,
      linkUsdAddress,
      usdcUsdAddress,
    ],
    BittoSwapStorageAddress: BittoSwapStorageAddress,
  };
}
async function createTokenPair(
  swapFactoryInstance,
  token1Address,
  token2Address,
  priceFeed1Address,
  priceFeed2Address,
  BittoSwapStorageAddress
) {
  let result = await swapFactoryInstance.createPool(
    token1Address,
    token2Address,
    priceFeed1Address, // Assuming this is the price feed for MockToken1
    priceFeed2Address, // Assuming this is the price feed for MockToken2
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
    let event = events[0];

    console.log("Event found: ", event);

    let poolAddress;

    if (event.args && event.args.pool) {
      poolAddress = event.args.pool;
    } else if (event.topics && event.topics[2]) {
      poolAddress = ethers.utils.getAddress(event.topics[2]);
    }

    console.log("The address of the newly created pool is:", poolAddress);

    return poolAddress;
  } else {
    throw new Error("'PoolCreated' event not found.");
  }
}
//db moduel
async function savePoolToDatabase(contractName, contractVersion, poolAddress) {
  await contractDB.contracts.saveContractInfo(
    "eth",
    `${contractName}_pair`,
    contractVersion,
    poolAddress,
    BittoSwapPoolArtifacts.abi
  );
}

async function main() {
  try {
    let {
      swapFactoryInstance,
      MultiDataConsumerV3ProxyInstance,
      adminAddress,
      BittoSwapFactoryAddress,
      tokenAddresses,
      priceFeedAddresses,
      BittoSwapStorageAddress,
    } = await setup();

    // Check roles

    console.log("===Check Role Start===");
    const SWAP_ADMIN_ROLE = ethers.keccak256(
      ethers.toUtf8Bytes("SWAP_ADMIN_ROLE")
    );
    let hasRole = await swapFactoryInstance.hasRole(
      SWAP_ADMIN_ROLE,
      adminAddress
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

    let pair2Addrress = await createTokenPair(
      swapFactoryInstance,
      tokenAddresses[2],
      tokenAddresses[3],
      priceFeedAddresses[2],
      priceFeedAddresses[3],
      BittoSwapStorageAddress
    );
    if (!pair2Addrress) throw new Error("Failed to create the pool.");

    await savePoolToDatabase("eth/link", "1.0", pair2Addrress);
  } catch (error) {
    console.error(`Error occurred: ${error.message}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
