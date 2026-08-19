'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Constraint lama (krs_id, rencana_evaluasi_id, cpmk_id) dibuat SEBELUM fitur
    // gabung kontribusi CBT + MANUAL ada (lihat tulisManualRowsKeLedger &
    // hitungDanOverrideNilaiCpmkDariKomponen di services/penilaian.service.js,
    // revisi 2026-07-16) -- akibatnya baris MANUAL baru bentrok "duplikat" sama
    // baris CBT lama utk kombinasi (rencana_evaluasi, cpmk) yang sama, padahal
    // desainnya memang harus bisa hidup berdampingan lalu digabung saat rollup.
    await queryInterface.removeIndex(
      'siak_nilai_subcpmk_evaluasi_mahasiswa',
      'uniq_nilai_subcpmk_evaluasi_mahasiswa'
    );
    await queryInterface.addIndex('siak_nilai_subcpmk_evaluasi_mahasiswa', {
      fields: ['siak_rincian_krs_mahasiswa_id', 'siak_rencana_evaluasi_id', 'siak_cpmk_id', 'sumber'],
      unique: true,
      name: 'uniq_nilai_subcpmk_evaluasi_mahasiswa'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex(
      'siak_nilai_subcpmk_evaluasi_mahasiswa',
      'uniq_nilai_subcpmk_evaluasi_mahasiswa'
    );
    await queryInterface.addIndex('siak_nilai_subcpmk_evaluasi_mahasiswa', {
      fields: ['siak_rincian_krs_mahasiswa_id', 'siak_rencana_evaluasi_id', 'siak_cpmk_id'],
      unique: true,
      name: 'uniq_nilai_subcpmk_evaluasi_mahasiswa'
    });
  }
};
