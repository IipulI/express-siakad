'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    /**
     * Add altering commands here.
     *
     * Example:
     * await queryInterface.createTable('users', { id: Sequelize.INTEGER });
     */

    await queryInterface.createTable("siak_unit_kerja", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      parent_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: "siak_unit_kerja",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      eportal_m_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      kode: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      nama: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      jenis: {
        type: Sequelize.ENUM("universitas", "fakultas", "prodi"),
        allowNull: true,
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

    // 2. Tambah kolom siak_unit_kerja_id ke siak_fakultas
    await queryInterface.addColumn("siak_fakultas", "siak_unit_kerja_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "siak_unit_kerja",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await queryInterface.addIndex("siak_fakultas", ["siak_unit_kerja_id"], {
      name: "siak_fakultas_siak_unit_kerja_id_index",
    });

    // 3. Tambah kolom siak_unit_kerja_id ke siak_program_studi
    await queryInterface.addColumn("siak_program_studi", "siak_unit_kerja_id", {
      type: Sequelize.UUID,
      allowNull: true,
      references: {
        model: "siak_unit_kerja",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    });
    await queryInterface.addIndex("siak_program_studi", ["siak_unit_kerja_id"], {
      name: "siak_program_studi_siak_unit_kerja_id_index",
    });

    // 4. Index
    await queryInterface.addIndex("siak_unit_kerja", ["parent_id"], {
      name: "siak_unit_kerja_parent_id_index",
    });
    await queryInterface.addIndex("siak_unit_kerja", ["jenis"], {
      name: "siak_unit_kerja_jenis_index",
    });
    await queryInterface.addIndex("siak_unit_kerja", ["kode"], {
      name: "siak_unit_kerja_kode_unique_index",
      unique: true,
      where: { deleted_at: null }, // partial unique index
    });
  },

  async down (queryInterface, Sequelize) {
    /**
     * Add reverting commands here.
     *
     * Example:
     * await queryInterface.dropTable('users');
     */
    // Urutan down harus terbalik dari up

    // 4. Hapus dari siak_program_studi
    await queryInterface.removeIndex("siak_program_studi", "siak_program_studi_siak_unit_kerja_id_index");
    await queryInterface.removeColumn("siak_program_studi", "siak_unit_kerja_id");

    // 3. Hapus dari siak_fakultas
    await queryInterface.removeIndex("siak_fakultas", "siak_fakultas_siak_unit_kerja_id_index");
    await queryInterface.removeColumn("siak_fakultas", "siak_unit_kerja_id");

    // 2. Hapus index siak_unit_kerja
    await queryInterface.removeIndex("siak_unit_kerja", "siak_unit_kerja_kode_unique_index");
    await queryInterface.removeIndex("siak_unit_kerja", "siak_unit_kerja_jenis_index");
    await queryInterface.removeIndex("siak_unit_kerja", "siak_unit_kerja_parent_id_index");

    // 1. Drop tabel
    await queryInterface.dropTable("siak_unit_kerja");

    // Drop ENUM type (PostgreSQL spesifik)
    await queryInterface.sequelize.query(
        'DROP TYPE IF EXISTS "enum_siak_unit_kerja_jenis";'
    );
  }
};
