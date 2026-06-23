// /models/fakultas.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Transportasi extends Model {
        static associate(models) {
            // define assoc
        }
    }

    Transportasi.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            kode: {
                type: DataTypes.STRING(75),
                allowNull: false,
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

            modelName: "Transportasi",
            tableName: "siak_transportasi",
        }
    );

    return Transportasi
}
