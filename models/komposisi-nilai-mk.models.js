import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class KomposisiNilaiMataKuliah extends Model {
        static associate(models) {
            this.belongsToMany(models.CapaianMataKuliah, {
                through: models.PemetaanKomposisiCpmk,
                foreignKey: "siakKomposisiNilaiId",
                otherKey: "siakCpmkId",
                as: "cpmkList"
            });
            
            this.hasMany(models.NilaiEvaluasiMahasiswa, {
                foreignKey: "siak_komposisi_nilai_id",
                as: "daftarNilai"
            });
            
            this.belongsTo(models.MataKuliah, {
                foreignKey: 'siak_mata_kuliah_id',
                as: 'mataKuliah'
            });
        }
    }

    KomposisiNilaiMataKuliah.init({
        id: { type: DataTypes.UUID, primaryKey: true, defaultValue: uuid7 },
        siakMataKuliahId: { type: DataTypes.UUID, field: 'siak_mata_kuliah_id' },
        // FIX: Sesuai struktur database, kolomnya bernama 'key'
        key: { type: DataTypes.STRING, field: 'key' }, 
        persentase: { type: DataTypes.DECIMAL(5, 2) }
    }, {
        sequelize, 
        underscored: true, 
        timestamps: true, 
        paranoid: true,
        modelName: "KomposisiNilaiMataKuliah", 
        tableName: "siak_komposisi_nilai_mata_kuliah"
    });
    return KomposisiNilaiMataKuliah;
}