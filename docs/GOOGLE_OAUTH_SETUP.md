# Panduan Konfigurasi Google Sign-In (OAuth)

Dokumen ini berisi panduan **lengkap dan detail** untuk mengaktifkan fitur **"Continue with Google"** pada aplikasi V-TEKI Institute menggunakan Supabase Auth secara **gratis**.

---

## Prasyarat

Sebelum memulai, pastikan Anda memiliki:
- Akun **Google** aktif.
- Project **Supabase** yang sudah dibuat di [Supabase Dashboard](https://supabase.com/dashboard).
- Akses ke **[Google Cloud Console](https://console.cloud.google.com/)**.

---

## Langkah 1: Salin Redirect URL dari Supabase

URL ini wajib dimasukkan ke Google Cloud Console agar Google tahu ke mana mengirim balik user setelah login.

1. Buka **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Pilih project Anda.
3. Di sidebar sebelah kiri, klik **Authentication** (ikon gembok).
4. Klik submenu **Providers**.
5. Cari dan klik provider **Google**.
6. Di bagian bawah modal/halaman, temukan kolom **Callback URL (Redirect URL)**. Formatnya:
   ```
   https://<PROJECT-REF>.supabase.co/auth/v1/callback
   ```
   > **Contoh nyata**: `https://rhcxaefebyunzqhmzzjj.supabase.co/auth/v1/callback`
7. Salin URL tersebut. Anda akan membutuhkannya di Langkah 3.

---

## Langkah 2: Konfigurasi Google Cloud Console

### 2a. Buka / Buat Project di Google Cloud Console
1. Buka **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Di bagian atas layar, klik nama project yang aktif (atau klik **New Project** untuk membuat yang baru).
3. Jika membuat baru: isi nama project (misal: *V-TEKI*) lalu klik **Create**.

### 2b. Konfigurasi Branding (Nama & Identitas Aplikasi)
1. Di sidebar kiri, cari dan klik **Google Auth Platform** > **Branding**.
2. Isi kolom-kolom berikut:
   - **App name**: Nama aplikasi Anda (misal: *V-TEKI Institute*).
   - **User support email**: Pilih/ketik email Google Anda.
   - **Developer contact information > Email addresses**: Ketik email Anda.
3. Klik **Save**.

### 2c. Konfigurasi Audience (Siapa yang Bisa Login)
1. Di sidebar kiri, klik **Google Auth Platform** > **Audience**.
2. Pada bagian **User Type**, pilih **External**.
   > **External** berarti siapapun dengan akun Google dapat login, bukan hanya pengguna dalam organisasi Anda.
3. Klik **Save**.

### 2d. Buat OAuth Client ID (Kredensial Web)
1. Di sidebar kiri, klik **Google Auth Platform** > **Clients**.
2. Klik tombol **Create Client** (atau **+ Create Credentials** > **OAuth client ID**).
3. Pada dropdown **Application type**, pilih **Web application**.
4. Isi **Name** (misal: *V-TEKI Web App*).
5. Di bagian **Authorized JavaScript origins**, klik **+ Add URI** dan tambahkan:
   ```
   http://localhost:5173
   http://127.0.0.1:4173
   ```
   > Tambahkan juga URL produksi Anda jika sudah ada (misal: `https://vteki.com`).
6. Di bagian **Authorized redirect URIs**, klik **+ Add URI** dan tambahkan URL Callback Supabase dari **Langkah 1**:
   ```
   https://<PROJECT-REF>.supabase.co/auth/v1/callback
   ```
   > ⚠️ **Penting**: Setelah mengetik URL, tekan **Enter** hingga teks berubah menjadi sebuah chip/tag biru. Jika tidak, URL tidak akan tersimpan.
7. Klik tombol **Create** di bagian bawah.
8. Sebuah dialog akan muncul menampilkan **Client ID** dan **Client Secret** Anda. **Salin keduanya sekarang** (atau klik **Download JSON** untuk menyimpannya).

---

## Langkah 3: Masukkan Kredensial ke Supabase

1. Kembali ke tab browser **Supabase Dashboard** > **Authentication** > **Providers** > **Google**.
2. Aktifkan toggle **Enable Sign in with Google** (pastikan berwarna hijau/aktif).
3. Isi kolom berikut:
   - **Client IDs**: Tempel *Client ID* yang Anda salin dari Google Cloud Console.
     > Format contoh: `1073592276386-xxxx.apps.googleusercontent.com`
   - **Client Secret (for OAuth)**: Tempel *Client Secret* Anda.
     > Format contoh: `GOCSPX-xxxxxxxxxxxxxxxxxxxxxxxx`
4. Biarkan opsi **Skip nonce checks** dan **Allow users without an email** dalam kondisi **mati (off)**.
5. Klik tombol **Save** di pojok kanan bawah.

---

## Langkah 4: Pastikan Environment Variables Sudah Benar

Buka file `.env.local` di root folder project Anda. Pastikan variabel berikut sudah diisi dengan benar:

```env
VITE_ENABLE_SUPABASE=true
VITE_SUPABASE_URL=https://<PROJECT-REF>.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key
```

> **Di mana mendapatkan nilai ini?** Buka Supabase Dashboard > **Project Settings** > **API**.

---

## Langkah 5: Uji Coba Login Google

1. Hentikan dan jalankan ulang dev server:
   ```bash
   npm run dev
   ```
2. Buka aplikasi di browser (misal: `http://127.0.0.1:4173`).
3. Masuk ke halaman **Login** atau **Register**.
4. Klik tombol **"Continue with Google"**.
5. Browser akan membuka popup atau mengarahkan Anda ke halaman pilih akun Google resmi.
6. Pilih akun Google Anda.
7. Setelah berhasil, Anda akan diarahkan kembali ke aplikasi V-TEKI dan otomatis masuk. Profil Anda tersimpan di database Supabase.

---

## Troubleshooting

### ❌ Error 400: `redirect_uri_mismatch`
**Penyebab**: URL Callback yang dimasukkan di Google Cloud Console tidak sama persis dengan URL yang dikirim Supabase.

**Solusi**:
1. Buka kembali **Google Cloud Console** > **Google Auth Platform** > **Clients**.
2. Klik edit (ikon pensil) pada Client ID Anda.
3. Pastikan kolom **Authorized redirect URIs** berisi URL berikut **persis** (tanpa spasi atau karakter tambahan):
   ```
   https://<PROJECT-REF>.supabase.co/auth/v1/callback
   ```
4. Setelah mengetik URL, tekan **Enter** hingga teks berubah menjadi chip, lalu klik **Save** di bagian bawah.
5. Tunggu 1–2 menit lalu coba lagi.

### ❌ Tombol "Continue with Google" tidak melakukan apa-apa
**Penyebab**: Supabase belum dikonfigurasi di `.env.local`.

**Solusi**: Pastikan `VITE_ENABLE_SUPABASE=true` sudah ada di file `.env.local` dan dev server sudah di-restart.

### ❌ User berhasil login Google tapi tidak diarahkan ke dashboard
**Penyebab**: Profil user belum ada di tabel `users_profile` di Supabase.

**Solusi**: Sistem seharusnya membuat profil otomatis. Jika tidak, periksa apakah tabel `users_profile` sudah dibuat dengan menjalankan `supabase/schema_fixed.sql` di SQL Editor Supabase.
