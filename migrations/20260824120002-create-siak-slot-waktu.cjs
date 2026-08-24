'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("siak_slot_waktu", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      nama: {
        type: Sequelize.STRING(75),
        allowNull: false,
      },
      jam_mulai: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      jam_selesai: {
        type: Sequelize.TIME,
        allowNull: false,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
    });

    await queryInterface.addIndex("siak_slot_waktu", ["nama"], {
      name: "siak_slot_waktu_nama_unique_index",
      unique: true,
      where: { deleted_at: null },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("siak_slot_waktu", "siak_slot_waktu_nama_unique_index");
    await queryInterface.dropTable("siak_slot_waktu");
  },
};
