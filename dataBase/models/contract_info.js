module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "contract_infos",
    {
      // id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      chain: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      version: { type: DataTypes.STRING, allowNull: false },
      address: { type: DataTypes.STRING, allowNull: false },
      abi: { type: DataTypes.JSON, allowNull: false },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    },
    {}
  );
};
