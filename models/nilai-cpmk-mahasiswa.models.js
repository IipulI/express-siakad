import { Model, DataTypes } from 'sequelize';
import { v7 as uuid7 } from 'uuid';

/**
 * Model: NilaiCpmkMahasiswa
 * Tabel: siak_nilai_cpmk_mahasiswa
 * 
 * Menyimpan nilai per-CPMK per-mahasiswa per-kelas.
 * Diisi oleh dosen saat proses penilaian OBE.
 * 
 * Relasi:
 *  - BelongsTo KelasKuliah (via siak_kelas_kuliah_id)
 *  - BelongsTo Mahasiswa (via siak_mahasiswa_id)
 *  - BelongsTo CapaianMataKuliah (via siak_capaian_mata_kuliah_id)
 */
export default (sequelize) => {
    class NilaiCpmkMahasiswa extends Model {
        static associate(models) {
            this.belongsTo(models.KelasKuliah, {
                foreignKey: 'siak_kelas_kuliah_id',
                as: 'kelasKuliah'
            });
            this.belongsTo(models.Mahasiswa, {
                foreignKey: 'siak_mahasiswa_id',
                as: 'mahasiswa'
            });
            this.belongsTo(models.CapaianMataKuliah, {
                foreignKey: 'siak_capaian_mata_kuliah_id',
                as: 'capaianMataKuliah'
            });
        }
    }

    NilaiCpmkMahasiswa.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: uuid7
        },
        siakKelasKuliahId: {
            type: DataTypes.UUID,
            field: 'siak_kelas_kuliah_id',
            allowNull: false
        },
        siakMahasiswaId: {
            type: DataTypes.UUID,
            field: 'siak_mahasiswa_id',
            allowNull: false
        },
        siakCapaianMataKuliahId: {
            type: DataTypes.UUID,
            field: 'siak_capaian_mata_kuliah_id',
            allowNull: false
        },
        nilai: {
            type: DataTypes.DECIMAL(5, 2),
            allowNull: true,
            comment: 'Nilai capaian mahasiswa untuk CPMK ini (0-100)'
        }
    }, {
        sequelize,
        underscored: true,
        timestamps: true,
        paranoid: true,
        modelName: 'NilaiCpmkMahasiswa',
        tableName: 'siak_nilai_cpmk_mahasiswa'
    });

    return NilaiCpmkMahasiswa;
};
