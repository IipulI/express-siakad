import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class PemetaanKonsentrasiMk extends Model {
        static associate(models) {
            // Relasi ke Mata Kuliah
            this.belongsTo(models.MataKuliah, {
                foreignKey: "siak_mata_kuliah_id",
                as: "mataKuliah"
            });

            // Relasi ke Konsentrasi
            this.belongsTo(models.Konsentrasi, {
                foreignKey: "siak_konsentrasi_id",
                as: "konsentrasi"
            });
        }
    }

    PemetaanKonsentrasiMk.init({
        id: { 
            type: DataTypes.UUID, 
            primaryKey: true, 
            defaultValue: uuid7 
        },
        siakMataKuliahId: { 
            type: DataTypes.UUID, 
            field: "siak_mata_kuliah_id",
            allowNull: false 
        },
        siakKonsentrasiId: { 
            type: DataTypes.UUID, 
            field: "siak_konsentrasi_id",
            allowNull: false 
        }
    }, {
        sequelize, 
        underscored: true, 
        timestamps: true, 
        paranoid: false,
        modelName: "PemetaanKonsentrasiMk", 
        tableName: "siak_mata_kuliah_konsentrasi"
    });

    return PemetaanKonsentrasiMk;
};