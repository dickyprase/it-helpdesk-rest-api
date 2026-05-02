# IT Helpdesk REST API -- Dokumentasi Lengkap

**Base URL:** `http://localhost:3001/api/v1`

---

## Panduan Umum

### Format Response

Semua response menggunakan format JSON yang konsisten:

**Sukses:**
```json
{
  "error": false,
  "data": { ... }
}
```

**Error:**
```json
{
  "error": true,
  "message": "Penjelasan error di sini"
}
```

### HTTP Status Codes

| Code | Arti | Kapan Muncul |
|------|------|--------------|
| `200` | OK | Request berhasil |
| `201` | Created | Data baru berhasil dibuat |
| `400` | Bad Request | Validasi gagal, input tidak valid |
| `401` | Unauthorized | Email/password salah saat login |
| `403` | Forbidden | Akun dinonaktifkan / tidak punya akses |
| `404` | Not Found | Data tidak ditemukan |
| `409` | Conflict | Data duplikat (email sudah terdaftar, tiket sudah diklaim) |
| `500` | Server Error | Kesalahan internal server |

### Referensi Nilai (Enum)

#### User Roles

| Nilai | Deskripsi |
|-------|-----------|
| `USER` | User biasa. Bisa membuat tiket dan chat pada tiket sendiri |
| `STAFF` | IT Staff. Bisa klaim tiket, set pending, resolve tiket |
| `MANAGER` | Manager. Bisa kelola semua tiket, assign staff, tutup tiket, kelola user |

#### Ticket Status

| Nilai | Label Indonesia | Deskripsi |
|-------|-----------------|-----------|
| `OPEN` | Terbuka | Tiket baru, belum ada staff yang menangani |
| `IN_PROGRESS` | Diproses | Sedang ditangani oleh staff |
| `PENDING` | Tertunda | Menunggu vendor/pihak ketiga |
| `RESOLVED` | Selesai | Staff sudah memberikan solusi, menunggu manager menutup |
| `CLOSED` | Ditutup | Tiket selesai dan ditutup oleh manager |

#### Ticket Status Flow (Alur Transisi)

```
OPEN ──> IN_PROGRESS ──> PENDING
  │           │              │
  │           │              ▼
  │           │         IN_PROGRESS (kembali)
  │           │              │
  │           ▼              ▼
  │       RESOLVED ◄── IN_PROGRESS
  │           │
  ▼           ▼
CLOSED <── RESOLVED
```

**Alur utama:** `OPEN → IN_PROGRESS → RESOLVED → CLOSED`  
**Dengan pending:** `OPEN → IN_PROGRESS → PENDING → IN_PROGRESS → RESOLVED → CLOSED`

- **Staff** bisa: `IN_PROGRESS → PENDING`, `IN_PROGRESS → RESOLVED`
- **Staff TIDAK bisa** resolve langsung dari PENDING (harus kembali ke IN_PROGRESS dulu)
- **Manager** bisa: semua transisi sesuai diagram di atas (termasuk PENDING → IN_PROGRESS)

#### Difficulty Level (Tingkat Kesulitan)

| Nilai | Label | Poin yang Diberikan |
|-------|-------|---------------------|
| `1` | Mudah | 10 poin |
| `2` | Sedang | 20 poin |
| `3` | Sulit | 30 poin |

> Poin diberikan otomatis ke staff saat Manager menutup tiket (status → CLOSED).

#### Kategori Tiket

Kategori yang tersedia di sistem:

| Nama | Deskripsi |
|------|-----------|
| `Account` | Masalah terkait akun, login, hak akses |
| `Hardware` | Masalah perangkat keras (printer, PC, monitor, dll) |
| `Network` | Masalah jaringan, internet, WiFi, VPN |
| `Software` | Masalah aplikasi, sistem operasi, update |
| `Other` | Masalah lain yang tidak termasuk kategori di atas |

> Untuk mendapatkan `category_id` yang dibutuhkan saat membuat tiket, panggil `GET /api/v1/categories` terlebih dahulu.

---

## Health Check

