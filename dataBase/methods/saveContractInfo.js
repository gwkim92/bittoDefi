const db = require("../models");
const contract = db.contract_infos;

async function saveContractInfo(chain, name, version, address, abi) {
  try {
    // Update the contract information if it exists or create a new one
    const [result, created] = await contract.upsert(
      {
        chain: chain,
        name: name,
        version: version,
        address: address,
        abi: abi,
      },
      { returning: true }
    );

    if (created) {
      console.log("Contract created successfully.");
    } else {
      console.log("Contract updated successfully.");
    }

    return result;
  } catch (err) {
    console.error("Failed to save or update contract:", err);
  }
}

module.exports = {
  saveContractInfo,
};
