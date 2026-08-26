// /models/tahun-ajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class PeriodeAkademik extends Model {
        static associate(models) {
            this.hasMany(models.TahunKurikulum, {
                as: 'tahunKurikulum',
                foreignKey: 'siak_periode_akademik_id'
            });

            this.belongsTo(models.TahunAjaran, {
                as: 'tahunAjaran',
                foreignKey: 'siak_tahun_ajaran_id'
            })
        }
    }

    PeriodeAkademik.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakTahunAjaranId: {
                type: DataTypes.UUID,
                field: 'siak_tahun_ajaran_id'
            },
            nama: {
                allowNull: false,
                type: DataTypes.STRING,
            },
            kode: {
                unique: true,
                allowNull: false,
                type: DataTypes.STRING,
            },
            tanggalMulai: {
                allowNull: false,
                type: DataTypes.DATEONLY,
                field: 'tanggal_mulai'
            },
            tanggalSelesai: {
                allowNull: false,
                type: DataTypes.DATEONLY,
                field: 'tanggal_selesai'
            },
            status: {
                allowNull: false,
                type: DataTypes.STRING,
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "PeriodeAkademik",
            tableName: "siak_periode_akademik",
        }
    );

    return PeriodeAkademik;
}
