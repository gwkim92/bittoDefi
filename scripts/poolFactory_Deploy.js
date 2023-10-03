const { ethers } = require("hardhat");
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");
const swapFactoryArtifacts = require("../artifacts/contracts/pool/BittoPoolFactory.sol/BittoPoolFactory.json");

// npx hardhat run scripts/poolFactory_Deploy.js --network sepolia
async function main() {
  const [owner, admin, user] = await ethers.getSigners();

  const AdminAddressDb = await addressDB.addresss.getAddressInfo("admin");
  const bittoTokenDB = await contractDB.contracts.getContractInfo("Erc20Proxy");
  const nftDB = await contractDB.contracts.getContractInfo("LiquidityNFT");
  const priceOracleProxyDB = await contractDB.contracts.getContractInfo(
    "MultiDataConsumerV3Proxy"
  );
  const poolLogicDB = await contractDB.contracts.getContractInfo(
    "BittoSwapPool"
  );
  let AdminAddress = AdminAddressDb.dataValues.address;
  let bitttoTokenAddress = bittoTokenDB.dataValues.address;
  let priceOracleAddress = priceOracleProxyDB.dataValues.address;
  let priceOracleAbi = priceOracleProxyDB.dataValues.abi;
  let nftAddress = nftDB.dataValues.address;
  let poolLogicAddress = poolLogicDB.dataValues.address;

  const poolFactory = await ethers.deployContract("BittoPoolFactory", [
    priceOracleAddress,
    AdminAddress,
    poolLogicAddress,
    bitttoTokenAddress,
    nftAddress,
  ]);
  await poolFactory.waitForDeployment();
  const poolFactoryAddress = await poolFactory.getAddress();
  console.log("poolNftAddress  : ", poolFactoryAddress);

  //proxyAddress, logicAbi, Admin
  const MultiDataConsumerV3ProxyImpl = new ethers.Contract(
    priceOracleAddress,
    priceOracleAbi,
    admin
  );

  // After deploying the factory contract...
  // setPrice Role Settings Factory
  await MultiDataConsumerV3ProxyImpl.grantFeedSetterRole(poolFactoryAddress);

  await contractDB.contracts.saveContractInfo(
    "eth",
    "BittoPoolFactory",
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
