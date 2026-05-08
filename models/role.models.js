// /models/user.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Role extends Model {
        static associate(models) {
            this.hasMany(models.UserRole, {
                foreignKey: "siak_role_id",
                as: "userRole",
            })
        }
    }

    Role.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            nama: {
                type: DataTypes.STRING,
            },
            deskripsi: {
                type: DataTypes.STRING,
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "Role",
            tableName: "siak_role",
        }
    );

    return Role
}
