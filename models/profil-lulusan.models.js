// /models/fakultas.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class ProfilLulusan extends Model {
        static associate(models) {
            // define assoc
            this.belongsTo(models.Obe, { 
                foreignKey: 'siak_obe_id', 
                as: 'obe' 
            });
        }
    }

    ProfilLulusan.init(
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
            profil: {
                type: DataTypes.STRING
            },
            profesi: {
                type: DataTypes.STRING
            },
            deskripsi: {
                type: DataTypes.TEXT
            },
            deskripsiEn: {
        type: DataTypes.TEXT,
        field: 'deskripsi_en', // Mapping ke nama kolom snake_case di DB
        allowNull: true
    },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "ProfilLulusan",
            tableName: "siak_profil_lulusan",
        }
    );

    return ProfilLulusan
}
