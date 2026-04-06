// /models/program-studi.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class ProgramStudi extends Model {
    static associate(models) {
      this.belongsTo(models.Fakultas, {
        foreignKey: "siak_fakultas_id",
      });

     this.belongsTo(models.Jenjang, { 
        foreignKey: "siak_jenjang_id", // Pastikan nama kolom di DB sesuai
        as: "jenjang" 
      });

     this.belongsTo(models.Dosen, { 
        foreignKey: 'kaprodi_id', // UBAH JIKA NAMA KOLOM DI DB BEDA (misal: 'siak_dosen_id')
        as: 'kaprodi' 
    });
    }
  }

  ProgramStudi.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuid7,
      },
      siakFakultasId: {
        type: DataTypes.UUID,
        field: "siak_fakultas_id", // <-- Tanpa 's'
      },
      siakJenjangId: {
        type: DataTypes.UUID,
        field: "siak_jenjang_id", // <-- Tanpa 's'
      },
      nama: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      kode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      kaprodiId: {
        type: DataTypes.UUID,
        field: "kaprodi_id", // Harus sama persis dengan nama kolom di DB
        allowNull: true,
      },
    },
    {
      sequelize,
      underscored: true,
      timestamps: true,
      paranoid: true,

      modelName: "ProgramStudi",
      tableName: "siak_program_studi",
    }
  );

  return ProgramStudi;
};
