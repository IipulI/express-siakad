'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_indikator_kinerja', {
      id: { type: Sequelize.UUID, primaryKey: true, allowNull: false },
      siak_cpl_id: { 
        type: Sequelize.UUID, 
        allowNull: false,
        references: { model: 'siak_capaian_pembelajaran_lulusan', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE'
      },
      kode: { type: Sequelize.STRING, allowNull: false },
      deskripsi: { type: Sequelize.TEXT, allowNull: false },
      deskripsi_en: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE, allowNull: true }
    });
  },
  async down(queryInterface) {
    await queryInterface.dropTable('siak_indikator_kinerja');
  }
};