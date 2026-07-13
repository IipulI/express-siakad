import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class NilaiSubcpmkEvaluasiMahasiswa extends Model {
        static associate(models) {
            this.belongsTo(models.RincianKrsMahasiswa, {
                foreignKey: "siak_rincian_krs_mahasiswa_id",
                as: "krs"
            });
            this.belongsTo(models.RencanaEvaluasi, {
                foreignKey: "siak_rencana_evaluasi_id",
                as: "rencanaEvaluasi"
            });
            this.belongsTo(models.CapaianMataKuliah, {
                foreignKey: "siak_cpmk_id",
                as: "capaianMataKuliah"
            });
        }
    }

    NilaiSubcpmkEvaluasiMahasiswa.init({
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: uuid7 },
        siakRincianKrsMahasiswaId: { type: DataTypes.UUID, field: "siak_rincian_krs_mahasiswa_id", allowNull: false },
        siakRencanaEvaluasiId: { type: DataTypes.UUID, field: "siak_rencana_evaluasi_id", allowNull: false },
        siakCpmkId: { type: DataTypes.UUID, field: "siak_cpmk_id", allowNull: false },
        skorMentah: { type: DataTypes.DECIMAL(5, 2), field: "skor_mentah", defaultValue: 0 },
        sumber: { type: DataTypes.STRING(50), defaultValue: "CBT" }
    }, {
        sequelize, underscored: true, timestamps: true, paranoid: true,
        modelName: "NilaiSubcpmkEvaluasiMahasiswa", tableName: "siak_nilai_subcpmk_evaluasi_mahasiswa"
    });

    return NilaiSubcpmkEvaluasiMahasiswa;
};
