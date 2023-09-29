const db = require("../models");
const contract = db.contract_infos;

async function getContractInfo(name) {
  const contractInfo = await contract.findOne({ where: { name: name } });
  return contractInfo;
}

module.exports = {
  getContractInfo,
};
