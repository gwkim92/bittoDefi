const addressDB = require("../dataBase/controller/addressController");
const { ethers } = require("hardhat");

//  npx hardhat run scripts/roleAddressSetting.js --network sepolia
async function main() {
  const [owner, admin, user] = await ethers.getSigners();
  await addressDB.addresss.saveAddressInfo("eth", "owner", owner.address);
  await addressDB.addresss.saveAddressInfo("eth", "admin", admin.address);
  await addressDB.addresss.saveAddressInfo("eth", "user", user.address);
  const OwnerAddressDB = await addressDB.addresss.getAddressInfo("owner");
  const AdminAddressDb = await addressDB.addresss.getAddressInfo("admin");
  const UserAddressDb = await addressDB.addresss.getAddressInfo("user");
  let ownerAddress = OwnerAddressDB.dataValues.address;
  let adminAddress = AdminAddressDb.dataValues.address;
  let userAddress = UserAddressDb.dataValues.address;
  console.log(ownerAddress, adminAddress, userAddress);
}

main().then(() => process.exit(0));
