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
        // Disimpan dalam bentuk pecahan (skorTerbobot/totalBobot), BUKAN persentase jadi --
        // supaya kontribusi dari komponen ini bisa digabung matematis dengan komponen lain
        // (UTS+UAS+Tugas, dst) saat rollup ke nilai Sub-CPMK/CPMK final. Dihitung dari
        // breakdown per unit/soal yang dikirim CBT (lihat services/cbt.service.js),
        // TIDAK ada unit/soal yang disimpan permanen -- cuma hasil agregasinya.
        skorTerbobot: { type: DataTypes.DECIMAL(10, 4), field: "skor_terbobot", defaultValue: 0 },
        totalBobot: { type: DataTypes.DECIMAL(10, 4), field: "total_bobot", defaultValue: 0 },
        sumber: { type: DataTypes.STRING(50), defaultValue: "CBT" }
    }, {
        sequelize, underscored: true, timestamps: true, paranoid: true,
        modelName: "NilaiSubcpmkEvaluasiMahasiswa", tableName: "siak_nilai_subcpmk_evaluasi_mahasiswa"
    });

    return NilaiSubcpmkEvaluasiMahasiswa;
};
