// import { Model, DataTypes } from 'sequelize';
// import { v7 as uuid7 } from 'uuid';

// export default (sequelize) => {
//     class PemetaanCplMk extends Model {
//         static associate(models) {
//             this.belongsTo(models.CapaianPembelajaranLulusan, {
//                 foreignKey: "siak_cpl_id",
//                 as: "cpl"
//             });
//             this.belongsTo(models.MataKuliah, {
//                 foreignKey: "siak_mata_kuliah_id",
//                 as: "mataKuliah"
//             });
//         }
//     }

//     PemetaanCplMk.init({
//         id: {
//             type: DataTypes.UUID,
//             primaryKey: true,
//             defaultValue: uuid7
//         },
//         siakCplId: {
//             type: DataTypes.UUID,
//             field: "siak_cpl_id",
//         },
//         siakMataKuliahId: {
//             type: DataTypes.UUID,
//             field: "siak_mata_kuliah_id",
//         },
//     }, {
//         sequelize,
//         underscored: true,
//         timestamps: true,
//         modelName: "PemetaanCplMk",
//         tableName: "siak_pemetaan_cpl_mk"
//     });

//     return PemetaanCplMk;
// }
import { Model, DataTypes } from 'sequelize';
import { v7 as uuid7 } from 'uuid';

export default (sequelize) => {
    class PemetaanCplMk extends Model {
        static associate(models) {
            this.belongsTo(models.CapaianPembelajaranLulusan, {
                foreignKey: "siak_capaian_pembelajaran_lulusan_id",
                as: "cpl"
            });
            this.belongsTo(models.MataKuliah, {
                foreignKey: "siak_mata_kuliah_id",
                as: "mataKuliah"
            });
        }
    }

    PemetaanCplMk.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: uuid7
        },
        siakMataKuliahId: {
            type: DataTypes.UUID,
            field: "siak_mata_kuliah_id",
        },
        siakCplId: {
            type: DataTypes.UUID,
            field: "siak_capaian_pembelajaran_lulusan_id",
        },
    }, {
        sequelize,
        underscored: true,
        timestamps: true,
        paranoid: true, // Pastikan sudah ada kolom deleted_at di DB
        modelName: "PemetaanCplMk",
        tableName: "siak_pemetaan_cpl_mata_kuliah"
    });

    return PemetaanCplMk;
}