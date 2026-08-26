// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Ruangan extends Model {
        static associate(models) {
            this.belongsTo(models.Fakultas, {
                foreignKey : "siak_fakultas_id",
                as : "fakultas",
            });

            this.belongsTo(models.ProgramStudi, {
                foreignKey : "siak_program_studi_id",
                as : "programStudi",
            })

            this.hasMany(models.JadwalKuliah, {
                foreignKey : "siak_ruangan_id",
                as : "jadwalKuliah",
            })
        }
    }

    Ruangan.init(
        {
            id : {
                type : DataTypes.UUID,
                primaryKey : true,
                defaultValue : uuid7,
            },
            siakFakultasId : {
                type : DataTypes.UUID,
                allowNull : true,
                field : "siak_fakultas_id",
            },
            siakProgramStudiId : {
                type : DataTypes.UUID,
                allowNull : true,
                field : "siak_program_studi_id",
            },
            nama : {
                type : DataTypes.STRING(50),
                allowNull : false,
            },
            ruangan : {
                type : DataTypes.STRING(50),
                allowNull : false,
            },
            kapasitas : {
                type : DataTypes.INTEGER,
                allowNull : false,
            },
            lantai : {
                type : DataTypes.INTEGER,
                allowNull : false,
            },
        },
        {
            sequelize,
            underscored : true,
            timestamps : true,
            paranoid : true,

            modelName : "Ruangan",
            tableName : "siak_ruangan",
        }
    );

    return Ruangan;
};
