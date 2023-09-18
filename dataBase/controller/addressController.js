const saveAddressDB = require("../methods/saveAddressInfo");
const getAddresDB = require("../methods/getAddressInfo");
const { sequelize } = require("../models");

module.exports = {
  addresss: {
    saveAddressInfo: async (chain, name, address) => {
      console.log("saveAddressInfo", chain, name, address);
      try {
        await sequelize.authenticate();
        console.log("connection to database");

        const result = await saveAddressDB.saveAddressInfo(
          chain,
          name,
          address
        );
        console.log("result : ", result);

        return result;
      } catch (error) {
        console.log("error : ", error);
      }
    },

    getAddressInfo: async (name) => {
      console.log("getAddressInfo : ", name);
      try {
        await sequelize.authenticate();
        console.log("connection to database");

        const result = await getAddresDB.getAddressInfo(name);
        console.log("result : ", result);
        return result;
      } catch (error) {
        console.log("error : ", error);
      }
    },
  },
};
