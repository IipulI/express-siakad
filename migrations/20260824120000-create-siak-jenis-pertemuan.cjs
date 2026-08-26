'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("siak_jenis_pertemuan", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      nama: {
        type: Sequelize.STRING(75),
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

    await queryInterface.addIndex("siak_jenis_pertemuan", ["nama"], {
      name: "siak_jenis_pertemuan_nama_unique_index",
      unique: true,
      where: { deleted_at: null },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("siak_jenis_pertemuan", "siak_jenis_pertemuan_nama_unique_index");
    await queryInterface.dropTable("siak_jenis_pertemuan");
  },
};