Gunakan endpoint ini untuk mengecek apakah API berjalan.

```
GET /api/v1
```

**Response (200):**
```json
{
  "error": false,
  "message": "IT Helpdesk REST API v1 is running"
}
```

---

## 1. Auth (Autentikasi)

### 1.1 Login

Masuk ke sistem dengan email dan password.

```
POST /api/v1/auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "admin@helpdesk.local",
  "password": "admin123"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `email` | string | Ya | Email yang terdaftar |
| `password` | string | Ya | Password akun |

**Success Response (200):**
```json
{
  "error": false,
  "data": {
    "id": "a4f54394-bd7d-44e6-a9fd-749fb9928204",
    "name": "Super Admin",
    "email": "admin@helpdesk.local",
    "phone": null,
    "role": "MANAGER",
    "is_active": true,
    "created_at": "2026-04-21T15:07:10.123Z",
    "updated_at": "2026-04-21T15:07:10.123Z"
  }
}
```

> **Penting:** Simpan `id` dan `role` dari response ini. Anda akan membutuhkan `id` sebagai `user_id` atau `staff_id` di endpoint lain.

**Error Response (401):**
```json
{ "error": true, "message": "Email atau password salah" }
```

**Error Response (403) -- Akun dinonaktifkan:**
```json
{ "error": true, "message": "Akun Anda telah dinonaktifkan. Hubungi administrator." }
```

**Error Response (400) -- Validasi:**
```json
{ "error": true, "message": "Format email tidak valid" }
```

---

### 1.2 Register

Daftarkan akun baru. Akun yang dibuat otomatis mendapat role `USER`.

```
POST /api/v1/auth/register
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Budi Santoso",
  "email": "budi@perusahaan.com",
  "phone": "08123456789",
  "password": "password123"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `name` | string | Ya | Nama lengkap (2-100 karakter) |
| `email` | string | Ya | Email valid, harus unik |
| `phone` | string | Tidak | Nomor WhatsApp, contoh: `08123456789` atau `628123456789` |
| `password` | string | Ya | Password (6-100 karakter) |

**Success Response (201):**
```json
{
  "error": false,
  "data": {
    "id": "uuid-baru",
    "name": "Budi Santoso",
    "email": "budi@perusahaan.com",
    "phone": "08123456789",
    "role": "USER",
    "is_active": true,
    "created_at": "2026-04-22T10:00:00.000Z"
  }
}
```

**Error Response (409):**
```json
{ "error": true, "message": "Email sudah terdaftar" }
```

---

## 2. Categories (Kategori)

### 2.1 List Semua Kategori

Ambil daftar semua kategori tiket. **Panggil ini dulu** sebelum membuat tiket untuk mendapatkan `category_id`.

```
GET /api/v1/categories
```

**Success Response (200):**
```json
{
  "error": false,
  "data": [
    {
      "id": "0fa69525-048d-410e-964a-74e9e91c2342",
      "name": "Account",
      "description": "Support for Account issues"
    },
    {
      "id": "0e405668-b47e-4fcc-aa1a-373892dcd6ef",
      "name": "Hardware",
      "description": "Support for Hardware issues"
    },
    {
      "id": "d90bc26c-b77a-4071-b9cc-f624938265ca",
      "name": "Network",
      "description": "Support for Network issues"
    },
    {
      "id": "1f2c57cd-a9d7-4b2c-933c-bf4c1dc9bb17",
      "name": "Other",
      "description": "Support for Other issues"
    },
    {
      "id": "d55ed9fd-96c3-409c-b873-21ba366f595c",
      "name": "Software",
      "description": "Support for Software issues"
    }
  ]
}
```

> **Catatan:** Gunakan nilai `id` dari response ini sebagai `category_id` saat membuat tiket.

---

## 3. Tickets (Tiket)

### 3.1 List Tiket

Ambil daftar tiket dengan filter opsional.

```
GET /api/v1/tickets
```

**Query Parameters (semua opsional):**

