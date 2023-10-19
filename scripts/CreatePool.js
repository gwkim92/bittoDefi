const { ethers } = require("hardhat");
const dotenv = require("dotenv");
dotenv.config();
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");

// npx hardhat run scripts/CreatePool.js --network sepolia
///require renewal///
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

  const MultiDataConsumerV3ProxyDB = await contractDB.contracts.getContractInfo(
    "MultiDataConsumerV3Proxy"
  );
  const BittoPoolFactoryDB = await contractDB.contracts.getContractInfo(
    "BittoPoolFactory"
  );
  const BittoPoolLogicDB = await contractDB.contracts.getContractInfo(
    "BittoSwapPool"
  );

  let MultiDataConsumerV3ProxyAddress = await MultiDataConsumerV3ProxyDB
    .dataValues.address;
  let MultiDataConsumerV3Abi = await MultiDataConsumerV3ProxyDB.dataValues.abi;
  let BittoPoolFactoryAbi = await BittoPoolFactoryDB.dataValues.abi;
  let BittoPoolFactoryAddress = await BittoPoolFactoryDB.dataValues.address;
  let BittoPoolLogicAbi = await BittoPoolLogicDB.dataValues.abi;
  console.log(
    "MultiDataConsumerV3ProxyAddress : ",
    MultiDataConsumerV3ProxyAddress
  );
  console.log("===DataBase Setting End===");
  const poolFactoryInstance = new ethers.Contract(
    BittoPoolFactoryAddress,
    BittoPoolFactoryAbi,
    admin
  );
  const MultiDataConsumerV3ProxyInstance = new ethers.Contract(
    MultiDataConsumerV3ProxyAddress,
    MultiDataConsumerV3Abi,
    admin
  );

  const swapDB = await contractDB.contracts.getContractInfo(
    "BittoSwapContract"
  );

  let swapAddress = await swapDB.dataValues.address;

  return {
    poolFactoryInstance: poolFactoryInstance,
    MultiDataConsumerV3ProxyInstance: MultiDataConsumerV3ProxyInstance,
    adminAddress: adminAddress,
    swapAddress: swapAddress,
    BittoPoolFactoryAddress: BittoPoolFactoryAddress,
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
    BittoPoolLogicAbi: BittoPoolLogicAbi,
  };
}
async function createTokenPair(
  poolFactoryInstance,
  token1Address,
  token2Address,
  priceFeed1Address,
  priceFeed2Address,
  swapAddress
) {
  console.log("===create Pool Start===");
  console.log("swapAddress : ", swapAddress);
  let result = await poolFactoryInstance.createPool(
    token1Address,
    token2Address,
    priceFeed1Address, // Assuming this is the price feed for MockToken1
    priceFeed2Address, // Assuming this is the price feed for MockToken2
    swapAddress
  );

  console.log("Transaction hash:", result.hash);

  let receipt = await result.wait(); // Wait for the transaction to be mined.

  console.log("receipt : ", receipt);

  // Get a filter for the "PoolCreated" event.
  let filter = poolFactoryInstance.filters.PoolCreated();

  // Query the contract events with this filter.
  let events = await poolFactoryInstance.queryFilter(filter, "latest");

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
async function savePoolToDatabase(
  contractName,
  contractVersion,
  poolAddress,
  poolAbi
) {
  await contractDB.contracts.saveContractInfo(
    "eth",
    `${contractName}_pair`,
    contractVersion,
    poolAddress,
    poolAbi
  );
}

async function main() {
  try {
    let {
      poolFactoryInstance,
      MultiDataConsumerV3ProxyInstance,
      adminAddress,
      BittoPoolFactoryAddress,
      tokenAddresses,
      priceFeedAddresses,
      BittoPoolLogicAbi,
      swapAddress,
    } = await setup();
    let owner = await MultiDataConsumerV3ProxyInstance.owner();
    console.log(`The owner of the contract is: ${owner}`);
    // Check roles
    console.log("===Factory Role Check Start===");
    const CREATEPOOL_ROLE = ethers.keccak256(
      ethers.toUtf8Bytes("CREATEPOOL_ROLE")
    );
    let hasRole = await poolFactoryInstance.hasRole(
      CREATEPOOL_ROLE,
      adminAddress
    );
    console.log(`Does the admin have the CREATEPOOL_ROLE?: ${hasRole}`);

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
      BittoPoolFactoryAddress
    );
    console.log(
      `Does the BittoPoolFactoryAddress have the FEED_SETTER_ROLE?: ${hasRolesFactory}`
    );
    let hasRolesAdmin = await MultiDataConsumerV3ProxyInstance.hasRole(
      FEED_SETTER_ROLE,
      adminAddress
    );
    console.log(
      `Does the adminAddress have the FEED_SETTER_ROLE?: ${hasRolesAdmin}`
    );

    if (!hasRole) {
      console.error("The provided address does not have the required role!");
      process.exit(1);
    }
    console.log("===create Token Pair===");
    console.log(
      "address check : ",
      tokenAddresses[0],
      tokenAddresses[1],
      priceFeedAddresses[2],
      priceFeedAddresses[3]
    );

    let pair2Addrress = await createTokenPair(
      poolFactoryInstance,
      tokenAddresses[0],
      tokenAddresses[1],
      priceFeedAddresses[2],
      priceFeedAddresses[3],
      swapAddress
    );
    if (!pair2Addrress) throw new Error("Failed to create the pool.");

    await savePoolToDatabase(
      "ethLink_Pool",
      "1.0",
      pair2Addrress,
      BittoPoolLogicAbi
    );
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
