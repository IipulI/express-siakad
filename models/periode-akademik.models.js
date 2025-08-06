// /models/tahunajaran.models.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from "../config/database.js";
import { v7 as uuid7 } from "uuid";

class PeriodeAkademik extends Model {

}

PeriodeAkademik.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuid7
      },
      siakTahunAjaranId: {
        type: DataTypes.UUID,
        field: 'siak_tahun_ajaran_id',
      },
      nama: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      kode: {
        unique: true,
        allowNull: false,
        type: DataTypes.STRING,
      },
      tanggalMulai: {
        allowNull: false,
        field: 'tanggal_mulai',
        type: DataTypes.DATEONLY
      },
      tanggalSelesai: {
        allowNull: false,
        field: 'tanggal_selesai',
        type: DataTypes.DATEONLY
      },
      status: {
        allowNull: false,
        type: DataTypes.STRING,
      }
    },
    {
      sequelize,
      underscored: true,
      timestamps: true,
      paranoid: true,

      modelName: 'PeriodeAkademik',
      tableName: 'siak_periode_akademik'
    }
)

export default PeriodeAkademik;