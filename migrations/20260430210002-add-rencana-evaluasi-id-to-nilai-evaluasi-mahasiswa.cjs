'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('siak_nilai_evaluasi_mahasiswa', 'siak_rencana_evaluasi_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'siak_rencana_evaluasi',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('siak_nilai_evaluasi_mahasiswa', ['siak_rencana_evaluasi_id'], {
      name: 'idx_nilai_eval_rencana_evaluasi'
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('siak_nilai_evaluasi_mahasiswa', 'idx_nilai_eval_rencana_evaluasi');
    await queryInterface.removeColumn('siak_nilai_evaluasi_mahasiswa', 'siak_rencana_evaluasi_id');
  }
};
