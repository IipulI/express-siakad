// /models/fakultas.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Obe extends Model {
        static associate(models) {
            this.belongsTo(models.ProgramStudi, {
                foreignKey: "siak_program_studi_id",
                as: "programStudi",
            });

            this.belongsTo(models.TahunKurikulum, {
                foreignKey: "siak_tahun_kurikulum_id",
                as: "tahunKurikulum"
            });
            this.hasMany(models.ProfilLulusan, { 
    foreignKey: 'siak_obe_id', 
    as: 'profilLulusan' 
});
        // 👇 TAMBAHKAN RELASI KE CPL DI SINI 👇
            this.hasMany(models.CapaianPembelajaranLulusan, { 
                foreignKey: 'siak_obe_id', 
                as: 'capaianPembelajaranLulusan' // Alias ini WAJIB sama dengan yang di Service
            });
        }
    }

    Obe.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakProgramStudiId: {
                type: DataTypes.UUID,
                field: 'siak_program_studi_id'
            },
            siakTahunKurikulumId: {
                type: DataTypes.UUID,
                field: 'siak_tahun_kurikulum_id'
            },
//             targetCapaian: {
//     type: DataTypes.DOUBLE,
//     field: 'target_capaian',
//     defaultValue: 0
// },
targetCpl: {
    type: DataTypes.DOUBLE,
    field: 'target_cpl', // Pastikan sama dengan nama kolom di database hasil migration tadi
    defaultValue: 0
},
targetCpmk: {
    type: DataTypes.DOUBLE,
    field: 'target_cpmk',
    defaultValue: 0
}
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "Obe",
            tableName: "siak_obe",
        }
    );

    return Obe
}
