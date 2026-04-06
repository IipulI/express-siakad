'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Hapus kolom syarat_lulus yang lama (yang tipenya BOOLEAN)
    await queryInterface.removeColumn('siak_template_evaluasi', 'syarat_lulus');

    // 2. Bikin ulang kolom syarat_lulus dengan tipe STRING
    await queryInterface.addColumn('siak_template_evaluasi', 'syarat_lulus', {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'TIDAK_WAJIB' // Nilai default-nya sekarang string
    });

    // 3. Tambahkan kolom baru nilai_minimum
    await queryInterface.addColumn('siak_template_evaluasi', 'nilai_minimum', {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: true // Boleh kosong
    });
  },

  async down(queryInterface, Sequelize) {
    // Kalau mau di-rollback, kita balikkan ke keadaan semula
    await queryInterface.removeColumn('siak_template_evaluasi', 'nilai_minimum');
    await queryInterface.removeColumn('siak_template_evaluasi', 'syarat_lulus');
    
    // Kembalikan syarat_lulus jadi boolean
    await queryInterface.addColumn('siak_template_evaluasi', 'syarat_lulus', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
  }
};