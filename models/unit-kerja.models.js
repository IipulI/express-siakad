// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class UnitKerja extends Model {
        static associate(models) {
            this.belongsTo(models.UnitKerja, {
                foreignKey: "parentId",
                as: "parent",
            });
            this.hasMany(models.UnitKerja, {
                foreignKey: "parentId",
                as: "children",
            });

            this.hasOne(models.Fakultas, {
                foreignKey : "siak_fakultas_id",
                as : "fakultas",
            });

            this.hasOne(models.ProgramStudi, {
                foreignKey : "siak_program_studi_id",
                as : "programStudi",
            })
        }
    }

    UnitKerja.init(
        {
            id : {
                type : DataTypes.UUID,
                primaryKey : true,
                defaultValue : uuid7,
            },
            parentId: {
                type: DataTypes.UUID,
                allowNull: true,
                field: "parent_id",
            },
            eportalMId:{
                type: DataTypes.INTEGER,
                allowNull: true,
                field: "eportal_m_id",
            },
            kode: {
                type: DataTypes.STRING(100),
                allowNull: false,
            },
            nama: {
                type: DataTypes.STRING(255),
                allowNull: false,
            },
            jenis: {
                type: DataTypes.ENUM("universitas", "fakultas", "prodi"),
                allowNull: true,
            },

        },
        {
            sequelize,
            underscored : true,
            timestamps : true,
            paranoid : true,

            modelName : "UnitKerja",
            tableName : "siak_unit_kerja",
        }
    );

    return UnitKerja;
};
