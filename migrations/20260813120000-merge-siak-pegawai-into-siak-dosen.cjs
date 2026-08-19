'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Lepas FK siak_pengumuman -> siak_pegawai (lama) supaya tabel siak_pegawai bisa di-drop
    await queryInterface.removeConstraint(
      "siak_pengumuman",
      "siak_pengumuman_siak_pegawai_id_foreign"
    );

    // 2. Drop tabel siak_pegawai lama (kosong, belum pernah dipakai nyata)
    await queryInterface.dropTable("siak_pegawai");

    // 3. siak_dosen jadi tabel gabungan, ganti nama jadi siak_pegawai
    await queryInterface.renameTable("siak_dosen", "siak_pegawai");

    // 4. Rapikan nama constraint/index bawaan siak_dosen supaya konsisten dengan nama tabel baru
    await queryInterface.sequelize.query(
      'ALTER TABLE "siak_pegawai" RENAME CONSTRAINT "siak_dosen_pkey" TO "siak_pegawai_pkey";'
    );
    await queryInterface.sequelize.query(
      'ALTER INDEX "siak_dosen_siak_user_id_index" RENAME TO "siak_pegawai_siak_user_id_index";'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "siak_pegawai" RENAME CONSTRAINT "siak_dosen_siak_user_id_foreign" TO "siak_pegawai_siak_user_id_foreign";'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "siak_pegawai" RENAME CONSTRAINT "siak_dosen_unit_kerja_id_fkey" TO "siak_pegawai_unit_kerja_id_fkey";'
    );

    // 5. Tambah kolom role
    await queryInterface.addColumn("siak_pegawai", "is_dosen", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("siak_pegawai", "is_pegawai", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    // 6. Backfill: semua baris eksisting berasal dari siak_dosen -> tandai sebagai dosen
    await queryInterface.sequelize.query(
      'UPDATE "siak_pegawai" SET "is_dosen" = true;'
    );

    // 7. Pasang lagi FK siak_pengumuman -> siak_pegawai (tabel gabungan)
    await queryInterface.addConstraint("siak_pengumuman", {
      fields: ["siak_pegawai_id"],
      type: "foreign key",
      name: "siak_pengumuman_siak_pegawai_id_foreign",
      references: {
        table: "siak_pegawai",
        field: "id",
      },
      onUpdate: "cascade",
    });
  },

  async down(queryInterface, Sequelize) {
    // Urutan down terbalik dari up

    await queryInterface.removeConstraint(
      "siak_pengumuman",
      "siak_pengumuman_siak_pegawai_id_foreign"
    );

    await queryInterface.removeColumn("siak_pegawai", "is_pegawai");
    await queryInterface.removeColumn("siak_pegawai", "is_dosen");

    await queryInterface.sequelize.query(
      'ALTER TABLE "siak_pegawai" RENAME CONSTRAINT "siak_pegawai_unit_kerja_id_fkey" TO "siak_dosen_unit_kerja_id_fkey";'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "siak_pegawai" RENAME CONSTRAINT "siak_pegawai_siak_user_id_foreign" TO "siak_dosen_siak_user_id_foreign";'
    );
    await queryInterface.sequelize.query(
      'ALTER INDEX "siak_pegawai_siak_user_id_index" RENAME TO "siak_dosen_siak_user_id_index";'
    );
    await queryInterface.sequelize.query(
      'ALTER TABLE "siak_pegawai" RENAME CONSTRAINT "siak_pegawai_pkey" TO "siak_dosen_pkey";'
    );

    await queryInterface.renameTable("siak_pegawai", "siak_dosen");

    // Buat ulang tabel siak_pegawai (lama) persis seperti struktur sebelum merge
    await queryInterface.createTable("siak_pegawai", {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
      },
      siak_user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: "siak_user",
          key: "id",
        },
        onDelete: "RESTRICT",
      },
      nama: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      nip: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      nidn: {
        type: Sequelize.STRING(50),
      },
      nuptk: {
        type: Sequelize.STRING(50),
      },
      simpeg_m_id: {
        type: Sequelize.UUID,
      },
      gelar_depan: {
        type: Sequelize.STRING(255),
      },
      gelar_belakang: {
        type: Sequelize.STRING(255),
      },
      jenis_kelamin: {
        type: Sequelize.STRING(255),
      },
      email_pegawai: {
        type: Sequelize.STRING(255),
      },
      jabatan_fungsional: {
        type: Sequelize.STRING(255),
      },
      jabatan_struktural: {
        type: Sequelize.STRING(255),
      },
      pangkat: {
        type: Sequelize.STRING(255),
      },
      eselon: {
        type: Sequelize.STRING(255),
      },
      status_aktif: {
        type: Sequelize.STRING(255),
      },
      unit_kerja_id: {
        type: Sequelize.UUID,
        references: {
          model: "siak_unit_kerja",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      created_at: {
        type: Sequelize.DATE,
      },
      updated_at: {
        type: Sequelize.DATE,
      },
      deleted_at: {
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex("siak_pegawai", ["siak_user_id"], {
      name: "siak_pegawai_siak_user_id_index",
    });

    await queryInterface.addConstraint("siak_pengumuman", {
      fields: ["siak_pegawai_id"],
      type: "foreign key",
      name: "siak_pengumuman_siak_pegawai_id_foreign",
      references: {
        table: "siak_pegawai",
        field: "id",
      },
      onUpdate: "cascade",
    });
  },
};
