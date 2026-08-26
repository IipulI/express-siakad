// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class KebutuhanKhusus extends Model {
    static associate(models) {
      // Tidak ada relasi ke Fakultas: tabel siak_kebutuhan_khusus tidak punya kolom siak_fakultas_id.
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
