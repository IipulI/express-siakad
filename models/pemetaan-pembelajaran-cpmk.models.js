import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class PemetaanPembelajaranCpmk extends Model {
    static associate(models) {
      this.belongsTo(models.RencanaPembelajaran, {
        foreignKey: "siak_rencana_pembelajaran_id",
        as: "rencanaPembelajaran"
      });
      
      this.belongsTo(models.CapaianMataKuliah, { 
        foreignKey: "siak_cpmk_id",
        as: "cpmk"
      });
    }
  }

  PemetaanPembelajaranCpmk.init({
    id: { 
        type: DataTypes.UUID, 
        primaryKey: true, 
        defaultValue: uuid7 
    },
    siakRencanaPembelajaranId: { 
        type: DataTypes.UUID, 
        field: "siak_rencana_pembelajaran_id",
        allowNull: false
    },
    siakCpmkId: { 
        type: DataTypes.UUID, 
        field: "siak_cpmk_id",
        allowNull: false
    }
  }, {
    sequelize,
    underscored: true,
    timestamps: true,
    paranoid: true,
    modelName: "PemetaanPembelajaranCpmk",
    tableName: "siak_pemetaan_pembelajaran_cpmk",
  });

  return PemetaanPembelajaranCpmk;
};