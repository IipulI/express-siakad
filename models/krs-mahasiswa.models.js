// /models/krs-mahasiswa.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class KrsMahasiswa extends Model {
        static associate(models) {
            this.belongsTo(models.PeriodeAkademik, {
                foreignKey: 'siak_periode_akademik_id',
                as: 'periodeAkademik'
            })

            this.belongsTo(models.Mahasiswa, {
                foreignKey: "siak_mahasiswa_id",
                as: 'mahasiswa',
            })

            this.hasMany(models.RincianKrsMahasiswa, {
                foreignKey: "siak_krs_mahasiswa_id",
                as: 'rincianKrsMahasiswa',
            })
        }
    }

    KrsMahasiswa.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakMahasiswaId: {
                type: DataTypes.UUID ,
                fields: "siak_mahasiswa_id"
            },
            siakPeriodeAkademikId: {
                type: DataTypes.UUID ,
                fields: "siak_periode_akademik_id"
            },
            status: {
                type: DataTypes.STRING ,
                fields: "status"
            },
            sksDiambil: {
                type: DataTypes.INTEGER ,
                fields: "sks_diambil"
            },
            semester: {
                type: DataTypes.INTEGER ,
                fields: "semester"
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "KrsMahasiswa",
            tableName: "siak_krs_mahasiswa",
        }
    );

    return KrsMahasiswa;
}
