'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("siak_jas_almamater", {
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

    await queryInterface.addIndex("siak_jas_almamater", ["nama"], {
      name: "siak_jas_almamater_nama_unique_index",
      unique: true,
      where: { deleted_at: null },
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("siak_jas_almamater", "siak_jas_almamater_nama_unique_index");
    await queryInterface.dropTable("siak_jas_almamater");
  },
};
