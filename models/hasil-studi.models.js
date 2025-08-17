// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class HasilStudi extends Model {
        static associate(models) {
            // define assoc
        }
    }

    HasilStudi.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            siakMahasiswaId: {
                type: DataTypes.UUID,
                field: 'siak_mahasiswa_id'
            },
            siakPeriodeAkademikId: {
                type: DataTypes.UUID,
                field: 'siak_periode_akademik_id'
            },
            semester: {
                type: DataTypes.INTEGER,
                field: 'semester'
            },
            ips: {
                type: DataTypes.DOUBLE(5, 2),
                field: 'ips'
            },
            ipk: {
                type: DataTypes.DOUBLE(5, 2),
                field: 'ipk'
            },
            sksDiambil: {
                type: DataTypes.INTEGER,
                field: 'sks_diambil'
            },
            sksLulus: {
                type: DataTypes.INTEGER,
                field: 'sks_lulus'
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "HasilStudi",
            tableName: "siak_hasil_studi",
        }
    );

    return HasilStudi;
}