// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Pegawai extends Model {
        static associate(models) {}
    }

    Pegawai.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakUserId: {
                type: DataTypes.UUID,
                field: "siak_user_id",
            },
            nama: {
                type: DataTypes.STRING(75),
                allowNull: false,
            },
            nip: {
                type: DataTypes.STRING(75),
                allowNull: false,
            }
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "Pegawai",
            tableName: "siak_pegawai",
        }
    );

    return Pegawai;
};
