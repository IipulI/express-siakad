# Bab II — Tinjauan Pustaka

2.1 Outcome-Based Education (OBE)

Outcome-Based Education (OBE) adalah paradigma pendidikan yang mengarahkan seluruh proses pembelajaran pada pencapaian hasil belajar (learning outcomes). OBE menekankan perancangan kurikulum, strategi pembelajaran, dan penilaian yang terintegrasi sehingga lulusan memiliki kompetensi yang dapat diukur [1].

2.2 Capaian Pembelajaran Lulusan (CPL) dan Capaian Pembelajaran Mata Kuliah (CPMK)

CPL merupakan pernyataan capaian pada tingkat program studi (lulusannya), sedangkan CPMK adalah terjemahan CPL pada tingkat mata kuliah yang lebih operasional. Pemetaan CPL→CPMK→RPS menjamin keterkaitan antara tujuan program studi dan kegiatan pembelajaran di tingkat mata kuliah [2].

2.3 Rencana Pembelajaran Semester (RPS) dan Template Evaluasi

RPS adalah dokumen yang mendeskripsikan capaian pembelajaran mata kuliah, bahan kajian, metode pembelajaran, dan skema evaluasi. Template evaluasi memfasilitasi standardisasi metode penilaian (mis. tugas, kuis, UTS, UAS) dan bobot komponen yang dipakai dalam perhitungan nilai akhir.

2.4 Metode Evaluasi dan Komposisi Penilaian

Metode evaluasi diimplementasikan melalui komposisi evaluasi yang menggabungkan beberapa metode (mis. tugas individu, tugas kelompok, kuis, UTS, UAS). Komposisi ini direpresentasikan di level RPS dan diimplementasikan pada tabel/tabel relasi di sistem backend untuk perhitungan nilai.

2.5 Sistem Informasi Akademik dan Arsitektur Perangkat Lunak

Implementasi sistem memanfaatkan prinsip-prinsip rekayasa perangkat lunak untuk modularitas, pengujian, dan pemeliharaan [3,4]. Pada proyek ini, arsitektur berbasis REST API memisahkan tanggung jawab antara controller (routing/validasi), service (logika bisnis), dan model (ORM/Sequelize) sehingga memudahkan sinkronisasi dokumentasi dan kode.

2.6 Deteksi Kemiripan ("turnitin kecil")

Konsep "turnitin kecil" atau fitur deteksi kemiripan ringan dapat dimasukkan sebagai fitur tambahan saat upload dokumen RPS atau tugas. Literatur deteksi plagiarisme menyediakan pendekatan berbasis n-gram, fingerprinting, atau model statistik untuk mendeteksi kemiripan teks [5]. Catatan: fitur ini bersifat opsional dan tidak diwajibkan dalam scope implementasi awal bila proses penilaian dilakukan oleh Dosen/Prodi secara manual.

2.7 Daftar Pustaka (pilihan awal, format Vancouver)

1. Spady WG. Outcome-Based Education: Critical Issues and Answers. American Association of School Administrators; 1994.
2. Biggs J, Tang C. Teaching for Quality Learning at University. 4th ed. Open University Press/McGraw-Hill; 2011.
3. Sommerville I. Software Engineering. Pearson; 2015.
4. Larman C. Applying UML and Patterns. 3rd ed. Prentice Hall; 2004.
5. Stamatatos E. A survey of modern plagiarism detection methods. 2011. (review article)
