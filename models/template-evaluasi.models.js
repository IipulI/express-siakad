import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class TemplateEvaluasi extends Model {
  static associate(models) {
      // Langsung tembak relasinya, nggak usah pakai if lagi
      this.belongsTo(models.TahunKurikulum , { 
          foreignKey: "siak_tahun_kurikulum_id", 
          as: "tahunKurikulum" 
      });
      
      this.belongsTo(models.ProgramStudi, { 
          foreignKey: "siak_program_studi_id", 
          as: "programStudi" 
      });
    }
  }

  TemplateEvaluasi.init({
    id: { type: DataTypes.UUID, primaryKey: true, defaultValue: uuid7 },
    siakTahunKurikulumId: { type: DataTypes.UUID, allowNull: false, field: "siak_tahun_kurikulum_id" },
    siakProgramStudiId: { type: DataTypes.UUID, allowNull: false, field: "siak_program_studi_id" },
    jenisMataKuliah: { type: DataTypes.STRING, allowNull: false, field: "jenis_mata_kuliah" },
    
    // Perhatikan mapping ke UI:
    metodeEvaluasi: { type: DataTypes.STRING, allowNull: false, field: "metode_evaluasi" }, // UI: Komponen (TUGAS)
    jenisEvaluasi: { type: DataTypes.STRING, allowNull: false, field: "jenis_evaluasi" }, // UI: Metode (Kognitif)
    
    bobot: { type: DataTypes.DECIMAL(5,2), allowNull: false },
    syaratLulus: { 
        type: DataTypes.STRING(255),
        // Enum yang valid:
        //   'TIDAK_MENJADI_SYARAT_LULUS' → tidak menjadi syarat lulus  
        //   'MENJADI_SYARAT_LULUS'       → menjadi syarat lulus (wajib ditempuh)
        //   'LULUS_DENGAN_NILAI_MINIMUM' → wajib lulus dengan nilai minimum tertentu
        defaultValue: 'TIDAK_MENJADI_SYARAT_LULUS',
        field: "syarat_lulus" 
    },
    deskripsi: { type: DataTypes.TEXT, allowNull: true },
    deskripsiInggris: { type: DataTypes.TEXT, allowNull: true, field: "deskripsi_inggris" }
  }, {
    sequelize,
    underscored: true,
    timestamps: true,
    paranoid: true,
    tableName: "siak_template_evaluasi",
    modelName: "TemplateEvaluasi"
  });

  return TemplateEvaluasi;
};