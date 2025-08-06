'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_mata_kuliah', {
        id: {
            allowNull: false,
            primaryKey: true,
            type: Sequelize.UUID
        },
        siak_program_studi_id: {
            allowNull: false,
            type: Sequelize.UUID
        },
        siak_tahun_kurikulum_id: {
            allowNull: false,
            type: Sequelize.UUID
        },
        nama: {
            allowNull: false,
            type: Sequelize.STRING
        },
        kode: {
            allowNull: false,
            type: Sequelize.STRING
        },
        jenis: {
            allowNull: false,
            type: Sequelize.STRING
        },
        semester: {
            allowNull: true,
            type: Sequelize.INTEGER
        },
        nilai_min: {
            allowNull: true,
            type: Sequelize.STRING(5)
        },
        ada_praktikum: {
            allowNull: false,
            type: Sequelize.BOOLEAN
        },
        opsi_wajib: {
            allowNull: true,
            type: Sequelize.BOOLEAN
        },
        sks_tatap_muka: {
            allowNull: true,
            type: Sequelize.INTEGER
        },
        sks_praktikum: {
            allowNull: true,
            type: Sequelize.INTEGER
        },
        sks_praktik_lapangan: {
            allowNull: true,
            type: Sequelize.INTEGER
        },
        total_sks:{
            allowNull: true,
            type: Sequelize.INTEGER
        },
        created_at: {
            allowNull: false,
            type: Sequelize.DATE
        },
        updated_at: {
            allowNull: true,
            type: Sequelize.DATE
        },
        deleted_at: {
            allowNull: true,
            type: Sequelize.DATE
        }
    });

    await queryInterface.addIndex('siak_mata_kuliah', ['siak_program_studi_id'], {
        name: 'siak_mata_kuliah_program_studi_id',
        using: "BTREE"
    });

    await queryInterface.addIndex('siak_mata_kuliah', ['siak_tahun_kurikulum_id'], {
        name: 'siak_mata_kuliah_tahun_kurikulum_id',
        using: "BTREE"
    })
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_mata_kuliah');
  }
};