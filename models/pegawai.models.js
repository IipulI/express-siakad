// /models/tahunajaran.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Pegawai extends Model {
        static associate(models) {}
    }

    Pegawai.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakUserId: {
                type: DataTypes.UUID,
                field: "siak_user_id",
            },
            nama: {
                type: DataTypes.STRING(75),
                allowNull: false,
            },
            nidn: {
                type: DataTypes.STRING(25),
                allowNull: true,
            },
            nip: {
                type: DataTypes.STRING(25),
                allowNull: true,
            },
            nuptk: {
                type: DataTypes.STRING
            },
            gelarDepan: {
                field: 'gelar_depan',
                type: DataTypes.STRING
            },
            gelarBelakang: {
                field: 'gelar_belakang',
                type: DataTypes.STRING
            },
            jenisKelamin: {
                field: 'jenis_kelamin',
                type: DataTypes.STRING
            },
            emailPegawai: {
                field: 'email_pegawai',
                type: DataTypes.STRING
            },
            jabatanFungsional: {
                field: 'jabatan_fungsional',
                type: DataTypes.STRING
            },
            jabatanStruktural: {
                field: 'jabatan_struktural',
                type: DataTypes.STRING
            },
            pangkat: {
                type: DataTypes.STRING
            },
            eselon: {
                type: DataTypes.STRING
            },
            statusAktif: {
                field: 'status_aktif',
                type: DataTypes.STRING
            },
            simpegMId: {
                field: 'simpeg_m_id',
                type: DataTypes.UUID,
                allowNull: true,
            },
            unitKerjaId: {
                field: 'unit_kerja_id',
                type: DataTypes.UUID,
                allowNull: true,
            }
        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "Pegawai",
            tableName: "siak_pegawai",
        }
    );

    return Pegawai;
};
