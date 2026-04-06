'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Buat Tabel RPS
    await queryInterface.createTable('siak_rps', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_mata_kuliah_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'siak_mata_kuliah', key: 'id' } },
      tanggal_penyusunan: { type: Sequelize.DATEONLY, allowNull: false },
      deskripsi_mata_kuliah: { type: Sequelize.TEXT, allowNull: false },
      tujuan_mata_kuliah: { type: Sequelize.TEXT, allowNull: false },
      materi_pembelajaran: { type: Sequelize.TEXT, allowNull: false },
      pustaka_utama: { type: Sequelize.TEXT, allowNull: false },
      pustaka_pendukung: { type: Sequelize.TEXT, allowNull: false },
      dokumen_rps: { type: Sequelize.TEXT, allowNull: false },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: true, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });

    // 2. Buat Tabel Rencana Pembelajaran (Sesi)
    await queryInterface.createTable('siak_rencana_pembelajaran', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_mata_kuliah_id: { type: Sequelize.UUID, allowNull: false, references: { model: 'siak_mata_kuliah', key: 'id' } },
      sesi: { type: Sequelize.INTEGER, allowNull: false },
      cpmk_sub_cpmk: { type: Sequelize.TEXT, allowNull: true },
      materi_pembelajaran: { type: Sequelize.TEXT, allowNull: true },
      indikator_penilaian: { type: Sequelize.TEXT, allowNull: true },
      metode_pembelajaran: { type: Sequelize.TEXT, allowNull: true },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: false, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_rencana_pembelajaran');
    await queryInterface.dropTable('siak_rps');
  }
};