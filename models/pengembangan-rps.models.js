import { Model, DataTypes } from 'sequelize';
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class PengembanganRps extends Model {}

    PengembanganRps.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: uuid7
        },
        siakMataKuliahId: {
            type: DataTypes.UUID,
            field: 'siak_mata_kuliah_id',
            allowNull: false
        },
        siakDosenId: {
            type: DataTypes.UUID,
            field: 'siak_dosen_id',
            allowNull: false
        }
    }, {
        sequelize,
        underscored: true,
        timestamps: true,
        modelName: 'PengembanganRps',
        tableName: 'siak_pengembangan_rps'
    });

    return PengembanganRps;
}