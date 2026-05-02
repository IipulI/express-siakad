'use strict';

/**
 * Migration: Ubah tipe kolom bobot di siak_rencana_evaluasi
 * dari INTEGER menjadi NUMERIC(5,2)
 * 
 * Alasan: Model Sequelize sudah DECIMAL(5,2), tapi DB masih INTEGER.
 * Dengan tipe NUMERIC, dosen bisa input bobot desimal (misal: 33.33%).
 * 
 * CATATAN: Tidak ada data loss — nilai integer lama otomatis compatible
 * dengan NUMERIC(5,2). Misal: 30 → 30.00
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn('siak_rencana_evaluasi', 'bobot', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn('siak_rencana_evaluasi', 'bobot', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0
    });
  }
};
