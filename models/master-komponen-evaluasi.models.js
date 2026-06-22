import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class MasterKomponenEvaluasi extends Model {}

    MasterKomponenEvaluasi.init({
        id: { 
            type: DataTypes.UUID, 
            primaryKey: true, 
            defaultValue: uuid7 
        },
        namaKomponen: { 
            type: DataTypes.STRING, 
            field: 'nama_komponen' 
        }
    }, {
        sequelize, 
        underscored: true, 
        timestamps: true, 
        paranoid: true,
        modelName: "MasterKomponenEvaluasi", 
        tableName: "siak_master_komponen_evaluasi"
    });

    return MasterKomponenEvaluasi;
}