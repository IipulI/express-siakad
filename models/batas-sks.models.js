// /models/tahun-ajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class BatasSks extends Model {
        static associate(models) {
            // define assoc
        }
    }

    BatasSks.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakJenjangId: {
                type: DataTypes.UUID,
                field: 'siak_jenjang_id',
            },
            ipsMin: {
                type: DataTypes.DOUBLE(5, 2),
                field: 'ips_min',
            },
            ipsMax: {
                type: DataTypes.DOUBLE(5, 2),
                field: 'ips_max',
            },
            batasSks: {
                type: DataTypes.INTEGER,
                field: 'batas_sks',
            }
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "BatasSks",
            tableName: "siak_batas_sks",
        }
    );

    return BatasSks;
}
