import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { v7 as uuid7 } from 'uuid'

class User extends Model {

}

User.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: uuid7
        },
        username: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
            validate: {
                isEmail: true,
            }
        }
    }, {
        // Other model options go here
        sequelize,
        tableName: 'users',
        underscored: true,
        timestamps: true // This will add createdAt and updatedAt fields
    }
)

export default User;