// /models/user.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class UserRole extends Model {
        static associate(models) {
            this.belongsTo(models.User, {
                foreignKey: "siak_user_id",
                as: "user",
            })

            this.belongsTo(models.Role, {
                foreignKey: "siak_role_id",
                as: "role"
            })
        }
    }

    UserRole.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakUserId: {
                type: DataTypes.UUID,
                field: "siak_user_id",
            },
            siakRoleId: {
                type: DataTypes.STRING,
                field: "siak_role_id",
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "UserRole",
            tableName: "siak_user_role",
        }
    );

    return UserRole
}
