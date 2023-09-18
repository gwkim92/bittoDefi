const db = require("../models");
const contract = db.address_infos;

async function getAddressInfo(name) {
  const addressInfo = await contract.findOne({ where: { name: name } });
  return addressInfo;
}

module.exports = {
  getAddressInfo,
};
