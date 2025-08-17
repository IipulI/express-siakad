// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class Jenjang extends Model {
    static associate(models) {}
  }

  Jenjang.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuid7,
      },
      nama: {
        type: DataTypes.STRING(30),
        allowNull: false,
      },
      jenjang: {
        type: DataTypes.STRING(10),
        allowNull: false,
      },
    },
    {
      sequelize,
      underscored: true,
      timestamps: true,
      paranoid: true,

      modelName: "Jenjang",
      tableName: "siak_jenjang",
    }
  );

  return Jenjang;
};
