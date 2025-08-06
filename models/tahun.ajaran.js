// /models/tahunajaran.models.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from "../config/database.js";
import { v7 as uuid7 } from "uuid";

class TahunAjaran extends Model {

}

TahunAjaran.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: uuid7
        },
        tahun: {
            type: DataTypes.STRING(5),
            allowNull: false
        },
        nama: {
            type: DataTypes.STRING(50),
            allowNull: false,
        }
    },
    {
        sequelize,
        underscored: true,
        timestamps: true,
        paranoid: true,

        modelName: 'TahunAjaran',
        tableName: 'siak_tahun_ajaran'
    }
)

export default TahunAjaran;