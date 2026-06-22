import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class NilaiEvaluasiMahasiswa extends Model {
        static associate(models) {
            this.belongsTo(models.RencanaEvaluasi, {
                foreignKey: "siak_rencana_evaluasi_id",
                as: "rencanaEvaluasi"
            });
            this.belongsTo(models.RincianKrsMahasiswa, {
                foreignKey: "siak_rincian_krs_mahasiswa_id",
                as: "krs"
            });
        }
    }

    NilaiEvaluasiMahasiswa.init({
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: uuid7 },
        siakRincianKrsMahasiswaId: { type: DataTypes.UUID, field: 'siak_rincian_krs_mahasiswa_id' },
        siakKomposisiNilaiId: { type: DataTypes.UUID, field: 'siak_komposisi_nilai_id' },
        siakRencanaEvaluasiId: { type: DataTypes.UUID, field: 'siak_rencana_evaluasi_id' },
        skor: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 }
    }, {
        sequelize, underscored: true, timestamps: true, paranoid: true,
        modelName: "NilaiEvaluasiMahasiswa", tableName: "siak_nilai_evaluasi_mahasiswa"
    });
    return NilaiEvaluasiMahasiswa;
}