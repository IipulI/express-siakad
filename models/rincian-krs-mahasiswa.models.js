// /models/rincian-krs-mahasiswa.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class RincianKrsMahasiswa extends Model {
        static associate(models) {
            this.belongsTo(models.KrsMahasiswa, {
                foreignKey: "siak_krs_mahasiswa_id",
                as: "krsMahasiswa",
            })

            this.belongsTo(models.KelasKuliah, {
                foreignKey: "siak_kelas_kuliah_id",
                as: "kelasKuliah",
            })
        }
    }

    RincianKrsMahasiswa.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakKrsMahasiswaId: {
                type: DataTypes.UUID,
                fields: "siak_krs_mahasiswa_id"
            },
            siakKelasKuliahId: {
                type: DataTypes.UUID,
                fields: "siak_kelas_kuliah_id"
            },
            kategori: {
                type: DataTypes.STRING
            },
            status: {
                type: DataTypes.STRING
            },
            kehadiran: {
                type: DataTypes.DOUBLE(5,2)
            },
            tugas: {
                type: DataTypes.DOUBLE(5,2)
            },
            uts: {
                type: DataTypes.DOUBLE(5,2)
            },
            uas: {
                type: DataTypes.DOUBLE(5,2)
            },
            nilai: {
                type: DataTypes.DOUBLE(5,2)
            },
            hurufMutu: {
                type: DataTypes.STRING(3),
                fields: "huruf_mutu"
            },
            angkaMutu: {
                type: DataTypes.DOUBLE(5,2),
                fields: "angka_mutu"
            },
            nilaiAkhir: {
                type: DataTypes.DOUBLE(5,2),
                fields: "nilai_akhir"
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "RincianKrsMahasiswa",
            tableName: "siak_rincian_krs_mahasiswa",
        }
    );

    return RincianKrsMahasiswa;
}