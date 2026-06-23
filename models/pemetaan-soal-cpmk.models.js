import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class PemetaanSoalCpmk extends Model {
        static associate(models) {
            this.belongsTo(models.Soal, {
                foreignKey: "siak_soal_id",
                as: "soal"
            });
            this.belongsTo(models.CapaianMataKuliah, {
                foreignKey: "siak_cpmk_id",
                as: "cpmk"
            });
        }
    }

    PemetaanSoalCpmk.init({
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: uuid7 },
        siakSoalId: { type: DataTypes.UUID, field: "siak_soal_id", allowNull: false },
        siakCpmkId: { type: DataTypes.UUID, field: "siak_cpmk_id", allowNull: false },
        bobotPoin: { type: DataTypes.DECIMAL(6, 2), field: "bobot_poin", allowNull: false }
    }, {
        sequelize, underscored: true, timestamps: true, paranoid: true,
        modelName: "PemetaanSoalCpmk", tableName: "siak_pemetaan_soal_cpmk"
    });

    return PemetaanSoalCpmk;
};
