// /models/program-studi.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class ProgramStudi extends Model {
        static associate(models) {
            this.belongsTo(models.UnitKerja, {
                foreignKey : "siak_unit_kerja_id",
                as : "unitKerja",
            })

            this.belongsTo(models.Fakultas, {
                foreignKey : "siak_fakultas_id",
                as : "fakultas",
            });

            this.belongsTo(models.Jenjang, {
                foreignKey : "siak_jenjang_id", // Pastikan nama kolom di DB sesuai
                as : "jenjang"
            });

            this.belongsTo(models.Dosen, {
                foreignKey : 'kaprodi_id', // UBAH JIKA NAMA KOLOM DI DB BEDA (misal: 'siak_dosen_id')
                as : 'kaprodi'
            });
        }
    }

    ProgramStudi.init(
        {
            id : {
                type : DataTypes.UUID,
                primaryKey : true,
                defaultValue : uuid7,
            },
            siakFakultasId : {
                type : DataTypes.UUID,
                field : "siak_fakultas_id",
            },
            siakJenjangId : {
                type : DataTypes.UUID,
                field : "siak_jenjang_id",
            },
            siakUnitKerjaId : {
                type : DataTypes.UUID,
                field : "siak_unit_kerja_id",
            },
            nama : {
                type : DataTypes.STRING,
                allowNull : false,
            },
            kode : {
                type : DataTypes.STRING,
                allowNull : false,
            },
            kaprodiId : {
                type : DataTypes.UUID,
                field : "kaprodi_id",
                allowNull : true,
            },
        },
        {
            sequelize,
            underscored : true,
            timestamps : true,
            paranoid : true,

            modelName : "ProgramStudi",
            tableName : "siak_program_studi",
        }
    );

    return ProgramStudi;
};
