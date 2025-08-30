// /models/tahun-kurikulum.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class Rps extends Model {
    static associate(models) {
      // define assoc
      this.belongsTo(models.MataKuliah, {
        foreignKey: "siak_mata_kuliah_id",
        as: "mataKuliah",
      });
    }
  }

  Rps.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuid7,
      },
      siakMataKuliahId: {
        type: DataTypes.UUID,
        field: "siak_mata_kuliah_id",
      },
      tanggalPenyusunan: {
        allowNull: false,
        type: DataTypes.DATEONLY,
        field: "tanggal_penyusunan",
      },
      deskripsiMataKuliah: {
        allowNull: false,
        field: "deskripsi_mata_kuliah",
        type: DataTypes.TEXT,
      },
      tujuanMataKuliah: {
        allowNull: false,
        field: "tujuan_mata_kuliah",
        type: DataTypes.TEXT,
      },
      materiPembelajaran: {
        allowNull: false,
        field: "materi_pembelajaran",
        type: DataTypes.TEXT,
      },
      pustakaUtama: {
        allowNull: false,
        field: "pustaka_utama",
        type: DataTypes.TEXT,
      },
      pustakaPendukung: {
        allowNull: false,
        field: "pustaka_pendukung",
        type: DataTypes.TEXT,
      },
      dokumenRps: {
        allowNull: false,
        field: "dokumen_rps",
        type: DataTypes.TEXT,
      },
    },
    {
      sequelize,
      underscored: true,
      timestamps: true,
      paranoid: true,

      modelName: "Rps",
      tableName: "siak_rps",
    }
  );

  return Rps;
};
