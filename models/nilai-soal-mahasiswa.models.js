import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class NilaiSoalMahasiswa extends Model {
        static associate(models) {
            this.belongsTo(models.Soal, {
                foreignKey: "siak_soal_id",
                as: "soal"
            });
            this.belongsTo(models.RincianKrsMahasiswa, {
                foreignKey: "siak_rincian_krs_mahasiswa_id",
                as: "krs"
            });
        }
    }

    NilaiSoalMahasiswa.init({
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: uuid7 },
        siakRincianKrsMahasiswaId: { type: DataTypes.UUID, field: "siak_rincian_krs_mahasiswa_id", allowNull: false },
        siakSoalId: { type: DataTypes.UUID, field: "siak_soal_id", allowNull: false },
        skorDiperoleh: { type: DataTypes.DECIMAL(6, 2), field: "skor_diperoleh", defaultValue: 0 }
    }, {
        sequelize, underscored: true, timestamps: true, paranoid: true,
        modelName: "NilaiSoalMahasiswa", tableName: "siak_nilai_soal_mahasiswa"
    });

    return NilaiSoalMahasiswa;
};
