import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcrypt';
import db from '../models/index.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const studentRawData = [
  { npm: "221106042843", nama: "MUHAMMAD IHSAN", email: "muhammadihsanf270@gmail.com", ortu: "UCIH SUKAESIH" },
  { npm: "221106043023", nama: "Muhamad Virzha Andriansyah", email: "muhamadvirzhaa@gmail.com", ortu: "HENI NOVIANTI" },
  { npm: "221106042963", nama: "Satrio Teguh Hutomo", email: "satrioteguhhutomo@gmail.com", ortu: "Teguh" },
  { npm: "221106042881", nama: "Muhammad Irgi Fajri", email: "muhammad.irgi.fajri@gmail.com", ortu: "Ratna Sari" },
  { npm: "221106043019", nama: "Azka Fadilah Rahman", email: "azkanyan@gmail.com", ortu: "Siti Karimah" },
  { npm: "221106042851", nama: "Maraginda", email: "maragindapanggabean35@gmail.com", ortu: "Nislan" },
  { npm: "221106042991", nama: "Rindu Astuti", email: "rinduasst@gmail.com", ortu: "Ortu Rindu" },
  { npm: "221106042855", nama: "Anastia Firyal Nisrina", email: "anastianisrina06@gmail.com", ortu: "Ana Kusmiyan" },
  { npm: "221106042869", nama: "Annisa Salsabila Cahyani", email: "jonisa62@gmail.com", ortu: "Nurhafni Matondang" },
  { npm: "221106042895", nama: "Achmad Fauzan Hasan", email: "zands2076@gmail.com", ortu: "Ortu Fauzan" },
  { npm: "221106043033", nama: "Muhammad Syaifullah Nurrohman", email: "syaifullah.nurrahman@gmail.com", ortu: "Ortu Syaifullah" },
  { npm: "231106040973", nama: "Ikhwal Awaludin", email: "idnovyra@gmail.com", ortu: "Ortu Ikhwal" },
  { npm: "231106040904", nama: "Riandi Siddik Harahap", email: "riccikaofficial@gmail.com", ortu: "Ortu Siddik" },
  { npm: "221106042931", nama: "Muhammad Ridwan", email: "mhmdy5p0317@gmail.com", ortu: "Reni Anggraeni" },
  { npm: "221106042947", nama: "Mohamad Ridwan", email: "muh.yusup965@gmail.com", ortu: "Ortu Ridwan" },
  { npm: "221106042937", nama: "Kintan Novia Azzahra", email: "ahdaf0317@gmail.com", ortu: "Susita" }
];

const mataKuliahData = [
  { kode: "TIF101", nama: "Pengantar Teknik Informatika", semester: 1, sks: 2 },
  { kode: "TIF103", nama: "Matematika Diskrit", semester: 1, sks: 2 },
  { kode: "TIF105", nama: "Kecakapan Intrapersonal", semester: 1, sks: 2 },
  { kode: "TIF191", nama: "Kalkulus I", semester: 1, sks: 2 },
  { kode: "TIF193", nama: "Teknik Digital dan Rangkaian Logika + Praktik", semester: 1, sks: 3 },
  { kode: "IHK110", nama: "Pancasila", semester: 1, sks: 2 },
  { kode: "PAI111", nama: "Studi Islam I", semester: 1, sks: 2 },
  { kode: "PBI106X", nama: "Bahasa Indonesia", semester: 1, sks: 2 },
  { kode: "UIK114X", nama: "Aqidah", semester: 1, sks: 2 },
  { kode: "IHK175", nama: "Kewarganegaraan", semester: 2, sks: 2 },
  { kode: "PAI112XXX", nama: "Syariah", semester: 2, sks: 2 },
  { kode: "TIF102", nama: "Kalkulus II", semester: 2, sks: 2 },
  { kode: "TIF104", nama: "Aljabar Linear", semester: 2, sks: 2 },
  { kode: "TIF106", nama: "Struktur Data dan Algoritma + Praktikum", semester: 2, sks: 3 },
  { kode: "TIF112", nama: "Organisasi Komputer dan Sistem Operasi + Praktikum", semester: 2, sks: 2 },
  { kode: "TIF194", nama: "Statistika dan Probabilitas", semester: 2, sks: 2 },
  { kode: "TIF251", nama: "Sistem Informasi + Praktikum", semester: 2, sks: 3 }
];

