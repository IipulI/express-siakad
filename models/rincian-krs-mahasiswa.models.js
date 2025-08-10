// /models/rincian-krs-mahasiswa.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class RincianKrsMahasiswa extends Model {
        static associate(models) {
            // define assoc
        }
    }

    RincianKrsMahasiswa.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            nama: {
                type: DataTypes.STRING(75),
                allowNull: false,
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "RincianKrsMahasiswa",
            tableName: "siak_rincian_krs_mahasiswa",
        }
    );

    return RincianKrsMahasiswa;
}