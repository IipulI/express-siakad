// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class Pengumuman extends Model {
    static associate(models) {
      //   this.belongsTo(models.Pegawai);
    }
  }

  Pengumuman.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuid7,
      },
      siakPegawaiId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "siak_pegawai_id",
      },
      judul: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      isi: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      isPriority: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
      },
      banner: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      sequelize,
      underscored: true,
      timestamps: true,
      paranoid: true,

      modelName: "Pengumuman",
      tableName: "siak_pengumuman",
    }
  );

  return Pengumuman;
};
