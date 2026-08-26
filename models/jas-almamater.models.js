// /models/jas-almamater.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class JasAlmamater extends Model {
        static associate(models) {
            // define assoc
        }
    }

    JasAlmamater.init(
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

            modelName: "JasAlmamater",
            tableName: "siak_jas_almamater",
        }
    );

    return JasAlmamater;
};
