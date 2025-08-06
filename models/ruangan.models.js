// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { v7 as uuid7 } from "uuid";
import FakultasModels from "./fakultas.model.js";

class RuanganModels extends Model {}

RuanganModels.init(
  {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: uuid7,
    },
    siakFakultasId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: "siak_fakultas_id",
      references: {
        model: FakultasModels,
        key: "id",
      },
    },
    nama: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    ruangan: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    kapasitas: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
    },
    lantai: {
      type: DataTypes.INTEGER(4),
      allowNull: false,
    },
  },
  {
    sequelize,
    underscored: true,
    timestamps: true,
    paranoid: true,

    modelName: "Ruangan",
    tableName: "siak_ruangan",
  }
);

RuanganModels.belongsTo(FakultasModels, {
  foreignKey: "siak_fakultas_id",
  //   targetKey: "id",
});

export default RuanganModels;
