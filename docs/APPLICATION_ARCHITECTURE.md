<!--
Purpose: Describe the target application architecture for the V-TEKI MVP and future backend migration.
Who uses it: Engineers, reviewers, and future implementation sessions.
Main dependencies: Current Vite/React frontend, Supabase services, local fallback adapter, and planned Express.js backend.
Public/main sections: Frontend layers, backend direction, auth model, authorization model, and business rules.
Important side effects: None.
-->

# Application Architecture

_Last updated: 2026-06-19_

> **Catatan**: Aplikasi yang berjalan saat ini adalah React + Vite MVP yang menggunakan Supabase sebagai backend utama, dengan data demo lokal sebagai fallback preview.

---

## Overview

Aplikasi dirancang dalam tiga layer yang jelas:

1. **Presentation Layer** — UI dan interaksi pengguna
2. **Domain Layer** — logika bisnis bersama
3. **Data Access Layer** — abstraksi penyimpanan dan backend

Pemisahan ini menjaga MVP tetap dapat digunakan sambil membuka ruang untuk migrasi `Express.js + Supabase` di masa depan.

---

## Presentation Layer

Layer ini berisi:
- halaman (pages)
- dashboard
- form
- tabel dan kartu
- komponen layout
- navigasi berbasis role

**Lokasi saat ini:**
- `src/pages/*`
- `src/components/*`
- `src/api/appClient.js`

**Tanggung jawab:**
- render UI
- kumpulkan input pengguna
- tampilkan status dan ringkasan
- panggil helper domain/data

**Tidak boleh memiliki:**
- logika aturan sertifikat
- logika keputusan role
- aturan bisnis lintas modul

---

## Domain Layer

Layer ini berisi logika bisnis bersama dan aturan yang dapat digunakan ulang.

**Lokasi saat ini:**
- `src/domain/auth`
- `src/domain/certificates`
- `src/domain/trainers`
- `src/domain/corporate`

**Target modul:**
- `auth` — mapping role dan sesi
- `roles` — helper navigasi berbasis role
- `enrollments` — lifecycle enrollment
- `payments` — logika status pembayaran
- `assessments` — logika penilaian
- `attendance` — logika kehadiran
- `feedback` — logika feedback
- `certificates` — kelayakan dan penerbitan sertifikat

---

## Data Access Layer

**Mode saat ini:**
- `src/api/appClient.js`
- Baca/tulis data melalui Supabase jika dikonfigurasi
- Adapter in-browser lokal sebagai fallback preview

**Mode masa depan:**
- Optional API service layer di frontend yang memanggil `Express.js`
- Persistensi backend melalui `Supabase`

**Tanggung jawab:**
- baca/tulis data
- isolasi perbedaan penyimpanan/backend
- jaga komponen halaman tetap agnostik terhadap backend

---

## Authentication

### MVP Saat Ini
- Supabase email OTP saat dikonfigurasi
- Google Sign-In via Supabase OAuth
- penanganan sesi lokal hanya untuk fallback preview
- redirect dan perilaku sidebar berbasis role

### Target Backend Model
- `Supabase Auth` untuk identitas
- optional `Express.js` middleware untuk validasi auth jika REST API ditambahkan

---

## Authorization

**Role yang didukung:**

| Role | Akses |
|---|---|
| `super_admin` | Akses sistem dan operasional penuh |
| `academy_admin` | Akses operasional penuh |
| `trainer` | Kelas yang ditugaskan, peserta, absensi, assessment |
| `participant` | Data pembelajaran, pembayaran, feedback, sertifikat milik sendiri |
| `corporate_pic` | Peserta organisasi, invoice, laporan organisasi |

---

## RLS Direction

Meskipun RLS belum aktif, desain harus mengikuti batasan Supabase RLS:

- participant hanya melihat data miliknya
- trainer hanya melihat data yang ditugaskan
- corporate PIC hanya melihat data organisasinya
- admin roles mengelola data operasional
- service role tetap di backend saja

---

## Kelayakan Sertifikat

Penerbitan sertifikat harus menggunakan satu aturan bersama yang terpusat di domain layer:

| Syarat | Nilai |
|---|---|
| `payment_status` | `paid` |
| `attendance_percentage` | `>= 80%` |
| `post_assessment_status` | `completed` |
| `feedback_status` | `submitted` |
| `completion_status` | `completed` |

Logika ini harus tetap terpusat di domain layer dan tidak boleh diduplikasi di halaman mana pun.
