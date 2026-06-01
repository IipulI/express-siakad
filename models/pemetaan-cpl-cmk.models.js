// models/pembimbing-akademik.models.js

import { Model, DataTypes } from 'sequelize';
import { v7 as uuid7 } from 'uuid';

export default (sequelize) => {
    class PemetaanCplCpmk extends Model {
        static associate(models) {
            this.belongsTo(models.CapaianPembelajaranLulusan, {
                foreignKey: 'siak_capaian_pembelajaran_lulusan_id',
                as: "capaianPembelajaranLulusan"
            })

            this.belongsTo(models.CapaianMataKuliah, {
                foreignKey: "siak_capaian_mata_kuliah_id",
                as: "capaianMataKuliah"
            })
        }
    }

    PemetaanCplCpmk.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: uuid7
        },
        siakCapaianPembelajaranLulusanId: {
            type: DataTypes.UUID,
            field: "siak_capaian_pembelajaran_lulusan_id",
        },
        siakCapaianMataKuliahId: {
            type: DataTypes.UUID,
            field: "siak_capaian_mata_kuliah_id",
        },
        bobotCpl: {
            type: DataTypes.FLOAT,
            field: "bobot_cpl",
            defaultValue: 0
        }
    }, {
        sequelize,
        underscored: true,
        timestamps: true,
        paranoid: true,

        modelName: "PemetaanCplCpmk",
        tableName: "siak_pemetaan_cpl_cpmk"
    })

    return PemetaanCplCpmk;
}