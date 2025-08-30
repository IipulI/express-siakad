// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class KebutuhanKhusus extends Model {
    static associate(models) {
      this.belongsTo(models.Fakultas, {
        foreignKey: "siak_fakultas_id",
        as: "fakultas",
      });
    }
  }

  KebutuhanKhusus.init(
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

      modelName: "KebutuhanKhusus",
      tableName: "siak_kebutuhan_khusus",
    }
  );

  return KebutuhanKhusus;
};
