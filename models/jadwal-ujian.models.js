// No need for 'use strict'; in ES Modules
import { Model, DataTypes } from 'sequelize';

export default (sequelize) => {
    class Mahasiswa extends Model {
        static associate(models) {
            // define association here
        }
    }
    Mahasiswa.init({
        nama: DataTypes.STRING,
        nim: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Mahasiswa',
    });
    return Mahasiswa;
};