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
            
            
           MataKuliah.hasMany(models.KomposisiNilaiMataKuliah, { // Sesuaikan nama model ini
    foreignKey: 'siak_mata_kuliah_id',
    as: 'komposisiNilai'
  });
  // Pengembang RPS jadi Many-to-Many pakai tabel pivot
// 1. Relasi Koordinator (1-to-1)
    this.belongsTo(models.Dosen, { 
        foreignKey: 'koordinator_mk_id',
        as: 'koordinatorMk'
    });

 this.belongsToMany(models.Dosen, {
        through: models.PengembanganRps,
        foreignKey: 'siakMataKuliahId', // <-- UBAH JADI camelCase
        otherKey: 'siakDosenId',        // <-- UBAH JADI camelCase
        as: 'pengembangRps' 
    });
    // 3. Relasi Pengajar Mata Kuliah (Many-to-Many)
    this.belongsToMany(models.Dosen, {
        through: 'siak_pengajar_mata_kuliah',
        foreignKey: 'siak_mata_kuliah_id',
        otherKey: 'siak_dosen_id',
        as: 'pengajarMataKuliah'
    });
    // Relasi Pemetaan CPL


    // Relasi Pemetaan CPL
    this.belongsToMany(models.CapaianPembelajaranLulusan, {
        through: models.PemetaanCplMk,
        foreignKey: 'siakMataKuliahId', // <-- UBAH KE CAMEL CASE
        otherKey: 'siakCplId',          // <-- UBAH KE CAMEL CASE
        as: 'cplDipetakan' 
    });
    this.hasMany(models.CapaianMataKuliah, {
        foreignKey: 'siak_mata_kuliah_id',
        as: 'cpmk' // Alias ini yang kita panggil di Service
    });
    this.hasMany(models.RencanaPembelajaran, { 
    foreignKey: "siak_mata_kuliah_id", 
    as: "rencanaPembelajaran" 
});
    this.belongsTo(models.KelompokMataKuliah, {
    foreignKey: 'siak_kelompok_mata_kuliah_id',
    as: 'kelompokMk'
});


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

            namaEn: {
                type: DataTypes.STRING,
                field: "nama_en",
                allowNull: true
            },
            siakKelompokMataKuliahId: {
                type: DataTypes.UUID,
                field: "siak_kelompok_mata_kuliah_id",
                allowNull: true
            },
            siakRumpunMataKuliahId: {
                type: DataTypes.UUID,
                field: "siak_rumpun_mata_kuliah_id",
                allowNull: true
            },
            sksSimulasi: {
                type: DataTypes.INTEGER,
                field: 'sks_simulasi',
                allowNull: true,
                defaultValue: 0
            },
            merupakanMku: {
                type: DataTypes.BOOLEAN,
                field: 'merupakan_mku',
                allowNull: true,
                defaultValue: false
            },
            adaSap: {
                type: DataTypes.BOOLEAN,
                field: 'ada_sap',
                allowNull: true,
                defaultValue: false
            },
            adaSilabus: {
                type: DataTypes.BOOLEAN,
                field: 'ada_silabus',
                allowNull: true,
                defaultValue: false
            },
            adaBahanAjar: {
                type: DataTypes.BOOLEAN,
                field: 'ada_bahan_ajar',
                allowNull: true,
                defaultValue: false
            },
            adaDiktat: {
                type: DataTypes.BOOLEAN,
                field: 'ada_diktat',
                allowNull: true,
                defaultValue: false
            },
            // Di dalam blok init MataKuliah.init({ ... })
sksTatapMuka: { type: DataTypes.INTEGER, field: 'sks_tatap_muka' },
sksPraktikum: { type: DataTypes.INTEGER, field: 'sks_praktikum' },
sksPraktikLapangan: { type: DataTypes.INTEGER, field: 'sks_praktik_lapangan' },
sksSimulasi: { type: DataTypes.INTEGER, field: 'sks_simulasi' },
koordinatorMkId: { type: DataTypes.UUID, field: 'koordinator_mk_id' },
pengembangRpsId: { type: DataTypes.UUID, field: 'pengembang_rps_id' },
// ... (kolom-kolom mata kuliah yang sudah ada sebelumnya) ...

        // 2 KOLOM BARU UNTUK PENGATURAN CPMK 👇
        levelPemetaan: {
            type: DataTypes.STRING,
            field: 'level_pemetaan' // Ini yang memberi tahu Sequelize nama asli di DB-nya
        },
        metodePembobotan: {
            type: DataTypes.STRING,
            field: 'metode_pembobotan'
        }
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