// /models/mata-kuliah.models.js
import { Model, DataTypes } from 'sequelize';
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class JadwalKuliah extends Model {
        static associate(models) {
            this.belongsTo(models.Dosen, {
                foreignKey: "siak_dosen_id",
                as: "dosen",
            })

            this.belongsTo(models.Ruangan, {
                foreignKey: "siak_ruangan_id",
                as: "ruangan",
            })
        }
    }

    JadwalKuliah.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            siakKelasKuliahId: {
                type: DataTypes.UUID,
                fields: "siak_kelas_kuliah_id",
            },
            siakRuanganId: {
                type: DataTypes.UUID,
                fields: "siak_ruangan_id",
            },
            siakDosenId: {
                type: DataTypes.UUID,
                fields: "siak_dosen_id",
            },
            hari: {
                type: DataTypes.STRING,
            },
            jamMulai: {
                type: DataTypes.TIME,
                fields: "jam_mulai",
            },
            jamSelesai: {
                type: DataTypes.TIME,
                fields: "jam_selesai",
            },
            jenisPertemuan: {
                type: DataTypes.STRING,
                fields: "jenis_pertemuan",
            },
            metodePembelajaran: {
                type: DataTypes.STRING,
                fields: "metode_pembelajaran",
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: 'JadwalKuliah',
            tableName: 'siak_jadwal_kuliah'
        }
    );

    return JadwalKuliah;
}