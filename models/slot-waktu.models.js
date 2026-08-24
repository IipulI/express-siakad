// /models/slot-waktu.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class SlotWaktu extends Model {
        static associate(models) {
            // define assoc
        }
    }

    SlotWaktu.init(
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
            jamMulai: {
                type: DataTypes.TIME,
                allowNull: false,
                field: "jam_mulai",
            },
            jamSelesai: {
                type: DataTypes.TIME,
                allowNull: false,
                field: "jam_selesai",
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "SlotWaktu",
            tableName: "siak_slot_waktu",
        }
    );

    return SlotWaktu;
};
