// /models/mahasiswa.models.js
import {Model, DataTypes, UUID} from "sequelize";
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

            this.hasMany(models.HasilStudi, {
                foreignKey: 'siak_mahasiswa_id',
                as: 'hasilStudi'
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

            // Info Mahasiswa
            nama: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            npm: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            // TODO : konsenterasi
            // siakKonsentrasiId: {
            //     type: DataTypes.UUID,
            //     fields: "siak_konsentrasi_id"
            // },
            siakProgramStudiId: {
                type: DataTypes.UUID,
                fields: "siak_program_studi_id"
            },
            // TODO : konsenterasi
            // siakKonsentrasiId: {
            //     type: DataTypes.UUID,
            //     fields: "siak_konsentrasi_id"
            // },
            periodeMasuk: {
                type: DataTypes.STRING,
                field: "periode_masuk"
            },
            // TODO : tahun kurikulum
            // siakTahunKurikulumId: {
            //     type: DataTypes.UUID,
            //     field: "siak_tahun_kurikulum_id"
            // },
            siakSistemKuliahId: {
                type: DataTypes.UUID,
                field: "siak_sistem_kuliah_id"
            },
            siakJenisPendaftaranId: {
                type: DataTypes.UUID,
                field: "siak_jenis_pendaftaran_id"
            },
            gelombang: {
                type: DataTypes.STRING,
            },
            // TODO : Tanggal daftar ulang dan masuk
            // tanggalDaftarUlang: {
            //     type: DataTypes.DATEONLY,
            //     field: "tanggal_daftar_ulang"
            // },
            // tanggalAwalMasuk: {
            //     type: DataTypes.DATEONLY,
            //     field: "tanggal_awal_masuk"
            // },
            // TODO : Tanggal daftar ulang dan masuk
            // tanggalDaftarUlang: {
            //     type: DataTypes.DATEONLY,
            //     field: "tanggal_daftar_ulang"
            // },
            // tanggalAwalMasuk: {
            //     type: DataTypes.DATEONLY,
            //     field: "tanggal_awal_masuk"
            // },
            kebutuhanKhusus: {
                type: DataTypes.BOOLEAN,
                field: "kebutuhan_khusus"
            },
            siakStatusMahasiswaId: {
                type: UUID,
                field: "siak_status_mahasiswa_id"
            },
            // TODO : Kolom status hapus nantinya
            status: {
                type: DataTypes.STRING,
            },
            biodataValid: {
                type: DataTypes.BOOLEAN,
                field: "biodata_valid"
            },

            angkatan: {
                type: DataTypes.STRING,
            },
            semester: {
                type: DataTypes.INTEGER
            },
            periodeKeluar: {
                type: DataTypes.STRING,
                field: "periode_keluar"
            },

            // --- Informasi Umum ---
            // Umum
            siakAgamaId: {
                type: UUID,
                field: "siak_agama_id"
            },
            siakSukuId: {
                type: UUID,
                field: "siak_suku_id"
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
            siakTransportasiId: {
                type: DataTypes.UUID,
                field: "siak_transportasi_id"
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
            noKk: {
                type: DataTypes.STRING,
                field: "no_kk"
            },
            // TODO : no_kps
            // noKps: {
            //     type: DataTypes.STRING,
            //     field: "no_kps"
            // },
            nik: {
                type: DataTypes.STRING,
            },
            statusNikah: {
                type: DataTypes.STRING,
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