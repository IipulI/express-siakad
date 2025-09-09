// /models/unsur-nilai.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class UnsurNilai extends Model {
        static associate(models) {
            this.belongsTo(models.MetodeEvaluasi, {
                foreignKey: "siak_metode_evaluasi_id",
                as: "metodeEvaluasi"
            })
        }
    }

    UnsurNilai.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakMetodeEvaluasiId: {
                type: DataTypes.UUID,
                field: 'siak_metode_evaluasi_id',
            },
            kode: {
                type: DataTypes.STRING,
            },
            nama: {
                type: DataTypes.STRING,
            },
            namaSingkat: {
                type: DataTypes.STRING,
                field: 'nama_singkat'
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "UnsurNilai",
            tableName: "siak_unsur_nilai",
        }
    );

    return UnsurNilai;
};