| Parameter | Tipe | Contoh | Keterangan |
|-----------|------|--------|------------|
| `status` | string | `OPEN` | Filter berdasarkan status. Nilai: `OPEN`, `IN_PROGRESS`, `PENDING`, `RESOLVED`, `CLOSED` |
| `category_id` | string (UUID) | `0e405668-...` | Filter berdasarkan kategori. Ambil dari `GET /categories` |
| `user_id` | string (UUID) | `728db994-...` | Filter tiket milik user tertentu (pembuat tiket) |
| `staff_id` | string (UUID) | `a82f29aa-...` | Filter tiket yang ditangani staff tertentu |
| `search` | string | `printer` | Cari di judul, kode tiket, dan deskripsi |
| `limit` | number | `10` | Batas jumlah data per halaman (untuk pagination) |
| `offset` | number | `0` | Mulai dari data ke-berapa (untuk pagination) |

**Contoh Request:**
```
GET /api/v1/tickets?status=OPEN&limit=10&offset=0
GET /api/v1/tickets?search=printer&category_id=0e405668-b47e-4fcc-aa1a-373892dcd6ef
GET /api/v1/tickets?user_id=728db994-ee5e-4792-a735-e263ae019e36
```

**Contoh Pagination:**
```
Halaman 1: GET /api/v1/tickets?limit=10&offset=0
Halaman 2: GET /api/v1/tickets?limit=10&offset=10
Halaman 3: GET /api/v1/tickets?limit=10&offset=20
```

**Success Response (200):**
```json
{
  "error": false,
  "data": [
    {
      "id": "753b236a-80c7-48d3-92dc-753e8f09e1ea",
      "code": "TKT-MO9FSJTF-EUYE",
      "title": "Printer lantai 2 error",
      "description": "Printer HP LaserJet di lantai 2 menampilkan error code E-05",
      "status": "OPEN",
      "difficulty_level": 1,
      "resolution_note": null,
      "pending_reason": null,
      "category_id": "0e405668-b47e-4fcc-aa1a-373892dcd6ef",
      "user_id": "728db994-ee5e-4792-a735-e263ae019e36",
      "staff_id": null,
      "created_at": "2026-04-22T08:30:00.000Z",
      "updated_at": "2026-04-22T08:30:00.000Z",
      "category": {
        "id": "0e405668-b47e-4fcc-aa1a-373892dcd6ef",
        "name": "Hardware",
        "description": "Support for Hardware issues"
      },
      "user": {
        "id": "728db994-ee5e-4792-a735-e263ae019e36",
        "name": "dicky",
        "email": "dicky@local.com",
        "role": "USER"
      },
      "staff": null
    }
  ]
}
```

> **Catatan:** `staff` bernilai `null` jika tiket belum diklaim/ditugaskan.

---

### 3.2 Detail Tiket

Ambil detail lengkap satu tiket beserta daftar attachment.

```
GET /api/v1/tickets/:id
```

| Parameter | Lokasi | Keterangan |
|-----------|--------|------------|
| `id` | URL path | UUID tiket, contoh: `753b236a-80c7-48d3-92dc-753e8f09e1ea` |

**Contoh:** `GET /api/v1/tickets/753b236a-80c7-48d3-92dc-753e8f09e1ea`

**Success Response (200):**
```json
{
  "error": false,
  "data": {
    "id": "753b236a-...",
    "code": "TKT-MO9FSJTF-EUYE",
    "title": "Printer lantai 2 error",
    "description": "Printer HP LaserJet di lantai 2 menampilkan error code E-05",
    "status": "IN_PROGRESS",
    "difficulty_level": 2,
    "resolution_note": null,
    "pending_reason": null,
    "category": { "id": "...", "name": "Hardware", "description": "..." },
    "user": { "id": "...", "name": "dicky", "email": "dicky@local.com", "role": "USER" },
    "staff": { "id": "...", "name": "IT Support Staff", "email": "staff@helpdesk.local", "role": "STAFF" },
    "attachments": [
      {
        "id": "uuid-attachment",
        "filename": "foto-error.jpg",
        "filepath": "/api/uploads/753b236a-.../1713770000-abc123.jpg",
        "filetype": "image/jpeg",
        "filesize": 245000,
        "created_at": "2026-04-22T08:30:00.000Z"
      }
    ]
  }
}
```

