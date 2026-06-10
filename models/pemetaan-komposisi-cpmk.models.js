import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class PemetaanKomposisiCpmk extends Model {
        static associate(models) {
            this.belongsTo(models.KomposisiNilaiMataKuliah, {
                foreignKey: "siak_komposisi_nilai_id",
                as: "komposisiNilai"
            });
            
            this.belongsTo(models.CapaianMataKuliah, {
                foreignKey: 'siak_cpmk_id', 
                as: 'capaianMataKuliah'
            });
        }
    }

    PemetaanKomposisiCpmk.init({
        id: { 
            type: DataTypes.UUID, 
            primaryKey: true, 
            defaultValue: uuid7 
        },
        siakKomposisiNilaiId: { 
            type: DataTypes.UUID, 
            field: "siak_komposisi_nilai_id",
            allowNull: false 
        },
        siakCpmkId: {
            type: DataTypes.UUID,
            field: 'siak_cpmk_id',
            allowNull: false,
        },
        bobot: {
            type: DataTypes.FLOAT,
            allowNull: true,
            defaultValue: 0
        }
    }, {
        sequelize, 
        underscored: true, 
        timestamps: true, 
        paranoid: true,
        modelName: "PemetaanKomposisiCpmk", 
        tableName: "siak_pemetaan_komposisi_cpmk"
    });

    return PemetaanKomposisiCpmk;
};
