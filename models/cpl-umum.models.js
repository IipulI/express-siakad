import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
    class CplUmum extends Model {
        static associate(models) {
            // Relasi ke Tahun Kurikulum
            this.belongsTo(models.TahunKurikulum, {
                foreignKey: 'siak_tahun_kurikulum_id',
                as: 'tahunKurikulum'
            });
        }
    }

    CplUmum.init({
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
        kode: {
            type: DataTypes.STRING(50),
        },
        deskripsiInd: {
            type: DataTypes.TEXT,
            field: 'deskripsi_ind'
        },
        deskripsiEng: {
            type: DataTypes.TEXT,
            field: 'deskripsi_eng'
        },
        targetCpl: {
            type: DataTypes.DOUBLE,
            field: 'target_cpl'
        },
        kategori: {
            type: DataTypes.STRING(100)
        },
        tingkatCpl: {
            type: DataTypes.STRING(100),
            field: 'tingkat_cpl'
        }
    }, {
        sequelize,
        modelName: 'CplUmum',
        tableName: 'siak_cpl_umum',
        underscored: true,
        paranoid: true // Soft delete
    });

    return CplUmum;
};