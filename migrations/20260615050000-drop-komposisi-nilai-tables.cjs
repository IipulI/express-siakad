'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Lepas FK siak_nilai_evaluasi_mahasiswa -> siak_komposisi_nilai_mata_kuliah.
    // Kolom siak_komposisi_nilai_id TETAP ADA (sudah nullable) sebagai arsip id lama,
    // grading aktual sudah pindah ke siak_rencana_evaluasi_id.
    await queryInterface.removeConstraint(
      'siak_nilai_evaluasi_mahasiswa',
      'siak_nilai_evaluasi_mahasiswa_siak_komposisi_nilai_id_fkey'
    );

    // Pivot lama CPMK <-> Komposisi (54 baris). Backup ada di backup_komposisi_nilai_20260615.json.
    await queryInterface.dropTable('siak_pemetaan_komposisi_cpmk');

    // Komposisi nilai MK lama (17 baris, sudah digantikan siak_rencana_evaluasi).
    await queryInterface.dropTable('siak_komposisi_nilai_mata_kuliah');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_komposisi_nilai_mata_kuliah', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      },
      siak_tahun_kurikulum_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      siak_mata_kuliah_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      siak_unsur_nilai_id: {
        type: Sequelize.UUID,
        allowNull: true
      },
      persentase: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true
      },
      key: {
        type: Sequelize.STRING,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.createTable('siak_pemetaan_komposisi_cpmk', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()'),
        allowNull: false
      },
      siak_komposisi_nilai_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'siak_komposisi_nilai_mata_kuliah', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      siak_cpmk_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'siak_capaian_mata_kuliah', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      bobot: {
        type: Sequelize.DOUBLE,
        allowNull: true,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addConstraint('siak_nilai_evaluasi_mahasiswa', {
      fields: ['siak_komposisi_nilai_id'],
      type: 'foreign key',
      name: 'siak_nilai_evaluasi_mahasiswa_siak_komposisi_nilai_id_fkey',
      references: { table: 'siak_komposisi_nilai_mata_kuliah', field: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    });

    // Catatan: down() hanya mengembalikan STRUKTUR tabel (kosong).
    // Untuk mengembalikan ISI data, restore manual dari backup_komposisi_nilai_20260615.json.
  }
};
