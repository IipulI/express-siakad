import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class MasterMetodeEvaluasi extends Model {}

    MasterMetodeEvaluasi.init({
        id: { 
            type: DataTypes.UUID, 
            primaryKey: true, 
            defaultValue: uuid7 
        },
        namaMetode: { 
            type: DataTypes.STRING, 
            field: 'nama_metode' 
        }
    }, {
        sequelize, 
        underscored: true, 
        timestamps: true, 
        paranoid: true,
        modelName: "MasterMetodeEvaluasi", 
        tableName: "siak_master_metode_evaluasi"
    });

    return MasterMetodeEvaluasi;
}