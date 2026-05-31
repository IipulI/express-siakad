import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
    class AturanEvaluasi extends Model {
        static associate(models) {
            // Relasi ke Tahun Kurikulum
            this.belongsTo(models.TahunKurikulum, {
                foreignKey: 'siak_tahun_kurikulum_id',
                as: 'tahunKurikulum'
            });

            // Relasi ke Jenjang (kalau model Jenjang sudah Abang buat)
            // this.belongsTo(models.Jenjang, {
            //     foreignKey: 'siak_jenjang_id',
            //     as: 'jenjang'
            // });
        }
    }

    AturanEvaluasi.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        siakTahunKurikulumId: {
            type: DataTypes.UUID,
            field: 'siak_tahun_kurikulum_id',
            allowNull: false
        },
        siakJenjangId: {
            type: DataTypes.UUID,
            field: 'siak_jenjang_id',
            allowNull: false
        },
        semesterKe: {
            type: DataTypes.INTEGER,
            field: 'semester_ke',
            allowNull: false
        },
        totalSksMinimal: {
            type: DataTypes.INTEGER,
            field: 'total_sks_minimal',
            defaultValue: 0
        },
        batasIpkMinimal: {
            type: DataTypes.DOUBLE,
            field: 'batas_ipk_minimal',
            defaultValue: 0.00
        }
    }, {
        sequelize,
        modelName: 'AturanEvaluasi',
        tableName: 'siak_aturan_evaluasi',
        underscored: true,
        paranoid: true // Aktifkan soft delete (deleted_at)
    });

    return AturanEvaluasi;
};