**Error Response (404):**
```json
{ "error": true, "message": "Tiket tidak ditemukan" }
```

---

### 3.3 Buat Tiket Baru

Membuat tiket baru. Hanya user dengan role `USER` yang seharusnya membuat tiket.

```
POST /api/v1/tickets
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Printer lantai 2 error",
  "description": "Printer HP LaserJet di lantai 2 menampilkan error code E-05. Sudah coba restart tapi tetap error.",
  "category_id": "0e405668-b47e-4fcc-aa1a-373892dcd6ef",
  "user_id": "728db994-ee5e-4792-a735-e263ae019e36"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `title` | string | Ya | Judul tiket (5-200 karakter) |
| `description` | string | Ya | Deskripsi masalah (10-5000 karakter) |
| `category_id` | string (UUID) | Ya | ID kategori. Ambil dari `GET /api/v1/categories` |
| `user_id` | string (UUID) | Ya | ID user yang membuat tiket. Ambil dari response login |

> **Cara mendapatkan `category_id`:** Panggil `GET /api/v1/categories` dulu, lalu gunakan `id` dari kategori yang dipilih user.

**Success Response (201):**
```json
{
  "error": false,
  "data": {
    "id": "uuid-tiket-baru",
    "code": "TKT-MO9XXXXX-YYYY",
    "title": "Printer lantai 2 error",
    "description": "...",
    "status": "OPEN",
    "difficulty_level": 1,
    "category_id": "0e405668-...",
    "user_id": "728db994-...",
    "staff_id": null,
    "created_at": "2026-04-22T10:00:00.000Z"
  }
}
```

---

### 3.4 Klaim Tiket (Staff)

Staff mengambil tiket yang berstatus `OPEN` untuk ditangani. Status otomatis berubah ke `IN_PROGRESS`.

```
POST /api/v1/tickets/:id/claim
Content-Type: application/json
```

**Request Body:**
```json
{
  "staff_id": "a82f29aa-b7f9-4c0c-b8d0-991fe664dce2"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `staff_id` | string (UUID) | Ya | ID staff yang mengklaim. Ambil dari response login |

**Success Response (200):** Data tiket yang sudah di-update (status: `IN_PROGRESS`, staff_id terisi).

**Error Response (400):**
```json
{ "error": true, "message": "Hanya tiket OPEN yang dapat diklaim" }
```

**Error Response (409):**
```json
{ "error": true, "message": "Tiket sudah diklaim oleh staff lain" }
```

---

### 3.5 Lepas Tiket / Unclaim (Staff)

Staff melepas tiket yang sudah diklaim. Tiket kembali ke status `OPEN` dan bisa diklaim staff lain.

```
POST /api/v1/tickets/:id/unclaim
Content-Type: application/json
```

**Request Body:**
```json
{
  "staff_id": "a82f29aa-b7f9-4c0c-b8d0-991fe664dce2",
  "unclaim_reason": "Saya tidak memiliki keahlian untuk menangani masalah jaringan ini"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `staff_id` | string (UUID) | Ya | ID staff yang melepas (harus staff yang sedang menangani) |
| `unclaim_reason` | string | Ya | Alasan melepas tiket (5-2000 karakter) |

**Error Response (403):**
```json
{ "error": true, "message": "Anda bukan staff yang ditugaskan" }
```

**Error Response (400):**
```json
{ "error": true, "message": "Hanya tiket IN_PROGRESS yang dapat dilepas" }
```

---

### 3.6 Assign Staff (Manager)

Manager menugaskan tiket ke staff tertentu.

```
POST /api/v1/tickets/:id/assign
Content-Type: application/json
```

**Request Body:**
```json
{
  "staff_id": "a82f29aa-b7f9-4c0c-b8d0-991fe664dce2"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `staff_id` | string (UUID) | Ya | ID staff tujuan. Ambil dari `GET /api/v1/tickets/staff-list` |

> **Cara mendapatkan `staff_id`:** Panggil `GET /api/v1/tickets/staff-list` untuk melihat daftar staff yang tersedia.

---

### 3.7 Ubah Status (Manager)

Manager mengubah status tiket sesuai alur yang diizinkan.

```
PATCH /api/v1/tickets/:id/status
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "CLOSED"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `status` | string | Ya | Status baru. Nilai: `OPEN`, `IN_PROGRESS`, `PENDING`, `RESOLVED`, `CLOSED` |

> **Penting:** Tidak semua transisi diizinkan. Lihat diagram alur status di bagian atas dokumen ini.

> **Saat status diubah ke `CLOSED`:** Sistem otomatis memberikan poin ke staff yang menangani (poin = 10 × difficulty_level).

**Error Response (400):**
```json
{ "error": true, "message": "Tidak dapat mengubah status dari OPEN ke RESOLVED" }
```

---

### 3.8 Set Pending (Staff)

Staff mengubah tiket ke status `PENDING` (menunggu vendor/pihak ketiga). Hanya bisa dari status `IN_PROGRESS`.

> **Penting:** Setelah tiket di-pending, tiket harus dikembalikan ke `IN_PROGRESS` oleh Manager sebelum bisa di-resolve oleh Staff.

```
PATCH /api/v1/tickets/:id/pending
Content-Type: application/json
```

**Request Body:**
```json
{
  "staff_id": "a82f29aa-b7f9-4c0c-b8d0-991fe664dce2",
  "pending_reason": "Menunggu sparepart printer dari vendor, estimasi 3 hari kerja"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `staff_id` | string (UUID) | Ya | ID staff yang menangani (harus staff yang ditugaskan) |
| `pending_reason` | string | Ya | Alasan pending (5-2000 karakter) |

---

### 3.9 Resolve Tiket (Staff)

Staff menyelesaikan tiket dengan memberikan arahan/solusi. **Hanya bisa dari status `IN_PROGRESS`**. Jika tiket sedang `PENDING`, harus diubah ke `IN_PROGRESS` terlebih dahulu oleh Manager.

```
PATCH /api/v1/tickets/:id/resolve
Content-Type: application/json
```

**Request Body:**
```json
{
  "staff_id": "a82f29aa-b7f9-4c0c-b8d0-991fe664dce2",
  "resolution_note": "Printer sudah diganti cartridge baru dan berfungsi normal. Pastikan gunakan kertas A4 70gsm untuk menghindari paper jam."
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `staff_id` | string (UUID) | Ya | ID staff yang menangani (harus staff yang ditugaskan) |
| `resolution_note` | string | Ya | Arahan/solusi yang diberikan (10-5000 karakter) |

---

### 3.10 Set Difficulty (Tingkat Kesulitan) -- Manager Only

Mengatur tingkat kesulitan tiket. **Hanya Manager** yang dapat mengatur ini. Ini menentukan berapa poin yang diberikan saat tiket ditutup.

```
PATCH /api/v1/tickets/:id/difficulty
Content-Type: application/json
```

**Request Body:**
```json
{
  "difficulty_level": 2
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `difficulty_level` | number | Ya | `1` = Mudah (10 poin), `2` = Sedang (20 poin), `3` = Sulit (30 poin) |

---

### 3.11 List Staff (untuk Assign)

Ambil daftar staff dan manager yang aktif. Gunakan untuk mengisi dropdown "Assign Staff".

```
GET /api/v1/tickets/staff-list
```

**Success Response (200):**
```json
{
  "error": false,
  "data": [
    {
      "id": "a82f29aa-b7f9-4c0c-b8d0-991fe664dce2",
      "name": "IT Support Staff",
      "email": "staff@helpdesk.local",
      "role": "STAFF"
    },
    {
      "id": "acfbf981-435c-4515-825c-cf5b6d4a7b07",
      "name": "Staff 2",
      "email": "staff2@helpdesk.local",
      "role": "STAFF"
    },
    {
      "id": "a4f54394-bd7d-44e6-a9fd-749fb9928204",
      "name": "Super Admin",
      "email": "admin@helpdesk.local",
      "role": "MANAGER"
    }
  ]
}
```

---

## 4. Chat (Pesan per Tiket)

### 4.1 Get Pesan Chat

Ambil semua pesan chat pada tiket tertentu, diurutkan dari yang paling lama.

```
GET /api/v1/chat/:ticketId
```

| Parameter | Lokasi | Keterangan |
|-----------|--------|------------|
| `ticketId` | URL path | UUID tiket |

**Contoh:** `GET /api/v1/chat/753b236a-80c7-48d3-92dc-753e8f09e1ea`

**Success Response (200):**
```json
{
  "error": false,
  "data": [
    {
      "id": "uuid-pesan-1",
      "message": "Halo, printer saya error E-05",
      "attachment_url": null,
      "attachment_type": null,
      "is_voice_note": false,
      "ticket_id": "753b236a-...",
      "sender_id": "728db994-...",
      "created_at": "2026-04-22T08:35:00.000Z",
      "sender_name": "dicky",
      "sender_role": "USER"
    },
    {
      "id": "uuid-pesan-2",
      "message": "Baik, saya akan cek printer tersebut. Bisa kirim foto error-nya?",
      "attachment_url": null,
      "attachment_type": null,
      "is_voice_note": false,
      "ticket_id": "753b236a-...",
      "sender_id": "a82f29aa-...",
      "created_at": "2026-04-22T08:40:00.000Z",
      "sender_name": "IT Support Staff",
      "sender_role": "STAFF"
    }
  ]
}
```

---

### 4.2 Kirim Pesan Chat

Kirim pesan baru ke chat tiket.

```
POST /api/v1/chat/:ticketId
Content-Type: application/json
```

| Parameter | Lokasi | Keterangan |
|-----------|--------|------------|
| `ticketId` | URL path | UUID tiket |

**Request Body:**
```json
{
  "sender_id": "a82f29aa-b7f9-4c0c-b8d0-991fe664dce2",
  "message": "Baik, saya akan cek printer tersebut sekarang."
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `sender_id` | string (UUID) | Ya | ID user yang mengirim pesan. Ambil dari response login |
| `message` | string | Ya | Isi pesan (1-2000 karakter) |

**Success Response (201):**
```json
{
  "error": false,
  "data": {
    "id": "uuid-pesan-baru",
    "message": "Baik, saya akan cek printer tersebut sekarang.",
    "attachment_url": null,
    "attachment_type": null,
    "is_voice_note": false,
    "ticket_id": "753b236a-...",
    "sender_id": "a82f29aa-...",
    "created_at": "2026-04-22T09:00:00.000Z",
    "sender_name": "IT Support Staff",
    "sender_role": "STAFF"
  }
}
```

---

## 5. Users (Kelola User -- Manager)

### 5.1 List Semua User

Ambil daftar semua user beserta statistik tiket.

```
GET /api/v1/users
```

**Success Response (200):**
```json
{
  "error": false,
  "data": [
    {
      "id": "728db994-ee5e-4792-a735-e263ae019e36",
      "name": "dicky",
      "email": "dicky@local.com",
      "phone": null,
      "role": "USER",
      "is_active": true,
      "created_at": "2026-04-21T...",
      "tickets_created": 3,
      "tickets_handled": 0
    },
    {
      "id": "a82f29aa-b7f9-4c0c-b8d0-991fe664dce2",
      "name": "IT Support Staff",
      "email": "staff@helpdesk.local",
      "phone": "08111222333",
      "role": "STAFF",
      "is_active": true,
      "created_at": "2026-04-21T...",
      "tickets_created": 0,
      "tickets_handled": 5
    }
  ]
}
```

---

### 5.2 Detail User

```
GET /api/v1/users/:id
```

---

### 5.3 Buat User Baru (Manager)

Manager membuat akun user atau staff baru.

```
POST /api/v1/users
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Staff IT Baru",
  "email": "staff.baru@perusahaan.com",
  "phone": "08999888777",
  "password": "password123",
  "role": "STAFF"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `name` | string | Ya | Nama lengkap (2-100 karakter) |
| `email` | string | Ya | Email valid, harus unik |
| `phone` | string | Tidak | Nomor WhatsApp |
| `password` | string | Ya | Password (6-100 karakter) |
| `role` | string | Ya | `USER` atau `STAFF` (Manager tidak bisa membuat Manager lain) |

---

### 5.4 Update User

```
PUT /api/v1/users/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Nama Baru",
  "email": "email.baru@perusahaan.com",
  "phone": "08111222333",
  "role": "STAFF"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `name` | string | Ya | Nama lengkap (2-100 karakter) |
| `email` | string | Ya | Email valid |
| `phone` | string | Tidak | Nomor WhatsApp |
| `role` | string | Ya | `USER`, `STAFF`, atau `MANAGER` |

---

### 5.5 Aktifkan / Nonaktifkan User

Toggle status aktif user. User yang dinonaktifkan tidak bisa login.

```
PATCH /api/v1/users/:id/toggle-active
```

> Tidak perlu request body. Endpoint ini otomatis membalik status `is_active` (true → false, false → true).

**Success Response (200):**
```json
{
  "error": false,
  "data": {
    "id": "728db994-...",
    "name": "dicky",
    "email": "dicky@local.com",
    "is_active": false
  }
}
```

> **Catatan:** Saat user dinonaktifkan, semua sesi login aktifnya otomatis dihapus.

---

## 6. Leaderboard (Peringkat Staff)

### 6.1 Ranking Staff

Ambil peringkat staff berdasarkan poin, diurutkan dari yang tertinggi.

```
GET /api/v1/leaderboard
```

**Query Parameters:**

| Parameter | Tipe | Default | Keterangan |
|-----------|------|---------|------------|
| `view` | string | `monthly` | Mode tampilan: `monthly` (bulanan) atau `yearly` (tahunan) |
| `month` | number | bulan ini | Bulan (1-12). Hanya digunakan jika `view=monthly` |
| `year` | number | tahun ini | Tahun, contoh: `2026` |

**Contoh:**
```
GET /api/v1/leaderboard?view=monthly&month=4&year=2026
GET /api/v1/leaderboard?view=yearly&year=2026
```

**Success Response (200):**
```json
{
  "error": false,
  "data": [
    {
      "staff_id": "a82f29aa-...",
      "staff_name": "IT Support Staff",
      "staff_email": "staff@helpdesk.local",
      "total_points": 50,
      "tickets_closed": 3
    },
    {
      "staff_id": "acfbf981-...",
      "staff_name": "Staff 2",
      "staff_email": "staff2@helpdesk.local",
      "total_points": 20,
      "tickets_closed": 1
    }
  ]
}
```

---

### 6.2 Detail Stats Staff

Ambil statistik detail seorang staff beserta riwayat poin tiket.

```
GET /api/v1/leaderboard/:staffId
```

**Query Parameters:** Sama seperti ranking (`view`, `month`, `year`).

**Contoh:** `GET /api/v1/leaderboard/a82f29aa-...?view=monthly&month=4&year=2026`

**Success Response (200):**
```json
{
  "error": false,
  "data": {
    "id": "a82f29aa-...",
    "name": "IT Support Staff",
    "email": "staff@helpdesk.local",
    "total_points": 50,
    "tickets_closed": 3,
    "avg_difficulty": "1.7",
    "logs": [
      {
        "id": "uuid-log",
        "points": 20,
        "created_at": "2026-04-22T...",
        "ticket": {
          "id": "uuid-tiket",
          "code": "TKT-MO9G0B44-LVE6",
          "title": "Printer error",
          "difficulty_level": 2
        }
      }
    ]
  }
}
```

---

### 6.3 Periode Tersedia

Ambil daftar bulan/tahun yang memiliki data leaderboard.

```
GET /api/v1/leaderboard/periods
```

**Success Response (200):**
```json
{
  "error": false,
  "data": [
    { "period_month": 4, "period_year": 2026 },
    { "period_month": 3, "period_year": 2026 }
  ]
}
```

> Gunakan data ini untuk mengisi dropdown filter bulan/tahun di frontend.

---

## 7. Profile (Profil User)

### 7.1 Get Profil

```
GET /api/v1/profile/:userId
```

| Parameter | Lokasi | Keterangan |
|-----------|--------|------------|
| `userId` | URL path | UUID user. Ambil dari response login |

**Success Response (200):**
```json
{
  "error": false,
  "data": {
    "id": "728db994-...",
    "name": "dicky",
    "email": "dicky@local.com",
    "phone": "08123456789",
    "role": "USER",
    "is_active": true,
    "created_at": "2026-04-21T..."
  }
}
```

---

### 7.2 Update Profil

```
PUT /api/v1/profile/:userId
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Dicky Updated",
  "email": "dicky.new@local.com",
  "phone": "08999888777"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `name` | string | Ya | Nama lengkap (2-100 karakter) |
| `email` | string | Ya | Email valid, harus unik |
| `phone` | string | Tidak | Nomor WhatsApp |

---

### 7.3 Ganti Password

```
PUT /api/v1/profile/:userId/password
Content-Type: application/json
```

**Request Body:**
```json
{
  "current_password": "password123",
  "new_password": "passwordbaru456"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `current_password` | string | Ya | Password saat ini (untuk verifikasi) |
| `new_password` | string | Ya | Password baru (6-100 karakter) |

**Success Response (200):**
```json
{ "error": false, "message": "Password berhasil diubah" }
```

**Error Response (400):**
```json
{ "error": true, "message": "Password saat ini salah" }
```

---

## Contoh Alur Lengkap (Frontend)

Berikut contoh alur penggunaan API dari awal sampai akhir:

### 1. User Login
```
POST /api/v1/auth/login
Body: { "email": "dicky@local.com", "password": "password123" }
→ Simpan response.data.id sebagai userId, response.data.role sebagai userRole
```

### 2. User Membuat Tiket
```
GET /api/v1/categories
→ Tampilkan sebagai dropdown, simpan id kategori yang dipilih

POST /api/v1/tickets
Body: { "title": "...", "description": "...", "category_id": "id-dari-dropdown", "user_id": "userId-dari-login" }
```

### 3. Staff Login & Klaim Tiket
```
POST /api/v1/auth/login
Body: { "email": "staff@helpdesk.local", "password": "staff123" }

GET /api/v1/tickets?status=OPEN
→ Tampilkan daftar tiket yang bisa diklaim

POST /api/v1/tickets/{ticketId}/claim
Body: { "staff_id": "staffId-dari-login" }
```

### 4. Staff Chat & Resolve
```
POST /api/v1/chat/{ticketId}
Body: { "sender_id": "staffId", "message": "Saya sedang cek masalahnya" }

(Opsional) Staff pending tiket:
PATCH /api/v1/tickets/{ticketId}/pending
Body: { "staff_id": "staffId", "pending_reason": "Menunggu sparepart" }

(Jika pending) Manager kembalikan ke IN_PROGRESS:
PATCH /api/v1/tickets/{ticketId}/status
Body: { "status": "IN_PROGRESS" }

Staff resolve tiket (harus dari IN_PROGRESS):
PATCH /api/v1/tickets/{ticketId}/resolve
Body: { "staff_id": "staffId", "resolution_note": "Sudah diperbaiki, caranya..." }
```

### 5. Manager Set Difficulty & Tutup Tiket
```
PATCH /api/v1/tickets/{ticketId}/difficulty
Body: { "difficulty_level": 2 }
→ Hanya Manager yang bisa set difficulty

PATCH /api/v1/tickets/{ticketId}/status
Body: { "status": "CLOSED" }
→ Poin otomatis diberikan ke staff (10 × difficulty)

GET /api/v1/leaderboard?view=monthly&month=4&year=2026
→ Tampilkan ranking staff
```
