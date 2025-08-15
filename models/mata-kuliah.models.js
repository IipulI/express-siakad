// /models/mata-kuliah.models.js
import { Model, DataTypes } from 'sequelize';
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class MataKuliah extends Model {
        static associate(models) {
            this.belongsTo(models.TahunKurikulum, {
                foreignKey: 'siak_tahun_kurikulum_id',
                as: 'tahunKurikulum',
            })

            this.belongsTo(models.ProgramStudi, {
                foreignKey: 'siak_program_studi_id',
                as: 'programStudi',
            })

            this.hasMany(models.KelasKuliah, {
                foreignKey: 'siak_mata_kuliah_id',
                as: "kelasKuliah"
            })

            this.belongsTo(models.MataKuliah, {
                foreignKey: "prasyarat_mata_kuliah_1",
                as: "prasyarat1"
            })

            this.belongsTo(models.MataKuliah, {
                foreignKey: "prasyarat_mata_kuliah_2",
                as: "prasyarat2"
            })

            this.belongsTo(models.MataKuliah, {
                foreignKey: "prasyarat_mata_kuliah_3",
                as: "prasyarat3"
            })

        }
    }

    MataKuliah.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7
            },
            siakProgramStudiId: {
                type: DataTypes.UUID,
                field: "siak_program_studi_id"
            },
            siakTahunKurikulumId: {
                type: DataTypes.UUID,
                field: "siak_tahun_kurikulum_id"
            },
            nama: {
                allowNull: false,
                type: DataTypes.STRING
            },
            kode: {
                allowNull: false,
                type: DataTypes.STRING
            },
            jenis: {
                allowNull: false,
                type: DataTypes.STRING
            },
            semester: {
                allowNull: true,
                type: DataTypes.INTEGER
            },
            nilaiMin: {
                allowNull: true,
                field : "nilai_min",
                type: DataTypes.STRING(5)
            },
            adaPraktikum: {
                allowNull: false,
                field: "ada_praktikum",
                type: DataTypes.BOOLEAN
            },
            opsiWajib: {
                allowNull: true,
                field: "opsi_wajib",
                type: DataTypes.BOOLEAN
            },
            sksTatapMuka: {
                allowNull: true,
                type: DataTypes.INTEGER,
                field: 'sks_tatap_muka',
            },
            sksPraktikum: {
                allowNull: true,
                type: DataTypes.INTEGER,
                field: 'sks_praktikum',
            },
            sksPraktikLapangan: {
                allowNull: true,
                type: DataTypes.INTEGER,
                field: 'sks_praktik_lapangan',
            },
            totalSks:{
                allowNull: true,
                type: DataTypes.INTEGER,
                field: 'total_sks',
            },
            prasyaratMataKuliah1: {
                allowNull: true,
                type: DataTypes.UUID,
                field: "prasyarat_mata_kuliah_1"
            },
            prasyaratMataKuliah2: {
                allowNull: true,
                type: DataTypes.UUID,
                field: "prasyarat_mata_kuliah_2"
            },
            prasyaratMataKuliah3: {
                allowNull: true,
                type: DataTypes.UUID,
                field: "prasyarat_mata_kuliah_3"
            },
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: 'MataKuliah',
            tableName: 'siak_mata_kuliah'
        }
    );

    return MataKuliah;
}