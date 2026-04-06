// /models/jenis-mata-kuliah.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class JenisMataKuliah extends Model {
        static associate(models) {
            // define assoc
        }
    }

    JenisMataKuliah.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            kode: {
                allowNull: false,
                type: DataTypes.STRING,
            },
            nama: {
                allowNull: false,
                type: DataTypes.INTEGER,
            },
        },

        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "JenisMataKuliah",
            tableName: "siak_jenis_mata_kuliah",
        }
    );

    return JenisMataKuliah;
}