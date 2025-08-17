// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class Pekerjaan extends Model {
    static associate(models) {}
  }

  Pekerjaan.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuid7,
      },

      nama: {
        type: DataTypes.STRING(75),
        allowNull: false,
      },
    },
    {
      sequelize,
      underscored: true,
      timestamps: true,
      paranoid: true,

      modelName: "Pekerjaan",
      tableName: "siak_pekerjaan",
    }
  );

  return Pekerjaan;
};
