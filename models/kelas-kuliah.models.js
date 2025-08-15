// /models/kelas-kuliah.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class KelasKuliah extends Model {
        static associate(models) {
            this.belongsTo(models.MataKuliah, {
                foreignKey: "siak_mata_kuliah_id",
                as: "mataKuliah",
            })

            this.belongsTo(models.PeriodeAkademik, {
                foreignKey: "siak_periode_akademik_id",
                as: "periodeAkademik",
            })

            this.hasMany(models.JadwalKuliah, {
                foreignKey: "siak_kelas_kuliah_id",
                as: "jadwalKuliah",
            })

            this.hasOne(models.JadwalKuliah, {
                foreignKey: "siak_kelas_kuliah_id",
                as: "jadwalUtama"
            })
        }
    }

    KelasKuliah.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakMataKuliahId: {
                type: DataTypes.UUID,
                field: "siak_mata_kuliah_id"
            },
            siakPeriodeAkademikId: {
                type: DataTypes.UUID,
                field: "siak_periode_akademik_id"
            },
            siakRpsId: {
                type: DataTypes.UUID,
                field: "siak_rps_id"
            },
            nama: {
                type: DataTypes.STRING,
            },
            kapasitas: {
                type: DataTypes.INTEGER,
            },
            jumlahPeminat: {
                type: DataTypes.INTEGER,
                field: "jumlah_peminat"
            },
            sistemKuliah: {
                type: DataTypes.STRING,
                field: "sistem_kuliah"
            },
            statusKelas: {
                type: DataTypes.STRING,
                field: "status_kelas"
            },
            jumlahPertemuan: {
                type: DataTypes.INTEGER,
                field: "jumlah_pertemuan"
            },
            tanggalMulai: {
                type: DataTypes.DATEONLY,
                field: "tanggal_mulai"
            },
            tanggalSelesai: {
                type: DataTypes.DATEONLY,
                field: "tanggal_selesai"
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "KelasKuliah",
            tableName: "siak_kelas_kuliah",
        }
    );

    return KelasKuliah;
}