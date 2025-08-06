// /models/tahunajaran.models.js
import { Model, DataTypes } from 'sequelize';
import { sequelize } from "../config/database.js";
import { v7 as uuid7 } from "uuid";

class MataKuliah extends Model {

}

MataKuliah.init(
    {
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: uuid7
        },
        siak_program_studi_id: {},
        siak_tahun_kurikulum_id: {},

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
        sksTatap: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        sks_praktikum: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        sks_praktik_lapangan: {
            allowNull: true,
            type: DataTypes.INTEGER
        },
        total_sks:{
            allowNull: true,
            type: DataTypes.INTEGER
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
)

export default MataKuliah;