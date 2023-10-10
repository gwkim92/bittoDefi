const saveContractDB = require("../methods/saveContractInfo");
const getContractDB = require("../methods/getContractInfo");
const { sequelize } = require("../models");

module.exports = {
  contracts: {
    saveContractInfo: async (chain, name, version, address, abi) => {
      console.log("saveContractInfo", chain, name, version, address, abi);
      try {
        await sequelize.authenticate();
        console.log("connection to database");

        const result = await saveContractDB.saveContractInfo(
          chain,
          name,
          version,
          address,
          abi
        );
        console.log("result : ", result);

        return result;
      } catch (error) {
        console.log("error : ", error);
      }
    },

    getContractInfo: async (name) => {
      console.log("getContractInfo : ", name);
      try {
        await sequelize.authenticate();
        console.log("connection to database");

        const result = await getContractDB.getContractInfo(name);
        console.log("result : ", result);
        return result;
      } catch (error) {
        console.log("error : ", error);
      }
    },
  },
};
