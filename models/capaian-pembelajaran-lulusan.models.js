// /models/fakultas.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class CapaianPembelajaranLulusan extends Model {
        static associate(models) {
            this.hasMany(models.PemetaanPlCpl, {
                foreignKey: "siak_capaian_pembelajaran_lulusan_id",
                as: "pemetaanPlCpl"
            })
        }
    }

    CapaianPembelajaranLulusan.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakObeId: {
                type: DataTypes.UUID,
                field: 'siak_obe_id'
            },
            kode: {
                type: DataTypes.STRING
            },
            deskripsi: {
                type: DataTypes.TEXT
            },
            kategori: {
                type: DataTypes.STRING
            }
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "CapaianPembelajaranLulusan",
            tableName: "siak_capaian_pembelajaran_lulusan",
        }
    );

    return CapaianPembelajaranLulusan
}
