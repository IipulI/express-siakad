'use strict';
const { v7: uuid7 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Data Master Metode Evaluasi
    const metodeEvaluasi = [
      { id: uuid7(), nama_metode: 'Aktivitas partisipatif', created_at: new Date(), updated_at: new Date() },
      { id: uuid7(), nama_metode: 'Hasil Proyek', created_at: new Date(), updated_at: new Date() },
      { id: uuid7(), nama_metode: 'Kognitif/Pengetahuan - Tugas', created_at: new Date(), updated_at: new Date() },
      { id: uuid7(), nama_metode: 'Kognitif/Pengetahuan - Quiz', created_at: new Date(), updated_at: new Date() },
      { id: uuid7(), nama_metode: 'Kognitif/Pengetahuan - Ujian Tengah Semester', created_at: new Date(), updated_at: new Date() },
      { id: uuid7(), nama_metode: 'Kognitif/Pengetahuan - Ujian Akhir Semester', created_at: new Date(), updated_at: new Date() }
    ];

    // 2. Data Master Komponen Evaluasi
    const komponenEvaluasi = [
      'TUGAS INDIVIDU', 'UTS', 'UAS', 'PRAKTIKUM', 'DISKUSI', 'KEHADIRAN', 
      'PRILAKU', 'TUGAS KELOMPOK', 'SEMINAR PROPOSAL', 'SEMINAR HASIL', 
      'BIMBINGAN', 'LAPORAN PRAKTIKUM', 'QUIZ', 'KOMPREHENSIF', 
      'PROGRAM SANDWICH', 'PRE-TEST', 'POST-TEST', 'BIMBINGAN TA', 'PENGUJI TA'
    ].map(nama => ({
      id: uuid7(), nama_komponen: nama, created_at: new Date(), updated_at: new Date()
    }));

    await queryInterface.bulkInsert('siak_master_metode_evaluasi', metodeEvaluasi, {});
    await queryInterface.bulkInsert('siak_master_komponen_evaluasi', komponenEvaluasi, {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('siak_master_metode_evaluasi', null, {});
    await queryInterface.bulkDelete('siak_master_komponen_evaluasi', null, {});
  }
};