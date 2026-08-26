import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Konsentrasi extends Model {
        static associate(models) {
            // Relasi ke Program Studi
            this.belongsTo(models.ProgramStudi, {
                foreignKey: "siak_program_studi_id",
                as: "programStudi"
            });

            // Relasi Many-to-Many ke Mata Kuliah melalui Pivot
            this.belongsToMany(models.MataKuliah, {
                through: models.PemetaanKonsentrasiMk,
                foreignKey: "siak_konsentrasi_id",
                otherKey: "siak_mata_kuliah_id",
                as: "mataKuliah"
            });
        }
    }

    Konsentrasi.init({
        id: { 
            type: DataTypes.UUID, 
            primaryKey: true, 
            defaultValue: uuid7 
        },
        siakProgramStudiId: { 
            type: DataTypes.UUID, 
            field: "siak_program_studi_id",
            allowNull: false 
        },
        kode: { 
            type: DataTypes.STRING, 
            field: "kode",
            allowNull: true 
        },
        nama: {
            type: DataTypes.STRING,
            field: "nama",
            allowNull: false
        }
    }, {
        sequelize, 
        underscored: true, 
        timestamps: true, 
        paranoid: true,
        modelName: "Konsentrasi", 
        tableName: "siak_konsentrasi"
    });

    return Konsentrasi;
};