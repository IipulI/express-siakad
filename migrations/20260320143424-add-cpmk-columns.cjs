'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        // 1. Tambah kolom di tabel siak_mata_kuliah
        queryInterface.addColumn('siak_mata_kuliah', 'level_pemetaan', {
          type: Sequelize.STRING,
          allowNull: true, // Boleh kosong dulu karena data lama belum punya
        }, { transaction: t }),
        
        queryInterface.addColumn('siak_mata_kuliah', 'metode_pembobotan', {
          type: Sequelize.STRING,
          allowNull: true,
        }, { transaction: t }),

        // 2. Tambah kolom di tabel siak_capaian_mata_kuliah (CPMK)
        queryInterface.addColumn('siak_capaian_mata_kuliah', 'target', {
          type: Sequelize.FLOAT, // Float cocok untuk nilai desimal seperti 70.50
          allowNull: true,
          defaultValue: 0,
        }, { transaction: t }),
        
        queryInterface.addColumn('siak_capaian_mata_kuliah', 'bobot', {
          type: Sequelize.FLOAT,
          allowNull: true,
          defaultValue: 0,
        }, { transaction: t })
      ]);
    });
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.sequelize.transaction(t => {
      return Promise.all([
        // Rollback: Hapus kolom jika migration di-undo
        queryInterface.removeColumn('siak_mata_kuliah', 'level_pemetaan', { transaction: t }),
        queryInterface.removeColumn('siak_mata_kuliah', 'metode_pembobotan', { transaction: t }),
        queryInterface.removeColumn('siak_capaian_mata_kuliah', 'target', { transaction: t }),
        queryInterface.removeColumn('siak_capaian_mata_kuliah', 'bobot', { transaction: t })
      ]);
    });
  }
};