'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_template_evaluasi', {
      id: { 
        type: Sequelize.UUID, 
        primaryKey: true 
      },
      siak_tahun_kurikulum_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      siak_program_studi_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      jenis_mata_kuliah: { 
        type: Sequelize.STRING, 
        allowNull: false // Contoh: "Kuliah", "Praktikum"
      },
      metode_evaluasi: { 
        type: Sequelize.STRING, 
        allowNull: false // UI: Komponen Evaluasi (TUGAS INDIVIDU, UTS)
      },
      jenis_evaluasi: { 
        type: Sequelize.STRING, 
        allowNull: false // UI: Metode Evaluasi (Kognitif, Partisipatif)
      },
      bobot: { 
        type: Sequelize.DECIMAL(5, 2), 
        allowNull: false 
      },
      syarat_lulus: { 
        type: Sequelize.BOOLEAN, 
        defaultValue: false 
      },
      deskripsi: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      deskripsi_inggris: { 
        type: Sequelize.TEXT, 
        allowNull: true 
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
      deleted_at: { type: Sequelize.DATE }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_template_evaluasi');
  }
};