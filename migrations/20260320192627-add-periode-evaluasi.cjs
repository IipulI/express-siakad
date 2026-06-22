'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    const tableInfo = await queryInterface.describeTable('siak_rencana_evaluasi');
    if (!tableInfo.siak_periode_akademik_id) {
      await queryInterface.addColumn('siak_rencana_evaluasi', 'siak_periode_akademik_id', {
        type: Sequelize.UUID,
        allowNull: true,
      });
    }
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('siak_rencana_evaluasi', 'siak_periode_akademik_id');
  }
};