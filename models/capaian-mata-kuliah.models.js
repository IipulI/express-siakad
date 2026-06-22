import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class CapaianMataKuliah extends Model {
        // static associate(models) {
           
        //     if (this._sudahDiRelasikan) return;
        //     this._sudahDiRelasikan = true; 

        //     // Relasi ke Master CPL
        //     this.belongsToMany(models.CapaianPembelajaranLulusan, {
        //         through: models.PemetaanCplCpmk,
        //         foreignKey: 'siakCapaianMataKuliahId',       
        //         otherKey: 'siakCapaianPembelajaranLulusanId',
        //         as: 'cplDiCPMK'                              
        //     });
        // }
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
            },
            // 👇 INI DIA TERSANGKA UTAMANYA, SUDAH SAYA TAMBAHKAN 👇
            target: {
                type: DataTypes.DOUBLE,
                allowNull: true,
                defaultValue: 0
            },
            bobot: {
                type: DataTypes.DOUBLE,
                allowNull: true,
                defaultValue: 0
            },
            parentId: {
                type: DataTypes.UUID,
                field: "parent_id", // Nama kolom fisik di DB
                allowNull: true,
            },
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