// models/pembimbing-akademik.models.js

import { Model, DataTypes } from 'sequelize';
import { v7 as uuid7 } from 'uuid';

export default (sequelize) => {
    class PembimbingAkademik extends Model {
        static associate(models) {
            this.belongsTo(models.Dosen, {
                foreignKey: 'siak_dosen_id',
                as: 'dosen',
            })

            this.belongsTo(models.Mahasiswa, {
                foreignKey: 'siak_mahasiswa_id',
                as: 'mahasiswa',
            })

            this.belongsTo(models.PeriodeAkademik, {
                foreignKey: 'siak_periode_akademik_id',
                as: 'periodeAkademik'
            })
        }
    }

    PembimbingAkademik.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: uuid7
        },
        siakDosenId: {
            type: DataTypes.UUID,
            field: "siak_dosen_id",
        },
        siakMahasiswaId: {
            type: DataTypes.UUID,
            field: "siak_mahasiswa_id",
        },
        siakPeriodeAkademikId: {
            type: DataTypes.UUID,
            field: "siak_periode_akademik_id",
        },
        noSk: {
            type: DataTypes.STRING
        },
        tanggalSk: {
            type: DataTypes.DATEONLY
        }
    }, {
        sequelize,
        underscored: true,
        timestamps: true,
        paranoid: true,

        modelName: "PembimbingAkademik",
        tableName: "siak_pembimbing_akademik"
    })

    return PembimbingAkademik;
}