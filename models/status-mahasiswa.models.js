// /models/tahun-kurikulum.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class StatusMahasiswa extends Model {
        static associate(models) {
            // define assoc
        }
    }

    StatusMahasiswa.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            kode: {
                type: DataTypes.STRING
            },
            aktif: {
                type: DataTypes.BOOLEAN
            },
            kuliah: {
                type: DataTypes.BOOLEAN
            },
            nama: {
                type: DataTypes.STRING
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "StatusMahasiswa",
            tableName: "siak_status_mahasiswa",
        }
    );

    return StatusMahasiswa;
};
