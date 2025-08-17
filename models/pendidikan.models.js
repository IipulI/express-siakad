// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class Pendidikan extends Model {
    static associate(models) {}
  }

  Pendidikan.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuid7,
      },

      nama: {
        type: DataTypes.STRING(50),
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

      modelName: "Pendidikan",
      tableName: "siak_pendidikan",
    }
  );

  return Pendidikan;
};
