// /models/unsur-nilai.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class MetodeEvaluasi extends Model {
        static associate(models) {
            // Define assoc
        }
    }

    MetodeEvaluasi.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            kode: {
                type: DataTypes.STRING,
            },
            nama: {
                type: DataTypes.STRING,
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "MetodeEvaluasi",
            tableName: "siak_metode_evaluasi",
        }
    );

    return MetodeEvaluasi;
};
