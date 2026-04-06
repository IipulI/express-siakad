// /models/bidang-ilmu.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class BidangIlmu extends Model {
        static associate(models) {
            // define assoc
        }
    }

    BidangIlmu.init(
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

            modelName: "BidangIlmu",
            tableName: "siak_bidang_ilmu",
        }
    );

    return BidangIlmu;
}