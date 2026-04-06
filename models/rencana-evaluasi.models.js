import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class RencanaEvaluasi extends Model {
    static associate(models) {
      this.belongsTo(models.MataKuliah, {
        foreignKey: "siak_mata_kuliah_id",
        as: "mataKuliah",
      });
      // Relasi ke tabel pivot untuk menyimpan bobot CPMK
      this.hasMany(models.PemetaanEvaluasiCpmk, {
        foreignKey: "siak_rencana_evaluasi_id", 
        as: "pemetaanCpmk",
      });
      this.belongsTo(models.PeriodeAkademik, {
        foreignKey: "siak_periode_akademik_id",
        as: "periode",
    });
      
    }
  }

  RencanaEvaluasi.init({
    id: { 
        type: DataTypes.UUID, 
        primaryKey: true, 
        defaultValue: uuid7 
    },
    siakMataKuliahId: { 
        type: DataTypes.UUID, 
        allowNull: false, 
        field: "siak_mata_kuliah_id" 
    },
    metodeEvaluasi: { 
        type: DataTypes.STRING, 
        allowNull: true, 
        field: "metode_evaluasi" 
    },
    jenisEvaluasi: { 
        type: DataTypes.STRING, 
        allowNull: false, 
        field: "jenis_evaluasi" 
    },
    bobot: { 
        type: DataTypes.DECIMAL(5,2), // Pakai decimal untuk bobot 
        allowNull: false 
    },
    syaratLulus: { 
        type: DataTypes.BOOLEAN, 
        defaultValue: false, 
        field: "syarat_lulus" 
    },
    deskripsi: { 
        type: DataTypes.TEXT, 
        allowNull: true 
    },
    deskripsiInggris: { 
        type: DataTypes.TEXT, 
        allowNull: true, 
        field: "deskripsi_inggris" 
    },
    siakPeriodeAkademikId: { 
        type: DataTypes.UUID, 
        field: "siak_periode_akademik_id" 
    },
  }, {
    sequelize,
    underscored: true,
    timestamps: true,
    paranoid: true,
    tableName: "siak_rencana_evaluasi",
    modelName: "RencanaEvaluasi"
  });

  return RencanaEvaluasi;
};