// /models/dosen.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Dosen extends Model {
        static associate(models) {
            // define association here
        }
    }
    Dosen.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: uuid7,
        },
        nama: {
            type: DataTypes.STRING(75),
            allowNull: false,
        },
        nidn: {
            type: DataTypes.STRING(25),
            allowNull: false,
        }
    }, {
        sequelize,
        underscored: true,
        timestamps: true,
        paranoid: true,

        modelName: "Dosen",
        tableName: "siak_dosen",
    });
    return Dosen;
};