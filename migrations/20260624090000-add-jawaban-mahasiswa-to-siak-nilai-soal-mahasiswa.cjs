'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('siak_nilai_soal_mahasiswa', 'jawaban_mahasiswa', {
      type: Sequelize.TEXT,
      allowNull: true
      // Khusus soal jenis_unit = 'OBJEKTIF': label opsi yang dipilih mahasiswa (mis. "B").
      // Diisi otomatis kalau dosen kirim jawabanMahasiswa, lalu skor dihitung sistem
      // dengan mencocokkan ke kunci_jawaban soal (bukan diketik manual oleh dosen).
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('siak_nilai_soal_mahasiswa', 'jawaban_mahasiswa');
  }
};
