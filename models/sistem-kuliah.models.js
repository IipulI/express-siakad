// /models/fakultas.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class SistemKuliah extends Model {
        static associate(models) {
            // define assoc
        }
    }

    SistemKuliah.init(
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
            keterangan: {
                type: DataTypes.STRING(255),
                allowNull: true,
            }
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "SistemKuliah",
            tableName: "siak_sistem_kuliah",
        }
    );

    return SistemKuliah
}
