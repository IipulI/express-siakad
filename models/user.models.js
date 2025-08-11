// /models/user.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class User extends Model {
        static associate(models) {
            this.hasOne(models.Dosen, {
                foreignKey: "siak_user_id",
                as: "dosen",
            })

            this.hasOne(models.Mahasiswa, {
                foreignKey: "siak_user_id",
                as: "mahasiswa",
            })
        }
    }

    User.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            eportalUserId: {
                type: DataTypes.UUID,
                fields: "eportal_user_id",
            }
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "User",
            tableName: "siak_user",
        }
    );

    return User
}
