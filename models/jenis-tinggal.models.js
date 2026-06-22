// /models/fakultas.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class JenisTinggal extends Model {
        static associate(models) {
            // define assoc
        }
    }

    JenisTinggal.init(
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

            modelName: "JenisTinggal",
            tableName: "siak_jenis_tinggal",
        }
    );

    return JenisTinggal
}
