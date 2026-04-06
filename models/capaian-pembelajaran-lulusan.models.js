// // /models/fakultas.models.js
// import { Model, DataTypes } from "sequelize";
// import { v7 as uuid7 } from "uuid";

// export default (sequelize) => {
//     class CapaianPembelajaranLulusan extends Model {
//         static associate(models) {
//             this.hasMany(models.PemetaanPlCpl, {
//                 foreignKey: "siak_capaian_pembelajaran_lulusan_id",
//                 as: "pemetaanPlCpl"
//             });
//             this.belongsToMany(models.CapaianMataKuliah, {
//                 through: models.PemetaanCplCpmk,
//                 foreignKey: 'siakCapaianPembelajaranLulusanId', // <-- Wajib camelCase
//                 otherKey: 'siakCapaianMataKuliahId',            // <-- Wajib camelCase
//                 as: 'cpmkPemeta'
//             });
    

//     // Relasi balik ke Mata Kuliah
//     this.belongsToMany(models.MataKuliah, {
//         through: models.PemetaanCplMk,
//         foreignKey: 'siakCplId',        // <-- UBAH KE CAMEL CASE
//         otherKey: 'siakMataKuliahId',   // <-- UBAH KE CAMEL CASE
//         as: 'mataKuliahPemeta'
//     });
//         }
//     }

//     CapaianPembelajaranLulusan.init(
//         {
//             id: {
//                 type: DataTypes.UUID,
//                 primaryKey: true,
//                 defaultValue: uuid7,
//             },
//             siakObeId: {
//                 type: DataTypes.UUID,
//                 field: 'siak_obe_id'
//             },
//             kode: {
//                 type: DataTypes.STRING
//             },
//             deskripsi: {
//                 type: DataTypes.TEXT
//             },
//             kategori: {
//                 type: DataTypes.STRING
//             }
//         },
//         {
//             sequelize,
//             underscored: true,
//             timestamps: true,
//             paranoid: true,

//             modelName: "CapaianPembelajaranLulusan",
//             tableName: "siak_capaian_pembelajaran_lulusan",
//         }
//     );

//     return CapaianPembelajaranLulusan
// }
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class CapaianPembelajaranLulusan extends Model {
        static associate(models) {
            // 👇 TAMBAHKAN INI: Relasi balik ke OBE (WAJIB) 👇
            this.belongsTo(models.Obe, {
                foreignKey: 'siak_obe_id',
                as: 'obe'
            });

            // Relasi Pemetaan PL ke CPL
            this.hasMany(models.PemetaanPlCpl, {
                foreignKey: "siak_capaian_pembelajaran_lulusan_id",
                as: "pemetaanPlCpl"
            });

            // Relasi Many-to-Many ke CPMK
            this.belongsToMany(models.CapaianMataKuliah, {
                through: models.PemetaanCplCpmk,
                foreignKey: 'siak_capaian_pembelajaran_lulusan_id', // Pakai nama kolom DB (snake_case)
                otherKey: 'siak_capaian_mata_kuliah_id',
                as: 'cpmkPemeta'
            });

            // Relasi Many-to-Many ke Mata Kuliah
            this.belongsToMany(models.MataKuliah, {
                through: models.PemetaanCplMk,
                foreignKey: 'siak_capaian_pembelajaran_lulusan_id', 
                otherKey: 'siak_mata_kuliah_id',
                as: 'mataKuliahPemeta'
            });
        }
    }

    CapaianPembelajaranLulusan.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakObeId: {
                type: DataTypes.UUID,
                field: 'siak_obe_id'
            },
            kode: {
                type: DataTypes.STRING
            },
            deskripsi: {
                type: DataTypes.TEXT
            },
            // 👇 UBAH BAGIAN INI 👇
            deskripsiEn: { 
                type: DataTypes.TEXT,
                field: 'deskripsi_en' // Ini ngasih tau Sequelize nama asli di DB-nya
            },
            targetCpl: {
                type: DataTypes.FLOAT, // Bisa pakai FLOAT untuk nyimpan desimal seperti 85.50
                field: 'target_cpl'
            },
            kategori: {
                type: DataTypes.STRING
            }
        },
        {
            sequelize,
            underscored: true, // Karena ini TRUE, Sequelize otomatis cari siak_cpl_id dsb.
            timestamps: true,
            paranoid: true,
            modelName: "CapaianPembelajaranLulusan",
            tableName: "siak_capaian_pembelajaran_lulusan",
        }
    );

    return CapaianPembelajaranLulusan;
}