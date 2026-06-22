'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Bikin tabel Rencana Evaluasi
    await queryInterface.createTable('siak_rencana_evaluasi', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_mata_kuliah_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'siak_mata_kuliah', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      metode_evaluasi: { type: Sequelize.STRING, allowNull: true },
      jenis_evaluasi: { type: Sequelize.STRING, allowNull: false },
      bobot: { type: Sequelize.DECIMAL(5, 2), allowNull: false },
      syarat_lulus: { type: Sequelize.BOOLEAN, defaultValue: false },
      deskripsi: { type: Sequelize.TEXT, allowNull: true },
      deskripsi_inggris: { type: Sequelize.TEXT, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
      deleted_at: { type: Sequelize.DATE }
    });

    // 2. Bikin tabel Pivot untuk simpan input bobot CPMK (dari Halaman 8)
    await queryInterface.createTable('siak_pemetaan_evaluasi_cpmk', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_rencana_evaluasi_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'siak_rencana_evaluasi', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      siak_cpmk_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'siak_capaian_mata_kuliah', key: 'id' }, onUpdate: 'CASCADE', onDelete: 'CASCADE' },
      bobot_cpmk: { type: Sequelize.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
      deleted_at: { type: Sequelize.DATE }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_pemetaan_evaluasi_cpmk');
    await queryInterface.dropTable('siak_rencana_evaluasi');
  }
};