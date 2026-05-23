// /models/unsur-nilai.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class KomposisiNilaiMataKuliah extends Model {
        // static associate(models) {
        //     this.belongsTo(models.TahunKurikulum, {
        //         foreignKey: "siak_tahun_kurikulum_id",
        //         as: "tahunKurikulum"
        //     })

        //     this.belongsTo(models.MataKuliah, {
        //         foreignKey: "siak_mata_kuliah_id",
        //         as: "mataKuliah"
        //     })

        //     this.belongsTo(models.UnsurNilai, {
        //         foreignKey: "siak_unsur_nilai_id",
        //         as: "unsurNilai"
        //     })

        //     this.belongsToMany(models.CapaianMataKuliah, {
        //         through: models.PemetaanKomposisiCpmk,
        //         foreignKey: "siak_komposisi_nilai_id",
        //         otherKey: "siak_cpmk_id",
        //         as: "cpmkList"
        //     })
        // }
        static associate(models) {
        this.belongsTo(models.TahunKurikulum, {
            foreignKey: "siakTahunKurikulumId", 
            as: "tahunKurikulum"
        })

        this.belongsTo(models.MataKuliah, {
            foreignKey: "siakMataKuliahId",    
            as: "mataKuliah"
        })

        this.belongsTo(models.UnsurNilai, {
            foreignKey: "siakUnsurNilaiId",     
            as: "unsurNilai"
        })

        this.belongsToMany(models.CapaianMataKuliah, {
            through: models.PemetaanKomposisiCpmk,
            foreignKey: "siakKomposisiNilaiId", 
            otherKey: "siakCpmkId",             
            as: "cpmkList"
        })
    }
    }

    KomposisiNilaiMataKuliah.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakTahunKurikulumId: {
                type: DataTypes.UUID,
                field: "siak_tahun_kurikulum_id"
            },
            siakMataKuliahId : {
                type: DataTypes.UUID,
                field: "siak_mata_kuliah_id",
            },
            siakUnsurNilaiId: {
                type: DataTypes.UUID,
                field: "siak_unsur_nilai_id",
            },
            persentase: {
                type: DataTypes.DOUBLE(5,2)
            },
            key: {
                type: DataTypes.STRING,
            }
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "KomposisiNilaiMataKuliah",
            tableName: "siak_komposisi_nilai_mata_kuliah",
        }
    );

    return KomposisiNilaiMataKuliah;
};
