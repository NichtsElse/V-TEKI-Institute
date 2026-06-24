# Panduan Ganti Akun / Project Supabase

Dokumen ini berisi panduan **lengkap dan detail** untuk mengganti atau memindahkan project Supabase yang digunakan oleh aplikasi V-TEKI Institute.

---

## Kapan Perlu Melakukan Ini?

- Ingin memindahkan aplikasi dari akun Supabase lama ke akun baru.
- Ingin membuat environment terpisah (misal: *development* vs *production*).
- Akun Supabase lama tidak bisa diakses lagi.

---

## Langkah 1: Buat Project Baru di Supabase

1. Buka **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Login dengan akun Supabase baru Anda (atau akun yang sama jika hanya ingin project baru).
3. Klik tombol **New Project** di pojok kanan atas.
4. Isi form berikut:
   - **Organization**: Pilih organisasi (atau buat baru).
   - **Project name**: Nama project Anda (misal: *vteki-production*).
   - **Database Password**: Buat password yang kuat. **Simpan password ini**, karena dibutuhkan untuk akses langsung ke database.
   - **Region**: Pilih region terdekat dengan pengguna Anda. Untuk Indonesia, pilih **Southeast Asia (Singapore)**.
5. Klik **Create new project**.
6. Tunggu hingga project selesai dibuat (sekitar 1–2 menit). Status akan berubah menjadi hijau/aktif.

---

## Langkah 2: Ambil Kunci API dari Project Baru

1. Di dashboard project baru, klik ikon **roda gigi (Settings)** di sidebar kiri bawah.
2. Klik submenu **API**.
3. Salin nilai-nilai berikut dari halaman ini:

   | Nama | Digunakan untuk |
   |---|---|
   | **Project URL** | `VITE_SUPABASE_URL` |
   | **anon / public** key | `VITE_SUPABASE_ANON_KEY` |
   | **service_role** key | `SUPABASE_SERVICE_ROLE_KEY` |

   > ⚠️ **Perhatian**: `service_role` key memiliki akses penuh ke database Anda. Jangan pernah dimasukkan ke kode frontend atau di-commit ke repository publik.

---

## Langkah 3: Update File `.env.local`

1. Buka file `.env.local` di root folder project V-TEKI Anda.
2. Ganti semua nilai lama dengan nilai baru dari **Langkah 2**:

```env
# Supabase client configuration
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=https://<PROJECT-BARU>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key_baru>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key_baru>
```

3. Simpan file.

> ⚠️ File `.env.local` sudah tercantum di `.gitignore` dan **tidak akan ikut ter-push ke GitHub**. Ini sudah benar — jangan ubah `.gitignore` untuk mengecualikan file ini.

---

## Langkah 4: Import Skema & Data ke Project Baru

Project Supabase baru masih kosong (belum ada tabel). Anda harus menjalankan file SQL secara berurutan dari folder `supabase/migrations/`.

### Cara Menjalankan File SQL:
1. Di **Supabase Dashboard** project baru, klik menu **SQL Editor** di sidebar kiri.
2. Klik tombol **New query**.
3. Buka file SQL di folder project Anda (`supabase/migrations/`) menggunakan text editor (misal: VS Code).
4. Salin **seluruh isi** file SQL tersebut.
5. Tempel (paste) ke SQL Editor Supabase.
6. Klik tombol **Run** (atau tekan `Ctrl+Enter` / `Cmd+Enter`).

### Urutan File SQL yang Harus Dijalankan:

#### 4a. Buat Tabel (Schema) — Wajib Pertama
```
supabase/migrations/01_schema.sql
```
> Membuat semua tabel yang dibutuhkan aplikasi (users_profile, programs, batches, enrollments, dll.).

#### 4b. Aktifkan Kebijakan Akses (RLS Policies) — Wajib
```
supabase/migrations/02_policies.sql
```
> Mengaktifkan Row Level Security (RLS) agar setiap user hanya bisa mengakses data yang diizinkan sesuai role mereka.

#### 4c. Isi Akun Demo (Auth Seed) — Opsional tapi Disarankan
```
supabase/migrations/03_seed_auth.sql
```
> Mengisi tabel autentikasi dengan akun-akun demo.

