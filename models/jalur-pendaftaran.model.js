// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class JalurPendaftaran extends Model {
        static associate(models) {
            // define assoc
        }
    }

    JalurPendaftaran.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            nama: {
                type: DataTypes.STRING,
                field: 'nama'
            },
        },
        
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "JalurPendaftaran",
            tableName: "siak_jalur_pendaftaran",
        }
    );

    return JalurPendaftaran;
}