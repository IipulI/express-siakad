// /models/tahunajaran.models.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from "../config/database.js";
import { v7 as uuid7 } from "uuid";

class TahunKurikulum extends Model {

}

TahunKurikulum.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuid7
      },
      siakPeriodeAkademikId: {
        type: DataTypes.UUID,
        field: 'siak_periode_akademik_id',
      },
      tahun: {
        allowNull: false,
        type: DataTypes.STRING,
      },
      keterangan: {
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
      }
    },
    {
      sequelize,
      underscored: true,
      timestamps: true,
      paranoid: true,

      modelName: 'TahunKurikulum',
      tableName: 'siak_tahun_kurikulum',
    }
)

export default TahunKurikulum;
