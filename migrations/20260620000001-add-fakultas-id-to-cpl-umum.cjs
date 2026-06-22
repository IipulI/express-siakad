'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('siak_cpl_umum', 'siak_fakultas_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'siak_fakultas',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('siak_cpl_umum', ['siak_fakultas_id'], {
      name: 'idx_cpl_umum_fakultas'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('siak_cpl_umum', 'idx_cpl_umum_fakultas');
    await queryInterface.removeColumn('siak_cpl_umum', 'siak_fakultas_id');
  }
};
