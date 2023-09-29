const { ethers } = require("hardhat");
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");
const getCommonInfo = require("./commonDbInfos");
const swapFactoryArtifacts = require("../artifacts/contracts/pool/BittoSwapFactory.sol/BittoSwapFactory.json");

// npx hardhat run scripts/poolLogic_Deploy.js --network sepolia
async function main() {
  const [owner, admin, user] = await ethers.getSigners();
  const commonInfo = await getCommonInfo();
  console.log(commonInfo.ownerAdress);

  const AdminAddressDb = await addressDB.addresss.getAddressInfo("admin");
  const bittoTokenDB = await contractDB.contracts.getContractInfo("Erc20Proxy");
  const nftDB = await contractDB.contracts.getContractInfo("LiquidityNFT");
  const priceOracleProxyDB = await contractDB.contracts.getContractInfo(
    "MultiDataConsumerV3Proxy"
  );
  const poolLogicDB = contractDB.contracts.getContractInfo("BittoSwapPool");
  let AdminAddress = AdminAddressDb.dataValues.address;
  let bitttoTokenAddress = bittoTokenDB.dataValues.address;
  let priceOracleAddress = priceOracleProxyDB.dataValues.address;
  let poolLogicAddress = poolLogicDB.dataValues.address;
  let nftAddress = nftDB.dataValues.address;

  const poolFactory = await ethers.deployContract("BittoSwapFactory", [
    priceOracleAddress,
    AdminAddress,
    poolLogicAddress,
    bitttoTokenAddress,
    nftAddress,
  ]);
  await poolFactory.waitForDeployment();
  const poolFactoryAddress = await poolFactory.getAddress();
  console.log("poolNftAddress  : ", poolFactoryAddress);

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

  // After deploying the factory contract...
  // setPrice Role Settings Factory
  await MultiDataConsumerV3ProxyImpl.grantFeedSetterRole(poolFactoryAddress);

  await contractDB.contracts.saveContractInfo(
    "eth",
    "BittoSwapFactory",
    "1.0",
    poolFactoryAddress,
    swapFactoryArtifacts.abi
  );
  console.log("== deploy completed ==");
}
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
