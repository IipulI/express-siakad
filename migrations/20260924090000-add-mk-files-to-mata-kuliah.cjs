'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Kolom penyimpan path file dokumen SAP/Silabus/Bahan Ajar/Diktat.
    // Field "Ada SAP" dst. sebelumnya boolean; sekarang diisi dari keberadaan file ini.
    const tableDesc = await queryInterface.describeTable('siak_mata_kuliah');

    if (!tableDesc.sap_file) {
      await queryInterface.addColumn('siak_mata_kuliah', 'sap_file', { type: Sequelize.STRING, allowNull: true });
    }
    if (!tableDesc.silabus_file) {
      await queryInterface.addColumn('siak_mata_kuliah', 'silabus_file', { type: Sequelize.STRING, allowNull: true });
    }
    if (!tableDesc.bahan_ajar_file) {
      await queryInterface.addColumn('siak_mata_kuliah', 'bahan_ajar_file', { type: Sequelize.STRING, allowNull: true });
    }
    if (!tableDesc.diktat_file) {
      await queryInterface.addColumn('siak_mata_kuliah', 'diktat_file', { type: Sequelize.STRING, allowNull: true });
    }
  },

  async down(queryInterface, Sequelize) {
    const tableDesc = await queryInterface.describeTable('siak_mata_kuliah');
    if (tableDesc.sap_file) await queryInterface.removeColumn('siak_mata_kuliah', 'sap_file');
    if (tableDesc.silabus_file) await queryInterface.removeColumn('siak_mata_kuliah', 'silabus_file');
    if (tableDesc.bahan_ajar_file) await queryInterface.removeColumn('siak_mata_kuliah', 'bahan_ajar_file');
    if (tableDesc.diktat_file) await queryInterface.removeColumn('siak_mata_kuliah', 'diktat_file');
  }
};