'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('siak_mata_kuliah', 'topik', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('siak_mata_kuliah', 'kompetensi_dasar', {
      type: Sequelize.TEXT,
      allowNull: true,
      field: 'kompetensi_dasar'
    });
    await queryInterface.addColumn('siak_mata_kuliah', 'sks_minimal', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      field: 'sks_minimal'
    });
    await queryInterface.addColumn('siak_mata_kuliah', 'is_paket', {
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: false,
      field: 'is_paket'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('siak_mata_kuliah', 'topik');
    await queryInterface.removeColumn('siak_mata_kuliah', 'kompetensi_dasar');
    await queryInterface.removeColumn('siak_mata_kuliah', 'sks_minimal');
    await queryInterface.removeColumn('siak_mata_kuliah', 'is_paket');
  }
};