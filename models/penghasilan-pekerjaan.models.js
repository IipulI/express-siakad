// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class PenghasilanPekerjaan extends Model {
    static associate(models) {}
  }

  PenghasilanPekerjaan.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuid7,
      },

      range: {
        type: DataTypes.STRING(75),
        allowNull: false,
      },
    },
    {
      sequelize,
      underscored: true,
      timestamps: true,
      paranoid: true,

      modelName: "PenghasilanPekerjaan",
      tableName: "siak_penghasilan_pekerjaan",
    }
  );

  return PenghasilanPekerjaan;
};
