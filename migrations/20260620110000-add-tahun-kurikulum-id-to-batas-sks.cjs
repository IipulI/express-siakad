'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('siak_batas_sks', 'siak_tahun_kurikulum_id', {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: 'siak_tahun_kurikulum',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    await queryInterface.addIndex('siak_batas_sks', ['siak_tahun_kurikulum_id'], {
      name: 'idx_batas_sks_tahun_kurikulum'
    });

    // Tidak ada backfill -- data lama (sebelum fitur ini scoping per Tahun
    // Kurikulum) tidak punya cara dipastikan milik tahun kurikulum mana, jadi
    // dibiarkan NULL (legacy/baseline, dipakai sebagai fallback Salin Data).
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('siak_batas_sks', 'idx_batas_sks_tahun_kurikulum');
    await queryInterface.removeColumn('siak_batas_sks', 'siak_tahun_kurikulum_id');
  }
};
