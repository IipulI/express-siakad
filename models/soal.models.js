import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Soal extends Model {
        static associate(models) {
            this.belongsTo(models.RencanaEvaluasi, {
                foreignKey: "siak_rencana_evaluasi_id",
                as: "rencanaEvaluasi"
            });
            this.belongsTo(models.Soal, {
                foreignKey: "parent_soal_id",
                as: "induk"
            });
            this.hasMany(models.Soal, {
                foreignKey: "parent_soal_id",
                as: "anakSoal"
            });
            this.hasMany(models.PemetaanSoalCpmk, {
                foreignKey: "siak_soal_id",
                as: "pemetaanCpmk"
            });
            this.hasMany(models.NilaiSoalMahasiswa, {
                foreignKey: "siak_soal_id",
                as: "daftarNilaiSoal"
            });
        }
    }

    Soal.init({
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: uuid7 },
        siakRencanaEvaluasiId: { type: DataTypes.UUID, field: "siak_rencana_evaluasi_id", allowNull: false },
        parentSoalId: { type: DataTypes.UUID, field: "parent_soal_id", allowNull: true },
        nomor: { type: DataTypes.STRING, allowNull: false },
        label: { type: DataTypes.STRING, allowNull: true },
        jenisUnit: { type: DataTypes.STRING(20), field: "jenis_unit", defaultValue: "RUBRIK" }, // 'OBJEKTIF' | 'RUBRIK'
        skorMaksimal: { type: DataTypes.DECIMAL(6, 2), field: "skor_maksimal", allowNull: false },
        urutan: { type: DataTypes.INTEGER, defaultValue: 0 }
    }, {
        sequelize, underscored: true, timestamps: true, paranoid: true,
        modelName: "Soal", tableName: "siak_soal"
    });

    return Soal;
};
