// /models/mahasiswa.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Mahasiswa extends Model {
        static associate(models) {
            this.hasMany(models.KrsMahasiswa, {
                foreignKey: 'siak_mahasiswa_id',
                as: 'krsMahasiswa',
            })

            this.hasOne(models.KrsMahasiswa, {
                foreignKey: 'siak_mahasiswa_id',
                as: 'krsTerbaru',
                order: [
                    ['semester', 'DESC']
                ]
            })

            this.hasOne(models.PembimbingAkademik, {
                as: "pembimbingDosen",
                foreignKey: 'siak_mahasiswa_id',
            })

            this.hasOne(models.HasilStudi, {
                foreignKey: 'siak_mahasiswa_id',
                as: "hasilStudiTerbaru",
                order: [
                    ['semester', 'DESC']
                ]
            })
        }
    }

    Mahasiswa.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakProgramStudiId: {
                type: DataTypes.UUID,
                fields: "siak_program_studi_id"
            },
            nama: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            npm: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            semester: {
                type: DataTypes.INTEGER
            },
            periodeMasuk: {
                type: DataTypes.STRING,
                field: "periode_masuk"
            }
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "Mahasiswa",
            tableName: "siak_mahasiswa",
        }
    );

    return Mahasiswa;
}