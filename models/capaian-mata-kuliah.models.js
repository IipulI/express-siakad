// // /models/fakultas.models.js
// import { Model, DataTypes } from "sequelize";
// import { v7 as uuid7 } from "uuid";

// export default (sequelize) => {
//  class CapaianMataKuliah extends Model {
//         static associate(models) {
//             // Relasi ke Master CPL (Many-to-Many via tabel pivot siak_pemetaan_cpl_cpmk)
//             this.belongsToMany(models.CapaianPembelajaranLulusan, {
//                 through: models.PemetaanCplCpmk,
//                 foreignKey: 'siakCapaianMataKuliahId',       // <-- Wajib camelCase
//                 otherKey: 'siakCapaianPembelajaranLulusanId',// <-- Wajib camelCase
//                 as: 'cplDiCPMK'                              // <-- Alias ini yang dipakai di Service
//             });
//         }
//     }

//     CapaianMataKuliah.init(
//         {
//             id: {
//                 type: DataTypes.UUID,
//                 primaryKey: true,
//                 defaultValue: uuid7,
//             },
//             siakObeId: {
//                 type: DataTypes.UUID,
//                 field: "siak_obe_id",
//                 allowNull: true,
//             },
//             siakMataKuliahId: {
//                 type: DataTypes.UUID,
//                 field: "siak_mata_kuliah_id",
//                 allowNull: false,
//             },
//             kode: {
//                 type: DataTypes.STRING,
//             },
//             deskripsi: {
//                 type: DataTypes.TEXT,
//             }
//         },
//         {
//             sequelize,
//             underscored: true,
//             timestamps: true,
//             paranoid: true,

//             modelName: "CapaianMataKuliah",
//             tableName: "siak_capaian_mata_kuliah",
//         }
//     );

//     return CapaianMataKuliah
// }
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class CapaianMataKuliah extends Model {
        static associate(models) {
           
            if (this._sudahDiRelasikan) return;
            this._sudahDiRelasikan = true; 

            // Relasi ke Master CPL
            this.belongsToMany(models.CapaianPembelajaranLulusan, {
                through: models.PemetaanCplCpmk,
                foreignKey: 'siakCapaianMataKuliahId',       
                otherKey: 'siakCapaianPembelajaranLulusanId',
                as: 'cplDiCPMK'                              
            });
        }
    }

    CapaianMataKuliah.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakObeId: {
                type: DataTypes.UUID,
                field: "siak_obe_id",
                allowNull: true,
            },
            siakMataKuliahId: {
                type: DataTypes.UUID,
                field: "siak_mata_kuliah_id",
                allowNull: false,
            },
            kode: {
                type: DataTypes.STRING,
            },
            deskripsi: {
                type: DataTypes.TEXT,
            }
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,
            modelName: "CapaianMataKuliah",
            tableName: "siak_capaian_mata_kuliah",
        }
    );

    return CapaianMataKuliah;
}