async function generate() {
    try {
        console.log('Generating dummy insert SQL...');
        const salt = bcrypt.genSaltSync(10);
        const hashedPassword = bcrypt.hashSync("password123", salt);

        const sqlLines = [];
        sqlLines.push('-- ==============================================================');
        sqlLines.push('-- SQL DUMMY INSERT SCRIPT FOR SIAKAD DATABASE');
        sqlLines.push('-- ==============================================================');
        sqlLines.push('');
        
        // 1. Clean up existing data to allow repeated execution
        sqlLines.push('-- Cleanup existing tables');
        sqlLines.push('TRUNCATE TABLE "siak_rincian_krs_mahasiswa" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_krs_mahasiswa" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_hasil_studi" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_jadwal_kuliah" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_kelas_kuliah" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_rps" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_mata_kuliah" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_mahasiswa" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_user_role" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_user" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_role" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_agama" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_suku" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_status_mahasiswa" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_program_studi" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_fakultas" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_periode_akademik" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_tahun_ajaran" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_tahun_kurikulum" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_dosen" CASCADE;');
        sqlLines.push('TRUNCATE TABLE "siak_ruangan" CASCADE;');
        sqlLines.push('');

        // Master IDs
        const roleMhsId = 'b63a9254-469b-4688-92f7-ec8f386927bf';
        const roleParentId = 'a807d9d0-25bc-446f-87eb-07a82b998cfb';
        const agamaId = 'ce9d1e57-a365-4fa0-8ad4-1c5c56d78219';
        const sukuId = 'f2cbe68e-5b12-42fe-bd35-a6a383d474b7';
        const statusMhsId = '3d664c3c-8a19-482a-89a1-cb9ce3e30f14';
        const fakultasId = '1b69dfc2-069a-4c22-959c-6a8470a911ee';
        const prodiId = 'b70c3291-7d1a-464a-a53d-24959db8132e';
        const tahunAjaranId = '6b8cf92a-302a-4318-8f8a-cd60b4ea1ee2';
        const periodeId = '1e9a7e8b-209c-4c4f-9e8a-dfc8ab27b019';
        const kurikulumId = '8c257dfb-d021-49cb-826e-982fa1f97a5f';
        const dosen1Id = '2a98f1cd-304a-4e2b-8a8b-f92e21b714ee';
        const dosen2Id = '8c257dfb-204a-4e2b-8a8b-f92e21b714ee';
        const ruangan1Id = 'd9c02581-209b-47e1-b8ef-f1e1a8a29a1d';
        const ruangan2Id = '9bc02581-209b-47e1-b8ef-f1e1a8a29a1d';

        const nowStr = new Date().toISOString();

        // 2. Roles
        sqlLines.push('-- Insert Roles');
        sqlLines.push(`INSERT INTO "siak_role" (id, nama, deskripsi, created_at, updated_at) VALUES ('${roleMhsId}', 'Mahasiswa', 'Role Mahasiswa', '${nowStr}', '${nowStr}');`);
        sqlLines.push(`INSERT INTO "siak_role" (id, nama, deskripsi, created_at, updated_at) VALUES ('${roleParentId}', 'Parent', 'Role Orang Tua', '${nowStr}', '${nowStr}');`);
        sqlLines.push('');

        // 3. Agama & Suku
        sqlLines.push('-- Insert Agama & Suku');
        sqlLines.push(`INSERT INTO "siak_agama" (id, nama, created_at, updated_at) VALUES ('${agamaId}', 'Islam', '${nowStr}', '${nowStr}');`);
        sqlLines.push(`INSERT INTO "siak_suku" (id, nama, created_at, updated_at) VALUES ('${sukuId}', 'Sunda', '${nowStr}', '${nowStr}');`);
        sqlLines.push('');

        // 4. Status Mahasiswa
        sqlLines.push('-- Insert Status Mahasiswa');
        sqlLines.push(`INSERT INTO "siak_status_mahasiswa" (id, nama, created_at, updated_at) VALUES ('${statusMhsId}', 'Aktif', '${nowStr}', '${nowStr}');`);
        sqlLines.push('');

        // 5. Fakultas & Program Studi
        sqlLines.push('-- Insert Fakultas & Program Studi');
        sqlLines.push(`INSERT INTO "siak_fakultas" (id, nama, created_at, updated_at) VALUES ('${fakultasId}', 'Fakultas Teknik', '${nowStr}', '${nowStr}');`);
        sqlLines.push(`INSERT INTO "siak_program_studi" (id, siak_fakultas_id, nama, kode, created_at, updated_at) VALUES ('${prodiId}', '${fakultasId}', 'Teknik Informatika', 'TIF', '${nowStr}', '${nowStr}');`);
        sqlLines.push('');

        // 6. Tahun Ajaran, Periode, Kurikulum
        sqlLines.push('-- Insert Academic Periods & Curriculum');
        sqlLines.push(`INSERT INTO "siak_tahun_ajaran" (id, tahun, nama, created_at, updated_at) VALUES ('${tahunAjaranId}', '2024', '2024/2025', '${nowStr}', '${nowStr}');`);
        sqlLines.push(`INSERT INTO "siak_periode_akademik" (id, siak_tahun_ajaran_id, nama, kode, tanggal_mulai, tanggal_selesai, status, created_at, updated_at) VALUES ('${periodeId}', '${tahunAjaranId}', '2024/2025 Ganjil', '20241', '2024-09-01', '2024-02-28', 'Aktif', '${nowStr}', '${nowStr}');`);
        sqlLines.push(`INSERT INTO "siak_tahun_kurikulum" (id, siak_periode_akademik_id, tahun, keterangan, tanggal_mulai, tanggal_selesai, created_at, updated_at) VALUES ('${kurikulumId}', '${periodeId}', '2022', 'Kurikulum MBKM 2022', '2022-09-01', '2026-08-31', '${nowStr}', '${nowStr}');`);
        sqlLines.push('');

        // 7. Dosen & Ruangan
        sqlLines.push('-- Insert Dosen & Ruangan');
        sqlLines.push(`INSERT INTO "siak_dosen" (id, nama, nidn, created_at, updated_at) VALUES ('${dosen1Id}', 'Dr. Ahmad Fauzi', '0412058001', '${nowStr}', '${nowStr}');`);
        sqlLines.push(`INSERT INTO "siak_dosen" (id, nama, nidn, created_at, updated_at) VALUES ('${dosen2Id}', 'Ir. Maria Ulfah, M.T.', '0420108502', '${nowStr}', '${nowStr}');`);
        sqlLines.push(`INSERT INTO "siak_ruangan" (id, siak_fakultas_id, nama, ruangan, kapasitas, lantai, created_at, updated_at) VALUES ('${ruangan1Id}', '${fakultasId}', 'Lab Komputer A', 'LAB-01', 40, 3, '${nowStr}', '${nowStr}');`);
        sqlLines.push(`INSERT INTO "siak_ruangan" (id, siak_fakultas_id, nama, ruangan, kapasitas, lantai, created_at, updated_at) VALUES ('${ruangan2Id}', '${fakultasId}', 'Ruang Kuliah 302', 'RK-302', 50, 3, '${nowStr}', '${nowStr}');`);
        sqlLines.push('');

        // 8. Mata Kuliah
        sqlLines.push('-- Insert Mata Kuliah');
        const mkIds = [];
        mataKuliahData.forEach((mk, idx) => {
            const pad = String(idx + 1).padStart(3, '0');
            const mkId = `33333333-3333-3333-3333-333333333${pad}`;
            mkIds.push(mkId);
            sqlLines.push(`INSERT INTO "siak_mata_kuliah" (id, siak_program_studi_id, siak_tahun_kurikulum_id, nama, kode, jenis, semester, total_sks, ada_praktikum, created_at, updated_at) VALUES ('${mkId}', '${prodiId}', '${kurikulumId}', '${mk.nama}', '${mk.kode}', 'Wajib', ${mk.semester}, ${mk.sks}, ${mk.nama.includes('Praktik')}, '${nowStr}', '${nowStr}');`);
        });
        sqlLines.push('');

        // 9. RPS & Kelas Kuliah
        sqlLines.push('-- Insert RPS & Kelas Kuliah');
        const kelasIds = [];
        mkIds.forEach((mkId, idx) => {
            const pad = String(idx + 1).padStart(3, '0');
            const rpsId = `44444444-4444-4444-4444-444444444${pad}`;
            const kelasId = `55555555-5555-5555-5555-555555555${pad}`;
            kelasIds.push(kelasId);
            
            // RPS
            sqlLines.push(`INSERT INTO "siak_rps" (id, siak_mata_kuliah_id, tanggal_penyusunan, deskripsi_mata_kuliah, tujuan_mata_kuliah, materi_pembelajaran, pustaka_utama, pustaka_pendukung, dokumen_rps, created_at, updated_at) VALUES ('${rpsId}', '${mkId}', '2024-08-15', 'Deskripsi Mata Kuliah', 'Tujuan Pembelajaran', 'Materi Kuliah', 'Pustaka Utama', 'Pustaka Pendukung', 'RPS-Doc.pdf', '${nowStr}', '${nowStr}');`);
            
            // Kelas
            const mk = mataKuliahData[idx];
            sqlLines.push(`INSERT INTO "siak_kelas_kuliah" (id, siak_mata_kuliah_id, siak_periode_akademik_id, siak_program_studi_id, siak_rps_id, nama, kapasitas, jumlah_peminat, sistem_kuliah, status_kelas, jumlah_pertemuan, tanggal_mulai, tanggal_selesai, created_at, updated_at) VALUES ('${kelasId}', '${mkId}', '${periodeId}', '${prodiId}', '${rpsId}', 'A', 40, 16, 'Reguler', 'Aktif', 16, '2024-09-02', '2025-01-20', '${nowStr}', '${nowStr}');`);
        });
        sqlLines.push('');

        // 10. Jadwal Kuliah
        sqlLines.push('-- Insert Jadwal Kuliah');
        kelasIds.forEach((kelasId, idx) => {
            const pad = String(idx + 1).padStart(3, '0');
            const jadwalId = `eeeeeeee-eeee-eeee-eeee-eeeeeeeee${pad}`;
            const hari = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'][idx % 5];
            const jamMulai = '08:00:00';
            const jamSelesai = '10:30:00';
            sqlLines.push(`INSERT INTO "siak_jadwal_kuliah" (id, siak_kelas_kuliah_id, siak_ruangan_id, siak_dosen_id, hari, jam_mulai, jam_selesai, jenis_pertemuan, metode_pembelajaran, created_at, updated_at) VALUES ('${jadwalId}', '${kelasId}', '${ruangan1Id}', '${dosen1Id}', '${hari}', '${jamMulai}', '${jamSelesai}', 'Tatap Muka', 'Ceramah', '${nowStr}', '${nowStr}');`);
        });
        sqlLines.push('');

        // 11. Students (siak_user, siak_user_role, siak_mahasiswa)
        sqlLines.push('-- Insert Students & Parents (siak_user, siak_user_role, siak_mahasiswa)');
        const mhsIds = [];
        studentRawData.forEach((s, idx) => {
            const pad = String(idx + 1).padStart(3, '0');
            const uMhsId = `11111111-1111-1111-1111-111111111${pad}`;
            const uParentId = `22222222-2222-2222-2222-222222222${pad}`;
            const mhsId = `aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaa${pad}`;
            mhsIds.push(mhsId);

            const studentUsername = s.nama.toLowerCase().replace(/\s+/g, '');
            const parentUsername = s.ortu.toLowerCase().replace(/\s+/g, '');
            const parentEmail = `${parentUsername}@gmail.com`;

            // Insert Users
            sqlLines.push(`INSERT INTO "siak_user" (id, username, email, password, created_at, updated_at) VALUES ('${uMhsId}', '${studentUsername}', '${s.email}', '${hashedPassword}', '${nowStr}', '${nowStr}');`);
            sqlLines.push(`INSERT INTO "siak_user" (id, username, email, password, created_at, updated_at) VALUES ('${uParentId}', '${parentUsername}', '${parentEmail}', '${hashedPassword}', '${nowStr}', '${nowStr}');`);

            // User Roles
            const urMhsId = `77777777-7777-7777-7777-111111111${pad}`;
            const urParentId = `77777777-7777-7777-7777-222222222${pad}`;
            sqlLines.push(`INSERT INTO "siak_user_role" (id, siak_user_id, siak_role_id, created_at, updated_at) VALUES ('${urMhsId}', '${uMhsId}', '${roleMhsId}', '${nowStr}', '${nowStr}');`);
            sqlLines.push(`INSERT INTO "siak_user_role" (id, siak_user_id, siak_role_id, created_at, updated_at) VALUES ('${urParentId}', '${uParentId}', '${roleParentId}', '${nowStr}', '${nowStr}');`);

            // Mahasiswa profile
            sqlLines.push(`INSERT INTO "siak_mahasiswa" (id, siak_user_id, nama, npm, siak_program_studi_id, periode_masuk, siak_tahun_kurikulum_id, siak_status_mahasiswa_id, siak_agama_id, siak_suku_id, jenis_kelamin, tempat_lahir, tanggal_lahir, no_telepon, no_whatsapp, email_pribadi, created_at, updated_at) VALUES ('${mhsId}', '${uMhsId}', '${s.nama}', '${s.npm}', '${prodiId}', '20241', '${kurikulumId}', '${statusMhsId}', '${agamaId}', '${sukuId}', 'Laki-laki', 'Jakarta', '2004-05-15', '081234567890', '081234567890', '${s.email}', '${nowStr}', '${nowStr}');`);
        });
        sqlLines.push('');

        // 12. KRS & KRS Details (siak_krs_mahasiswa, siak_rincian_krs_mahasiswa, siak_hasil_studi)
        sqlLines.push('-- Insert KRS & KRS Details with Grade Data (Academic Results)');
        mhsIds.forEach((mhsId, mIdx) => {
            const pad = String(mIdx + 1).padStart(3, '0');
            const krsId = `66666666-6666-6666-6666-666666666${pad}`;
            const totalSksTaken = mataKuliahData.reduce((acc, curr) => acc + curr.sks, 0);

            // KRS
            sqlLines.push(`INSERT INTO "siak_krs_mahasiswa" (id, siak_mahasiswa_id, siak_periode_akademik_id, status, sks_diambil, semester, created_at, updated_at) VALUES ('${krsId}', '${mhsId}', '${periodeId}', 'Disetujui', ${totalSksTaken}, 1, '${nowStr}', '${nowStr}');`);

            // KRS Details for each class
            kelasIds.forEach((kelasId, kIdx) => {
                const detPad = String(mIdx + 1).padStart(3, '0') + String(kIdx + 1).padStart(2, '0');
                const rincianId = `99999999-9999-9999-9999-9999999${detPad}`;
                
                // Grades (realistic and consistent, e.g., A/B)
                const uts = 80 + (mIdx % 3) * 5;
                const uas = 85 + (mIdx % 2) * 5;
                const tugas = 90;
                const kehadiran = 100;
                const nilaiAkhir = (uts * 0.3) + (uas * 0.4) + (tugas * 0.2) + (kehadiran * 0.1);
                
                let huruf = 'A';
                let angka = 4.0;
                if (nilaiAkhir < 80) { huruf = 'B'; angka = 3.0; }
                else if (nilaiAkhir < 70) { huruf = 'C'; angka = 2.0; }

                sqlLines.push(`INSERT INTO "siak_rincian_krs_mahasiswa" (id, siak_krs_mahasiswa_id, siak_kelas_kuliah_id, kategori, status, kehadiran, tugas, uts, uas, nilai, huruf_mutu, angka_mutu, nilai_akhir, created_at, updated_at) VALUES ('${rincianId}', '${krsId}', '${kelasId}', 'Wajib', 'Aktif', ${kehadiran}, ${tugas}, ${uts}, ${uas}, ${nilaiAkhir}, '${huruf}', ${angka}, ${nilaiAkhir}, '${nowStr}', '${nowStr}');`);
            });

            // Hasil Studi (IPK / IPS Transcript)
            const hsId = `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbb${pad}`;
            sqlLines.push(`INSERT INTO "siak_hasil_studi" (id, siak_mahasiswa_id, siak_periode_akademik_id, semester, ips, ipk, sks_diambil, sks_lulus, created_at, updated_at) VALUES ('${hsId}', '${mhsId}', '${periodeId}', 1, 3.85, 3.85, ${totalSksTaken}, ${totalSksTaken}, '${nowStr}', '${nowStr}');`);
        });

        // Write SQL file
        const sqlPath = path.join(__dirname, 'insert_data.sql');
        await fs.writeFile(sqlPath, sqlLines.join('\n'));
        console.log(`Successfully generated SQL insert script at: ${sqlPath}`);
        
        // Execute SQL script directly to test and register the data!
        console.log('Executing SQL script directly on the Neon DB...');
        const sqlText = sqlLines.join('\n');
        await db.sequelize.query(sqlText);
        console.log('🚀 Seeding and insertion via SQL completed successfully on the database!');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

generate();
