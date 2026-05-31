import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class IndikatorKinerja extends Model {
        static associate(models) {
           this.belongsTo(models.CapaianPembelajaranLulusan, {
        foreignKey: 'siak_cpl_id',
        as: 'cpl'
    });
        }
    }

    IndikatorKinerja.init({
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: uuid7 },
        siakCplId: { type: DataTypes.UUID, field: 'siak_cpl_id', allowNull: false },
        kode: { type: DataTypes.STRING, allowNull: false },
        deskripsi: { type: DataTypes.TEXT, allowNull: false },
        deskripsiEn: { type: DataTypes.TEXT, field: 'deskripsi_en' }
    }, {
        sequelize,
        underscored: true,
        paranoid: true,
        modelName: "IndikatorKinerja",
        tableName: "siak_indikator_kinerja",
    });

    return IndikatorKinerja;
};