#### 4d. Isi Data Demo (App Data Seed) — Opsional tapi Disarankan
```
supabase/migrations/04_seed_data.sql
```
> Mengisi data program, batch, absensi, assessment, dan feedback demo.

#### 4e. Perbaikan RLS Update Policy — Sangat Disarankan
```
supabase/migrations/05_fix_rls_update.sql
```
> Mengaplikasikan perbaikan akses kebijakan RLS terbaru.

---

## Langkah 5: Konfigurasi Ulang Google OAuth (Jika Diperlukan)

Jika Anda menggunakan fitur **"Continue with Google"**, URL callback Supabase sudah berubah karena project ID berbeda. Anda harus memperbarui konfigurasi di dua tempat.

### 5a. Update di Supabase Dashboard
1. Buka **Authentication** > **Providers** > **Google** di dashboard project baru.
2. Aktifkan toggle **Enable Sign in with Google**.
3. Masukkan **Client ID** dan **Client Secret** Google Anda (nilai ini tidak berubah, sama seperti sebelumnya).
4. Salin **Callback URL (Redirect URL)** yang baru dari halaman ini. Formatnya:
   ```
   https://<PROJECT-BARU>.supabase.co/auth/v1/callback
   ```
5. Klik **Save**.

### 5b. Update di Google Cloud Console
1. Buka **[Google Cloud Console](https://console.cloud.google.com/)** > **Google Auth Platform** > **Clients**.
2. Klik edit (ikon pensil) pada Client ID yang Anda gunakan.
3. Di bagian **Authorized redirect URIs**:
   - Hapus URL callback Supabase lama.
   - Tambahkan URL callback Supabase baru dari Langkah 5a.
   - Tekan **Enter** hingga URL berubah menjadi chip/tag.
4. Klik **Save** di bagian bawah halaman.
5. Tunggu 1–2 menit sebelum mencoba login Google.

> Panduan lengkap Google OAuth tersedia di [`docs/GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md).

---

## Langkah 6: Restart Dev Server

Setelah semua perubahan di atas selesai, **wajib** restart dev server agar perubahan `.env.local` terbaca:

```bash
# Tekan Ctrl+C untuk menghentikan server yang sedang berjalan, lalu:
npm run dev
```

Aplikasi V-TEKI Anda sekarang sudah terhubung ke project Supabase yang baru!

---

## Checklist Akhir

Sebelum mengakui migrasi selesai, pastikan semua poin berikut sudah terpenuhi:

- [ ] File `.env.local` sudah diperbarui dengan URL dan kunci API Supabase baru.
- [ ] File SQL migrasi di folder `supabase/migrations/` (01 s.d 05) sudah dijalankan berurutan di SQL Editor Supabase baru.
- [ ] Google OAuth dikonfigurasi ulang dengan Callback URL baru (jika menggunakan Google Sign-In).
- [ ] Dev server sudah di-restart.
- [ ] Login dengan email/password berhasil.
- [ ] Login dengan Google berhasil (jika menggunakan Google Sign-In).

---

## Troubleshooting

### ❌ Tidak bisa login setelah ganti Supabase
- Pastikan nilai di `.env.local` sudah diperbarui dan disimpan.
- Pastikan dev server sudah di-restart setelah mengubah `.env.local`.
- Buka browser console (F12) dan cek apakah ada error koneksi ke URL Supabase.

### ❌ Data kosong / tabel tidak ditemukan
- Pastikan file migrasi `01_schema.sql` (skema) dan file seed `03_seed_auth.sql` & `04_seed_data.sql` sudah dijalankan di SQL Editor Supabase baru.

### ❌ Error Google OAuth: `redirect_uri_mismatch`
- Pastikan URL Callback Supabase yang **baru** sudah dimasukkan di Google Cloud Console (Langkah 5b).
- Lihat panduan lengkap di [`docs/GOOGLE_OAUTH_SETUP.md`](GOOGLE_OAUTH_SETUP.md).

### ❌ Error: `relation "users_profile" does not exist`
- Tabel belum dibuat. Jalankan `01_schema.sql` di SQL Editor Supabase.
