'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('siak_soal', 'pertanyaan', {
      type: Sequelize.TEXT,
      allowNull: true
    });
    await queryInterface.addColumn('siak_soal', 'opsi_jawaban', {
      type: Sequelize.JSONB,
      allowNull: true
      // Khusus jenis_unit = 'OBJEKTIF' (PG): array [{ "label": "A", "teks": "..." }, ...]
    });
    await queryInterface.addColumn('siak_soal', 'kunci_jawaban', {
      type: Sequelize.TEXT,
      allowNull: true
      // OBJEKTIF: label opsi yang benar (mis. "B"). RUBRIK: jawaban ideal/acuan penilaian (opsional).
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('siak_soal', 'pertanyaan');
    await queryInterface.removeColumn('siak_soal', 'opsi_jawaban');
    await queryInterface.removeColumn('siak_soal', 'kunci_jawaban');
  }
};
