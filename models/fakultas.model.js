// /models/fakultas.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Fakultas extends Model {
        static associate(models) {
            // define assoc
        }
    }

    Fakultas.init(
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

            modelName: "Fakultas",
            tableName: "siak_fakultas",
        }
    );

    return Fakultas
}
