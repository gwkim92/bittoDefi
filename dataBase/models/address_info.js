module.exports = (sequelize, DataTypes) => {
  return sequelize.define(
    "address_infos",
    {
      // id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
      chain: { type: DataTypes.STRING, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false, unique: true },
      address: { type: DataTypes.STRING, allowNull: false },
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
