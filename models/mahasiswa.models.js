// /models/mahasiswa.models.js
import { Model, DataTypes } from "sequelize";
import { v7 as uuid7 } from "uuid";

export default (sequelize) => {
    class Mahasiswa extends Model {
        static associate(models) {
            this.belongsTo(models.ProgramStudi, {
                foreignKey: 'siak_program_studi_id',
                as: 'programStudi'
            })

            this.hasMany(models.KrsMahasiswa, {
                foreignKey: 'siak_mahasiswa_id',
                as: 'krsMahasiswa',
            })

            this.hasOne(models.KrsMahasiswa, {
                foreignKey: 'siak_mahasiswa_id',
                as: 'krsTerbaru',
                order: [
                    ['semester', 'DESC']
                ]
            })

            this.hasOne(models.PembimbingAkademik, {
                as: "pembimbingDosen",
                foreignKey: 'siak_mahasiswa_id',
            })

            this.hasOne(models.HasilStudi, {
                foreignKey: 'siak_mahasiswa_id',
                as: "hasilStudiTerbaru",
                order: [
                    ['semester', 'DESC']
                ]
            })
        }
    }

    Mahasiswa.init(
        {
            id: {
                type: DataTypes.UUID,
                primaryKey: true,
                defaultValue: uuid7,
            },
            siakProgramStudiId: {
                type: DataTypes.UUID,
                field: "siak_program_studi_id" // Typo 'fields' sudah diperbaiki
            },

            // Info Mahasiswa
            nama: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            npm: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            angkatan: {
                type: DataTypes.STRING,
            },
            semester: {
                type: DataTypes.INTEGER
            },
            periodeMasuk: {
                type: DataTypes.STRING,
                field: "periode_masuk"
            },
            periodeKeluar: {
                type: DataTypes.STRING,
                field: "periode_keluar"
            },
            kebutuhanKhusus: {
                type: DataTypes.BOOLEAN,
                field: "kebutuhan_khusus"
            },
            status: {
                type: DataTypes.STRING,
            },

            // Umum
            biodataValid: {
                type: DataTypes.BOOLEAN,
                field: "biodata_valid"
            },
            jenisKelamin: {
                type: DataTypes.STRING,
                field: "jenis_kelamin"
            },
            tempatLahir: {
                type: DataTypes.STRING,
                field: "tempat_lahir"
            },
            tanggalLahir: {
                type: DataTypes.DATEONLY,
                field: "tanggal_lahir"
            },
            beratBadan: {
                type: DataTypes.INTEGER,
                field: "berat_badan"
            },
            tinggiBadan: {
                type: DataTypes.INTEGER,
                field: "tinggi_badan"
            },
            golonganDarah: {
                type: DataTypes.STRING,
                field: "golongan_darah"
            },

            // Kontak
            noTelepon : {
                type: DataTypes.STRING,
                field: "no_telepon"
            },
            noWhatsapp : {
                type: DataTypes.STRING,
                field: "no_whatsapp"
            },
            emailPribadi : {
                type: DataTypes.STRING,
                field: "email_pribadi"
            },
            emailKampus : {
                type: DataTypes.STRING,
                field: "email_kampus"
            },
            // Kewarganegaraan
            kewarganegaraan: {
                type: DataTypes.STRING, // SUDAH DITAMBAHKAN
            },
            paspor: {
                type: DataTypes.STRING,
            },
            no_kk: {
                type: DataTypes.STRING,
                field: "no_kk"
            },
            nik: {
                type: DataTypes.STRING,
            },
            status_nikah: {
                type: DataTypes.STRING, // SUDAH DITAMBAHKAN
                field: "status_nikah"
            },



        },
        {
            sequelize,
            underscored: true,
            timestamps: true,
            paranoid: true,

            modelName: "Mahasiswa",
            tableName: "siak_mahasiswa",
        }
    );

    return Mahasiswa;
}