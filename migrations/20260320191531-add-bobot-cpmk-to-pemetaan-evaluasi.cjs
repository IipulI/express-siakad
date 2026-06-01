'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Cek dulu apakah tabelnya ada dan kolomnya belum ada
    const tableInfo = await queryInterface.describeTable('siak_pemetaan_evaluasi_cpmk');

    if (!tableInfo.bobot_cpmk) {
      await queryInterface.addColumn('siak_pemetaan_evaluasi_cpmk', 'bobot_cpmk', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('siak_pemetaan_evaluasi_cpmk', 'bobot_cpmk');
  }
};