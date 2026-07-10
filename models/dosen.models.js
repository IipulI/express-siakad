// /models/dosen.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Dosen extends Model {
        static associate(models) {
            this.belongsToMany(models.Mahasiswa, {
                through: models.PembimbingAkademik,
                foreignKey: 'siak_dosen_id',
                otherKey: 'siak_mahasiswa_id'
            });
            // 1. Dosen sebagai Koordinator MK (1 Dosen bisa jadi koordinator banyak MK)
            this.hasMany(models.MataKuliah, {
                foreignKey: 'koordinator_mk_id', // Pastikan sesuai dengan nama kolom (underscored) di DB
                as: 'koordinatorMataKuliah'
            });

             this.belongsToMany(models.MataKuliah, {
                through: models.PengembanganRps,
                foreignKey: 'siakDosenId',      // <-- UBAH JADI camelCase
                otherKey: 'siakMataKuliahId',   // <-- UBAH JADI camelCase
                as: 'rpsDikembangkan'
            });

            this.belongsToMany(models.MataKuliah, {
                through: 'siak_pengajar_mata_kuliah', // Harus sama dengan yang di atas
                foreignKey: 'siak_dosen_id',
                otherKey: 'siak_mata_kuliah_id',
                as: 'mataKuliahDiajar'
            });

            this.hasOne(models.ProgramStudi, {
                foreignKey: 'kaprodi_id', // Harus sama dengan yang di atas
                as: 'kepalaProdi'
            });
        }
    }
    Dosen.init({
        id: {
            type: DataTypes.UUID,
            primaryKey: true,
            defaultValue: uuid7,
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
    }, {
        sequelize,
        underscored: true,
        timestamps: true,
        paranoid: true,

        modelName: "Dosen",
        tableName: "siak_dosen",
    });
    return Dosen;
};