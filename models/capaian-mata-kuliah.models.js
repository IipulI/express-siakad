// /models/fakultas.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class CapaianMataKuliah extends Model {
        static associate(models) {
            this.hasMany(models.PemetaanCplCpmk, {
                foreignKey: 'siak_capaian_mata_kuliah_id',
                as: "pemetaanCplCpmk"
            })
        }
    }

    CapaianMataKuliah.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakObeId: {
                type: DataTypes.UUID,
                field: "siak_obe_id",
                allowNull: false,
            },
            siakMataKuliahId: {
                type: DataTypes.UUID,
                field: "siak_mata_kuliah_id",
                allowNull: false,
            },
            kode: {
                type: DataTypes.STRING,
            },
            deskripsi: {
                type: DataTypes.TEXT,
            }
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "CapaianMataKuliah",
            tableName: "siak_capaian_mata_kuliah",
        }
    );

    return CapaianMataKuliah
}
