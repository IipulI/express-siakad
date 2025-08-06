'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class tahun - kurikulum.models extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  tahun - kurikulum.models.init({
    id: DataTypes.UUID
  }, {
    sequelize,
    modelName: 'tahun-kurikulum.models',
    underscored: true,
  });
  return tahun - kurikulum.models;
};
