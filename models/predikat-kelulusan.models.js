import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class PredikatKelulusan extends Model {
        static associate(models) {
            // Relasi ke Tahun Kurikulum
            this.belongsTo(models.TahunKurikulum, {
                foreignKey: 'siak_tahun_kurikulum_id',
                as: 'tahunKurikulum'
            });

            // Relasi ke Jenjang
            this.belongsTo(models.Jenjang, {
                foreignKey: 'siak_jenjang_id',
                as: 'jenjang'
            });
        }
    }

    PredikatKelulusan.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: uuid7,
            allowNull: false
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
        kode: {
            type: DataTypes.STRING(10),
            allowNull: true
        },
        namaInd: {
            type: DataTypes.STRING,
            field: 'nama_ind',
            allowNull: true
        },
        namaEng: {
            type: DataTypes.STRING,
            field: 'nama_eng',
            allowNull: true
        },
        ipkMin: {
            type: DataTypes.DECIMAL(3, 2),
            field: 'ipk_min',
            allowNull: true
        },
        ipkMax: {
            type: DataTypes.DECIMAL(3, 2),
            field: 'ipk_max',
            allowNull: true
        },
        masaStudi: {
            type: DataTypes.INTEGER,
            field: 'masa_studi',
            allowNull: true
        },
        isCuti: {
            type: DataTypes.BOOLEAN,
            field: 'is_cuti',
            defaultValue: false
        },
        isMengulang: {
            type: DataTypes.BOOLEAN,
            field: 'is_mengulang',
            defaultValue: false
        },
        nilaiMin: {
            type: DataTypes.STRING(5),
            field: 'nilai_min',
            allowNull: true
        },
        nilaiMinTa: {
            type: DataTypes.STRING(5),
            field: 'nilai_min_ta',
            allowNull: true
        },
        isMabaOnly: {
            type: DataTypes.BOOLEAN,
            field: 'is_maba_only',
            defaultValue: false
        }
    }, {
        sequelize,
        underscored: true,
        timestamps: true,
        paranoid: true, // Pakai deleted_at
        modelName: "PredikatKelulusan",
        tableName: "siak_predikat_kelulusan",
    });

    return PredikatKelulusan;
};