import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class NilaiUnitCbtManual extends Model {
        static associate(models) {
            this.belongsTo(models.RincianKrsMahasiswa, {
                foreignKey: "siak_rincian_krs_mahasiswa_id",
                as: "krs"
            });
            this.belongsTo(models.RencanaEvaluasi, {
                foreignKey: "siak_rencana_evaluasi_id",
                as: "rencanaEvaluasi"
            });
        }
    }

    NilaiUnitCbtManual.init({
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: uuid7 },
        siakRincianKrsMahasiswaId: { type: DataTypes.UUID, field: "siak_rincian_krs_mahasiswa_id", allowNull: false },
        siakRencanaEvaluasiId: { type: DataTypes.UUID, field: "siak_rencana_evaluasi_id", allowNull: false },
        // Label soal/unit apa adanya dari FE (mis. "1", "2", "3") -- CUMA buat
        // ditampilkan balik ke dosen, tidak dipakai perhitungan apapun.
        nomorUnit: { type: DataTypes.STRING(20), field: "nomor_unit", allowNull: false },
        // Skor MENTAH persis yang diketik dosen (bukan hasil hitungan) -- ini
        // yang dicari dosen pas nanya "nilai yang saya input itu mana".
        skorDiperoleh: { type: DataTypes.DECIMAL(10, 2), field: "skor_diperoleh", defaultValue: 0 },
        skorMaksimal: { type: DataTypes.DECIMAL(10, 2), field: "skor_maksimal", defaultValue: 0 },
        // [{ cpmkId, bobotPoin }] -- apa adanya dari breakdown yang dikirim FE,
        // dipakai buat nunjukin Sub-CPMK mana aja yang dicentang di unit ini.
        pemetaanCpmk: { type: DataTypes.JSONB, field: "pemetaan_cpmk", defaultValue: [] }
    }, {
        sequelize, underscored: true, timestamps: true, paranoid: true,
        modelName: "NilaiUnitCbtManual", tableName: "siak_nilai_unit_cbt_manual"
    });

    return NilaiUnitCbtManual;
};
