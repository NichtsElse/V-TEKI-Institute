<!--
Purpose: Summarize the future REST API design for the V-TEKI platform.
Who uses it: Frontend engineers, backend engineers, and reviewers.
Main dependencies: Planned Express.js backend, Supabase Auth, Supabase Postgres, and shared domain rules.
Public/main sections: Current runtime boundary, domain endpoints, API conventions, auth, and RLS alignment.
Important side effects: None.
-->

# API Design Summary

_Last updated: 2026-06-19_

> **Catatan**: Dokumen ini menggambarkan kontrak REST API untuk backend di masa depan. MVP yang berjalan saat ini menggunakan Supabase langsung dari frontend melalui `src/api/appClient.js`. Tidak ada Express.js API yang aktif saat ini.

---

## API Style

Gaya API yang direkomendasikan untuk backend masa depan:

- REST-oriented
- dikelompokkan per domain bisnis
- dilindungi berdasarkan role
- divalidasi di setiap write path

---

## Auth

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/auth/register` | Registrasi user baru |
| `POST` | `/api/auth/login` | Login dan buat sesi |
| `POST` | `/api/auth/logout` | Hapus sesi aktif |
| `GET` | `/api/auth/me` | Ambil data user yang sedang login |

---

## Programs

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/programs` | Daftar semua program |
| `GET` | `/api/programs/:id` | Detail program |
| `POST` | `/api/programs` | Buat program baru (admin) |
| `PUT` | `/api/programs/:id` | Update program (admin) |
| `DELETE` | `/api/programs/:id` | Hapus program (admin) |

---

## Batches

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/batches` | Daftar semua batch |
| `GET` | `/api/batches/:id` | Detail batch |
| `POST` | `/api/batches` | Buat batch baru (admin) |
| `PUT` | `/api/batches/:id` | Update batch (admin) |

---

## Enrollment

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/register/individual` | Registrasi peserta individu |
| `POST` | `/api/register/corporate` | Registrasi peserta korporat |
| `GET` | `/api/enrollments` | Daftar enrollment |
| `GET` | `/api/enrollments/:id` | Detail enrollment |
| `PUT` | `/api/enrollments/:id` | Update status enrollment |

---

## Payments & Invoices

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/invoices` | Daftar invoice |
| `GET` | `/api/payments` | Daftar pembayaran |
| `POST` | `/api/payments/upload-proof` | Upload bukti pembayaran |
| `POST` | `/api/payments/verify` | Verifikasi pembayaran (admin) |

---

## Assessments

| Method | Endpoint | Deskripsi |
|---|---|---|
| `GET` | `/api/assessments/:programId` | Ambil soal assessment |
| `POST` | `/api/assessments` | Buat assessment (trainer/admin) |
| `POST` | `/api/assessments/:id/submit` | Submit jawaban peserta |
| `GET` | `/api/assessments/result/:enrollmentId` | Ambil hasil assessment |

---

## Attendance

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/attendance/check-in` | Check-in peserta |
| `POST` | `/api/attendance/check-out` | Check-out peserta |
| `POST` | `/api/attendance/manual` | Input manual absensi (trainer) |
| `GET` | `/api/attendance/:batchId` | Daftar absensi per batch |

---

## Feedback

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/feedback` | Submit feedback peserta |
| `GET` | `/api/feedback/:enrollmentId` | Ambil feedback per enrollment |
| `GET` | `/api/feedback` | Semua feedback (admin/trainer) |

---

## Completion & Certificates

| Method | Endpoint | Deskripsi |
|---|---|---|
| `POST` | `/api/completion/validate/:enrollmentId` | Validasi kelayakan sertifikat |
| `POST` | `/api/certificates/generate/:enrollmentId` | Generate sertifikat |
| `GET` | `/api/certificates/:certificateNumber` | Ambil sertifikat |
| `GET` | `/api/certificates/verify/:verificationCode` | Verifikasi keaslian sertifikat |
| `GET` | `/api/certificates/download/:certificateNumber` | Download PDF sertifikat |

---

## Aturan API

- semua write endpoint wajib menggunakan validasi schema
- semua endpoint sensitif wajib menggunakan autentikasi
- otorisasi berbasis role wajib diterapkan di middleware
- logika kelayakan sertifikat menggunakan helper di domain layer
- service-role Supabase tetap di backend, tidak boleh masuk ke frontend

---

## RLS Alignment

API harus selaras dengan ekspektasi Supabase RLS:

| Role | Akses |
|---|---|
| `participant` | hanya data miliknya sendiri |
| `trainer` | hanya data batch yang ditugaskan |
| `corporate_pic` | hanya data organisasinya |
| `academy_admin` | akses operasional penuh |
| `super_admin` | akses sistem penuh |

---

## Runtime Saat Ini

- Frontend berjalan melalui abstraksi `appClient.js`, bukan REST API ini.
- Supabase Auth dan Postgres adalah backend aktif ketika env vars dikonfigurasi.
- Express.js routes tetap menjadi opsi masa depan jika project membutuhkan dedicated API layer.
- Logika kelayakan sertifikat tetap berada di domain layer frontend hingga migrasi backend dimulai.
