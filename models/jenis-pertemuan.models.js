// /models/jenis-pertemuan.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class JenisPertemuan extends Model {
        static associate(models) {
            // define assoc
        }
    }

    JenisPertemuan.init(
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

            modelName: "JenisPertemuan",
            tableName: "siak_jenis_pertemuan",
        }
    );

    return JenisPertemuan;
};
