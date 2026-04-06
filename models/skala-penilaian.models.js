// /models/skala-penilaian.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class SkalaPenilaian extends Model {
        static associate(models) {}
    }

    SkalaPenilaian.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakProgramStudiId: {
                type: DataTypes.UUID,
                field: "siak_program_studi_id"
            },
            siakTahunKurikulumId: {
                type: DataTypes.UUID,
                field: "siak_tahun_kurikulum_id"
            },
            hurufMutu: {
                type: DataTypes.STRING,
                field: "huruf_mutu"
            },
            angkaMutu: {
                type: DataTypes.DOUBLE(5,2),
                field: "angka_mutu"
            },
            nilaiMin: {
                type: DataTypes.DOUBLE(5,2),
                field: "nilai_min"
            },
            nilaiMax: {
                type: DataTypes.DOUBLE(5,2),
                field: "nilai_max"
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "SkalaPenilaian",
            tableName: "siak_skala_penilaian",
        }
    );

    return SkalaPenilaian;
};
