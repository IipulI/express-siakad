// /models/program-studi.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
  class TeamPenyusunRps extends Model {
    static associate(models) {}
  }

  TeamPenyusunRps.init(
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

      modelName: "TeamPenyusunRps",
      tableName: "siak_team_penysun_rps",
    }
  );

  return TeamPenyusunRps;
};
