'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_ekivalensi_mata_kuliah', {
      id: { 
        type: Sequelize.UUID, 
        primaryKey: true, 
        allowNull: false 
      },
      siak_mata_kuliah_id: { 
        type: Sequelize.UUID, 
        allowNull: false // ID MK Kurikulum Baru (Sisi Kiri di UI)
      },
      siak_mata_kuliah_lama_id: { 
        type: Sequelize.UUID, 
        allowNull: false // ID MK Kurikulum Lama (Sisi Kanan di UI)
      },
      created_at: { type: Sequelize.DATE },
      updated_at: { type: Sequelize.DATE },
      deleted_at: { type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_ekivalensi_mata_kuliah');
  }
};