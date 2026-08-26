-- Merge siak_pegawai ke siak_dosen (rename jadi siak_pegawai) + tambah kolom role.
-- Setara dengan migrations/20260813120000-merge-siak-pegawai-into-siak-dosen.cjs
-- CATATAN: skrip ini mengasumsikan tabel siak_pegawai & siak_pengumuman masih KOSONG
-- (sesuai kondisi saat dibuat, 2026-08-13). Kalau di server sudah ada data di
-- siak_pegawai atau siak_pengumuman, JANGAN jalankan langsung — perlu langkah
-- dedup/remap data tambahan dulu.

BEGIN;

-- 1. Lepas FK siak_pengumuman -> siak_pegawai (lama) supaya tabel siak_pegawai bisa di-drop
ALTER TABLE "siak_pengumuman" DROP CONSTRAINT "siak_pengumuman_siak_pegawai_id_foreign";

-- 2. Drop tabel siak_pegawai lama (kosong)
DROP TABLE IF EXISTS "siak_pegawai";

-- 3. siak_dosen jadi tabel gabungan, ganti nama jadi siak_pegawai
ALTER TABLE "siak_dosen" RENAME TO "siak_pegawai";

-- 4. Rapikan nama constraint/index bawaan siak_dosen supaya konsisten dengan nama tabel baru
ALTER TABLE "siak_pegawai" RENAME CONSTRAINT "siak_dosen_pkey" TO "siak_pegawai_pkey";
ALTER INDEX "siak_dosen_siak_user_id_index" RENAME TO "siak_pegawai_siak_user_id_index";
ALTER TABLE "siak_pegawai" RENAME CONSTRAINT "siak_dosen_siak_user_id_foreign" TO "siak_pegawai_siak_user_id_foreign";
ALTER TABLE "siak_pegawai" RENAME CONSTRAINT "siak_dosen_unit_kerja_id_fkey" TO "siak_pegawai_unit_kerja_id_fkey";

-- 5. Tambah kolom role
ALTER TABLE "public"."siak_pegawai" ADD COLUMN "is_dosen" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "public"."siak_pegawai" ADD COLUMN "is_pegawai" BOOLEAN NOT NULL DEFAULT false;

-- 6. Backfill: semua baris eksisting berasal dari siak_dosen -> tandai sebagai dosen
UPDATE "siak_pegawai" SET "is_dosen" = true;

-- 7. Pasang lagi FK siak_pengumuman -> siak_pegawai (tabel gabungan)
ALTER TABLE "siak_pengumuman"
  ADD CONSTRAINT "siak_pengumuman_siak_pegawai_id_foreign"
  FOREIGN KEY ("siak_pegawai_id") REFERENCES "siak_pegawai" ("id") ON UPDATE CASCADE;

-- Catat migration ini di SequelizeMeta supaya `sequelize db:migrate` tidak menjalankannya lagi
INSERT INTO "SequelizeMeta" ("name")
VALUES ('20260813120000-merge-siak-pegawai-into-siak-dosen.cjs')
ON CONFLICT DO NOTHING;

COMMIT;
