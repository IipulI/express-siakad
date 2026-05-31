'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Pengecekan aman (Smart Migration)
    const tableInfo = await queryInterface.describeTable('siak_rencana_pembelajaran');

    if (!tableInfo.siak_periode_akademik_id) {
      await queryInterface.addColumn('siak_rencana_pembelajaran', 'siak_periode_akademik_id', {
        type: Sequelize.UUID,
        allowNull: true, // Allow null sementara biar data lama nggak error
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('siak_rencana_pembelajaran', 'siak_periode_akademik_id');
  }
};