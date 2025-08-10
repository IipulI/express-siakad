// /models/krs-mahasiswa.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class KrsMahasiswa extends Model {
        static associate(models) {
            // define assoc
        }
    }

    KrsMahasiswa.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "KrsMahasiswa",
            tableName: "siak_krs_mahasiswa",
        }
    );

    return KrsMahasiswa;
}
