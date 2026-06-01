'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('siak_predikat_kelulusan', {
      id: { 
        type: Sequelize.UUID, 
        primaryKey: true, 
        allowNull: false 
      },
      siak_tahun_kurikulum_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      siak_jenjang_id: { 
        type: Sequelize.UUID, 
        allowNull: false 
      },
      kode: { 
        type: Sequelize.STRING(10) 
      },
      nama_ind: { 
        type: Sequelize.STRING 
      },
      nama_eng: { 
        type: Sequelize.STRING 
      },
      ipk_min: { 
        type: Sequelize.DECIMAL(3, 2) 
      },
      ipk_max: { 
        type: Sequelize.DECIMAL(3, 2) 
      },
      masa_studi: { 
        type: Sequelize.INTEGER 
      },
      is_cuti: { 
        type: Sequelize.BOOLEAN, 
        defaultValue: false 
      },
      is_mengulang: { 
        type: Sequelize.BOOLEAN, 
        defaultValue: false 
      },
      nilai_min: { 
        type: Sequelize.STRING(5), 
        allowNull: true 
      },
      nilai_min_ta: { 
        type: Sequelize.STRING(5), 
        allowNull: true 
      },
      is_maba_only: { 
        type: Sequelize.BOOLEAN, 
        defaultValue: false 
      },
      created_at: { 
        type: Sequelize.DATE 
      },
      updated_at: { 
        type: Sequelize.DATE 
      },
      deleted_at: { 
        type: Sequelize.DATE 
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('siak_predikat_kelulusan');
  }
};