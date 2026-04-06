'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // 1. Tambahkan kolom kaprodi_id ke tabel siak_program_studi
    await queryInterface.addColumn('siak_program_studi', 'kaprodi_id', {
      type: Sequelize.UUID,
      allowNull: true, // Boleh kosong, in case Prodi lagi nggak ada kaprodi
    });

    // 2. Tambahkan Foreign Key (Relasi ke tabel siak_dosen)
    await queryInterface.addConstraint('siak_program_studi', {
      fields: ['kaprodi_id'],
      type: 'foreign key',
      name: 'fk_siak_program_studi_kaprodi_id', // Nama bebas, tapi harus unik
      references: {
        table: 'siak_dosen',
        field: 'id'
      },
      onDelete: 'SET NULL', // Kalau dosen dihapus, kaprodi_id jadi NULL (Prodi tidak ikut terhapus)
      onUpdate: 'CASCADE'
    });
  },

  async down (queryInterface, Sequelize) {
    // Revert/Undo: Hapus constraint dulu, baru hapus kolomnya
    await queryInterface.removeConstraint('siak_program_studi', 'fk_siak_program_studi_kaprodi_id');
    await queryInterface.removeColumn('siak_program_studi', 'kaprodi_id');
  }
};