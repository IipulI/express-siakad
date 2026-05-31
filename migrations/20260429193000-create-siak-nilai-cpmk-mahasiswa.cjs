'use strict';

/**
 * Migration: Buat tabel siak_nilai_cpmk_mahasiswa
 * 
 * Tabel ini menyimpan nilai per-CPMK per-mahasiswa per-kelas.
 * Dibutuhkan untuk:
 *   - Monitoring CPMK per mahasiswa (getLaporanCpmkPerMahasiswa)
 *   - Kalkulasi capaian CPL via bobot_cpl (perhitungan weighted, jangka panjang)
 * 
 * Nilai diisi oleh dosen saat input penilaian, berdasarkan komponen evaluasi
 * yang sudah dipetakan ke CPMK di siak_pemetaan_evaluasi_cpmk.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_nilai_cpmk_mahasiswa', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      siak_kelas_kuliah_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_kelas_kuliah',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      siak_mahasiswa_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_mahasiswa',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      siak_capaian_mata_kuliah_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_capaian_mata_kuliah',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nilai: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Nilai capaian mahasiswa untuk CPMK ini (0-100)'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    // Unique constraint: 1 mahasiswa hanya punya 1 nilai per CPMK per kelas
    await queryInterface.addConstraint('siak_nilai_cpmk_mahasiswa', {
      fields: ['siak_kelas_kuliah_id', 'siak_mahasiswa_id', 'siak_capaian_mata_kuliah_id'],
      type: 'unique',
      name: 'uq_nilai_cpmk_mahasiswa'
    });

    // Index untuk performa query monitoring
    await queryInterface.addIndex('siak_nilai_cpmk_mahasiswa', ['siak_kelas_kuliah_id'], {
      name: 'idx_nilai_cpmk_kelas'
    });
    await queryInterface.addIndex('siak_nilai_cpmk_mahasiswa', ['siak_mahasiswa_id'], {
      name: 'idx_nilai_cpmk_mhs'
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('siak_nilai_cpmk_mahasiswa');
  }
};
