'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeIndex("siak_slot_waktu", "siak_slot_waktu_nama_unique_index");
    await queryInterface.removeColumn("siak_slot_waktu", "nama");
    await queryInterface.removeColumn("siak_slot_waktu", "jam_mulai");
    await queryInterface.renameColumn("siak_slot_waktu", "jam_selesai", "waktu");

    await queryInterface.addIndex("siak_slot_waktu", ["waktu"], {
      name: "siak_slot_waktu_waktu_unique_index",
      unique: true,
      where: { deleted_at: null },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("siak_slot_waktu", "siak_slot_waktu_waktu_unique_index");
    await queryInterface.renameColumn("siak_slot_waktu", "waktu", "jam_selesai");
    await queryInterface.addColumn("siak_slot_waktu", "jam_mulai", {
      type: Sequelize.TIME,
      allowNull: false,
      defaultValue: "00:00:00",
    });
    await queryInterface.addColumn("siak_slot_waktu", "nama", {
      type: Sequelize.STRING(75),
      allowNull: false,
      defaultValue: "",
    });

    await queryInterface.addIndex("siak_slot_waktu", ["nama"], {
      name: "siak_slot_waktu_nama_unique_index",
      unique: true,
      where: { deleted_at: null },
    });
  },
};
