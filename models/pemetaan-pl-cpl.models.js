// models/pembimbing-akademik.models.js

import { Model, DataTypes } from 'sequelize';
import { v7 as uuid7 } from 'uuid';

export default (sequelize) => {
    class PemetaanPlCpl extends Model {
        static associate(models) {
            this.belongsTo(models.CapaianPembelajaranLulusan, {
                foreignKey: "siak_capaian_pembelajaran_lulusan_id",
                as: "capaianPembelajaranLulusan"
            })

            this.belongsTo(models.ProfilLulusan, {
                foreignKey: "siak_profil_lulusan_id",
                as: "profilLulusan"
            })
        }
    }

    PemetaanPlCpl.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: uuid7
        },
        siakProfilLulusanId: {
            type: DataTypes.UUID,
            field: "siak_profil_lulusan_id",
        },
        siakCapaianPembelajaranLulusanId: {
            type: DataTypes.UUID,
            field: "siak_capaian_pembelajaran_lulusan_id",
        },
    }, {
        sequelize,
        underscored: true,
        timestamps: true,
        paranoid: true,

        modelName: "PemetaanPlCpl",
        tableName: "siak_pemetaan_pl_cpl"
    })

    return PemetaanPlCpl;
}