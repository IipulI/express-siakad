// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { sequelize } from "../config/database.js";
import { v7 as uuid7 } from "uuid";

class FakultasModels extends Model {}

FakultasModels.init(
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

    modelName: "Fakultas",
    tableName: "siak_fakultas",
  }
);

export default FakultasModels;
