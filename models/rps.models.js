import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class Rps extends Model {
    static associate(models) {
      this.belongsTo(models.MataKuliah, { foreignKey: "siak_mata_kuliah_id", as: "mataKuliah" });
      this.belongsTo(models.PeriodeAkademik, { foreignKey: "siak_periode_akademik_id", as: "periode" });
    }
  }

  Rps.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: uuid7 },
    siakMataKuliahId: { type: DataTypes.UUID, field: "siak_mata_kuliah_id" },
    siakPeriodeAkademikId: { type: DataTypes.UUID, field: "siak_periode_akademik_id" }, // Untuk pilihan periode saat cetak
    tanggalPenyusunan: { type: DataTypes.DATEONLY, field: "tanggal_penyusunan" },
    deskripsiMataKuliah: { type: DataTypes.TEXT, field: "deskripsi_mata_kuliah" },
    deskripsiMataKuliahEng: { type: DataTypes.TEXT, field: "deskripsi_mata_kuliah_eng" }, // Tambahan ENG
    tujuanMataKuliah: { type: DataTypes.TEXT, field: "tujuan_mata_kuliah" },
    materiPembelajaran: { type: DataTypes.TEXT, field: "materi_pembelajaran" },
    pustakaUtama: { type: DataTypes.TEXT, field: "pustaka_utama" },
    pustakaPendukung: { type: DataTypes.TEXT, field: "pustaka_pendukung" },
    mediaPerangkatLunak: { type: DataTypes.TEXT, field: "media_perangkat_lunak" }, // Tambahan Media
    mediaPerangkatKeras: { type: DataTypes.TEXT, field: "media_perangkat_keras" }, // Tambahan Media
    dokumenRps: { type: DataTypes.TEXT, field: "dokumen_rps" },
  }, {
    sequelize,
    underscored: true,
    modelName: "Rps",
    tableName: "siak_rps",
  });
  return Rps;
};