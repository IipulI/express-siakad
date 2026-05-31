'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('siak_rps', 'siak_periode_akademik_id', {
      type: Sequelize.UUID,
      allowNull: true, // Biar data RPS yang udah ada sebelumnya nggak error
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('siak_rps', 'siak_periode_akademik_id');
  }
};