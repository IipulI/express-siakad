'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_rps', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID
      },
      siak_mata_kuliah_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_mata_kuliah',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_rps');
  }
};
