'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_mahasiswa', {
      id: { allowNull: false, primaryKey: true, type: Sequelize.UUID },
      siak_program_studi_id: { type: Sequelize.UUID },
      nama: { type: Sequelize.STRING, allowNull: false },
      npm: { type: Sequelize.STRING, allowNull: false },
      angkatan: { type: Sequelize.STRING },
      semester: { type: Sequelize.INTEGER },
      periode_masuk: { type: Sequelize.STRING },
      periode_keluar: { type: Sequelize.STRING },
      kebutuhan_khusus: { type: Sequelize.BOOLEAN },
      status: { type: Sequelize.STRING },
      biodata_valid: { type: Sequelize.BOOLEAN },
      jenis_kelamin: { type: Sequelize.STRING },
      tempat_lahir: { type: Sequelize.STRING },
      tanggal_lahir: { type: Sequelize.DATEONLY },
      berat_badan: { type: Sequelize.INTEGER },
      tinggi_badan: { type: Sequelize.INTEGER },
      golongan_darah: { type: Sequelize.STRING },
      no_telepon: { type: Sequelize.STRING },
      no_whatsapp: { type: Sequelize.STRING },
      email_pribadi: { type: Sequelize.STRING },
      email_kampus: { type: Sequelize.STRING },
      kewarganegaraan: { type: Sequelize.STRING },
      paspor: { type: Sequelize.STRING },
      no_kk: { type: Sequelize.STRING },
      nik: { type: Sequelize.STRING },
      status_nikah: { type: Sequelize.STRING },
      created_at: { allowNull: false, type: Sequelize.DATE },
      updated_at: { allowNull: true, type: Sequelize.DATE },
      deleted_at: { allowNull: true, type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_mahasiswa');
  }
};