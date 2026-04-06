import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class PemetaanEvaluasiCpmk extends Model {
        static associate(models) {
            // Relasi ke Rencana Evaluasi
            this.belongsTo(models.RencanaEvaluasi, {
                foreignKey: "siak_rencana_evaluasi_id",
                as: "rencanaEvaluasi"
            });
            
            // Relasi ke CPMK
            this.belongsTo(models.CapaianMataKuliah, {
                foreignKey: 'siak_cpmk_id', 
                as: 'capaianMataKuliah'
            });
        }
    }

    PemetaanEvaluasiCpmk.init({
        id: { 
            type: DataTypes.UUID, 
            primaryKey: true, 
            defaultValue: uuid7 
        },
        // 👇 INI YANG TADI BIKIN NULL KARENA BELUM TERDAFTAR BENAR 👇
        siakRencanaEvaluasiId: { 
            type: DataTypes.UUID, 
            field: "siak_rencana_evaluasi_id",
            allowNull: false 
        },
        siakCpmkId: {
            type: DataTypes.UUID,
            field: 'siak_cpmk_id',
            allowNull: false, 
        },
        bobotCpmk: { 
            type: DataTypes.DECIMAL(5,2), 
            field: "bobot_cpmk",
            defaultValue: 0
        }
    }, {
        sequelize, 
        underscored: true, 
        timestamps: true, 
        paranoid: true,
        modelName: "PemetaanEvaluasiCpmk", 
        tableName: "siak_pemetaan_evaluasi_cpmk"
    });

    return PemetaanEvaluasiCpmk;
};