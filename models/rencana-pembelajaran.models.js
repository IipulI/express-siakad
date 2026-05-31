import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class RencanaPembelajaran extends Model {
    static associate(models) {
      this.belongsTo(models.MataKuliah, { foreignKey: "siak_mata_kuliah_id", as: "mataKuliah" });
      this.belongsTo(models.PeriodeAkademik, { foreignKey: "siak_periode_akademik_id", as: "periode" });
      
      // Relasi untuk Checkbox Mapping CPMK
      this.hasMany(models.PemetaanPembelajaranCpmk, { 
          foreignKey: "siak_rencana_pembelajaran_id", 
          as: "pemetaanCpmk" 
      });
    }
  }

  RencanaPembelajaran.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: uuid7 },
    siakMataKuliahId: { type: DataTypes.UUID, field: "siak_mata_kuliah_id" },
    siakPeriodeAkademikId: { type: DataTypes.UUID, field: "siak_periode_akademik_id" },
    sesi: { type: DataTypes.INTEGER, allowNull: false },
    jenisPertemuan: { type: DataTypes.STRING, field: "jenis_pertemuan" },
    materiPembelajaran: { type: DataTypes.TEXT, field: "materi_pembelajaran" },
    materiPembelajaranEng: { type: DataTypes.TEXT, field: "materi_pembelajaran_eng" },
    indikatorPenilaian: { type: DataTypes.TEXT, field: "indikator_penilaian" },
    kriteriaPenilaian: { type: DataTypes.TEXT, field: "kriteria_penilaian" },
    metodePembelajaranLuring: { type: DataTypes.TEXT, field: "metode_pembelajaran_luring" },
    metodePembelajaranDaring: { type: DataTypes.TEXT, field: "metode_pembelajaran_daring" },
    bobotPenilaian: { type: DataTypes.DECIMAL(5,2), field: "bobot_penilaian" },
    
    // Kolom lama dibiarkan dulu biar nggak error kalau ada sisa data
    cpmkSubCpmk: { type: DataTypes.TEXT, field: "cpmk_sub_cpmk" },
    metodePembelajaran: { type: DataTypes.TEXT, field: "metode_pembelajaran" }
  }, {
    sequelize,
    underscored: true,
    modelName: "RencanaPembelajaran",
    tableName: "siak_rencana_pembelajaran",
  });
  return RencanaPembelajaran;
};