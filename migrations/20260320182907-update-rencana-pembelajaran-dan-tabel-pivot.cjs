'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Cek dulu kolom apa saja yang sudah ada di tabel saat ini
    const tableInfo = await queryInterface.describeTable('siak_rencana_pembelajaran');

    // 2. Tambahkan kolom HANYA JIKA belum ada di database
    if (!tableInfo.jenis_pertemuan) {
      await queryInterface.addColumn('siak_rencana_pembelajaran', 'jenis_pertemuan', { type: Sequelize.STRING, allowNull: true });
    }
    if (!tableInfo.materi_pembelajaran_eng) {
      await queryInterface.addColumn('siak_rencana_pembelajaran', 'materi_pembelajaran_eng', { type: Sequelize.TEXT, allowNull: true });
    }
    if (!tableInfo.indikator_penilaian) {
      await queryInterface.addColumn('siak_rencana_pembelajaran', 'indikator_penilaian', { type: Sequelize.TEXT, allowNull: true });
    }
    if (!tableInfo.kriteria_penilaian) {
      await queryInterface.addColumn('siak_rencana_pembelajaran', 'kriteria_penilaian', { type: Sequelize.TEXT, allowNull: true });
    }
    if (!tableInfo.metode_pembelajaran_luring) {
      await queryInterface.addColumn('siak_rencana_pembelajaran', 'metode_pembelajaran_luring', { type: Sequelize.TEXT, allowNull: true });
    }
    if (!tableInfo.metode_pembelajaran_daring) {
      await queryInterface.addColumn('siak_rencana_pembelajaran', 'metode_pembelajaran_daring', { type: Sequelize.TEXT, allowNull: true });
    }
    if (!tableInfo.bobot_penilaian) {
      await queryInterface.addColumn('siak_rencana_pembelajaran', 'bobot_penilaian', { type: Sequelize.DECIMAL(5, 2), allowNull: true, defaultValue: 0 });
    }

    // 3. Buat Tabel Pivot (Karena tadi crash sebelum sampai sini, tabel ini dipastikan belum ada)
    await queryInterface.createTable('siak_pemetaan_pembelajaran_cpmk', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
      },
      siak_rencana_pembelajaran_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_rencana_pembelajaran', 
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' 
      },
      siak_cpmk_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_capaian_mata_kuliah', 
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE
      },
      deleted_at: {
        type: Sequelize.DATE
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_pemetaan_pembelajaran_cpmk');
    // Untuk rollback, kita biarkan saja kolomnya (atau bisa ditambahkan removeColumn satu per satu jika butuh)
  }
};