// /models/program-studi.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class ProgramStudi extends Model {
    static associate(models) {
      this.belongsTo(models.Fakultas, {
        foreignKey: "siak_fakultas_id",
      });

      this.belongsTo(models.Jenjang, {
        foreignKey: "siak_jenjang_id",
        as: "jenjang"
      });
    }
  }

  ProgramStudi.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        defaultValue: uuid7,
      },
      siakFakultasId: {
        type: DataTypes.UUID,
        fields: "siak_fakultas_id",
      },
      siakJenjangId: {
        type: DataTypes.UUID,
        fields: "siak_jenjang_id",
      },
      nama: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      kode: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      underscored: true,
      timestamps: true,
      paranoid: true,

      modelName: "ProgramStudi",
      tableName: "siak_program_studi",
    }
  );

  return ProgramStudi;
};
