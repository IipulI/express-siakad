'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_mata_kuliah_konsentrasi', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      siak_mata_kuliah_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_mata_kuliah', // Pastikan nama tabel Mata Kuliah Abang di DB benar ini
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Kalau MK dihapus, data mapping-nya otomatis ikut hilang (bersih!)
      },
      siak_konsentrasi_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'siak_konsentrasi', // Sesuai dengan screenshot DBeaver Abang
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE' // Kalau Konsentrasi dihapus, mapping-nya juga hilang
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_mata_kuliah_konsentrasi');
  }
};