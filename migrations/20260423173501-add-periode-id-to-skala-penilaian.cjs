'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('siak_skala_penilaian', 'siak_periode_akademik_id', {
      type: Sequelize.UUID,
      allowNull: true, // Nullable karena bisa buat "Periode Awal Kurikulum"
      references: {
        model: 'siak_periode_akademik', // Pastikan nama tabel periode Abang benar ini
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('siak_skala_penilaian', 'siak_periode_akademik_id');
  }
};