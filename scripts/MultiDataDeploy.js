const { ethers } = require("hardhat");
const contractDB = require("../dataBase/controller/contractController");
const addressDB = require("../dataBase/controller/addressController");
const MultiDataConsumerArtifacts = require("../artifacts/contracts/swap/tokenPrice/MultiDataConsumerV3.sol/MultiDataConsumerV3.json");
const MultiDataConsumerProxyArtifacts = require("../artifacts/contracts/swap/tokenPrice/MultiDataConsumerV3Proxy.sol/MultiDataConsumerV3Proxy.json");

// npx hardhat run scripts/MultiDataDeploy.js --network sepolia
async function main() {
  const OwnerAddressDB = await addressDB.addresss.getAddressInfo("owner");
  const AdminAddressDb = await addressDB.addresss.getAddressInfo("admin");
  let ownerAddress = OwnerAddressDB.dataValues.address;
  let adminAddress = AdminAddressDb.dataValues.address;
  const MultiDataConsumerV3 = await ethers.deployContract(
    "MultiDataConsumerV3"
  );
  await MultiDataConsumerV3.waitForDeployment();
  const MultiDataConsumerV3Address = await MultiDataConsumerV3.getAddress();
  console.log("MultiDataConsumerV3Address  : ", MultiDataConsumerV3Address);

  //initialize setting minter_role = minter,
  const encodedInitializeData =
    MultiDataConsumerV3.interface.encodeFunctionData("initialize", [
      adminAddress,
    ]);
  console.log("proxy deploy start", encodedInitializeData);

  const MultiDataConsumerProxyImpl = await ethers.deployContract(
    "MultiDataConsumerV3Proxy",
    [MultiDataConsumerV3Address, ownerAddress, encodedInitializeData]
  );
  await MultiDataConsumerProxyImpl.waitForDeployment();
  const MultiDataConsumerProxyAddress =
    await MultiDataConsumerProxyImpl.getAddress();

  await contractDB.contracts.saveContractInfo(
    "eth",
    "MultiDataConsumerV3",
    "1.0",
    MultiDataConsumerV3Address,
    MultiDataConsumerArtifacts.abi
  );

  await contractDB.contracts.saveContractInfo(
    "eth",
    "MultiDataConsumerV3Proxy",
    "1.0",
    MultiDataConsumerProxyAddress,
    MultiDataConsumerProxyArtifacts.abi
  );

  console.log("== deploy completed ==");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
