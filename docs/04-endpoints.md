# API Endpoints

Semua endpoint menggunakan prefix `/api/v1`.

**Header wajib untuk endpoint yang butuh auth:**
```
Authorization: Bearer <token-dari-login>
Content-Type: application/json
```

---

## 1. Auth

### POST `/api/v1/auth/login`

Login ke sistem. **Tidak perlu token.**

**Request Body:**
```json
{
  "email": "admin@helpdesk.local",
  "password": "admin123"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `email` | string | Ya | Email terdaftar |
| `password` | string | Ya | Password akun |

**Success (200):**
```json
{
  "error": false,
  "data": {
    "user": {
      "id": "a4f54394-...",
      "name": "Super Admin",
      "email": "admin@helpdesk.local",
      "phone": null,
      "role": "MANAGER",
      "is_active": true,
      "created_at": "2026-04-21T15:07:10.123Z"
    },
    "token": "abc123def456ghi789jkl012mno345pqr678stu901vwx234",
    "expires_at": "2026-04-29T15:07:10.123Z"
  }
}
```

> **Simpan `token`** di localStorage. Gunakan di header `Authorization: Bearer <token>` untuk semua request selanjutnya.

**Error (401):** `{ "error": true, "message": "Email atau password salah" }`

**Error (403):** `{ "error": true, "message": "Akun Anda telah dinonaktifkan" }`

---

### POST `/api/v1/auth/register`

Daftar akun baru (otomatis role `USER`). **Tidak perlu token.** Otomatis login setelah register.

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
| `name` | string | Ya | 2-100 karakter |
| `email` | string | Ya | Email valid, harus unik |
| `phone` | string | Tidak | Nomor WhatsApp |
| `password` | string | Ya | 6-100 karakter |

**Success (201):** Sama seperti login (return user + token).

---

### POST `/api/v1/auth/logout`

Logout dan hapus session. Token tidak bisa dipakai lagi.

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{ "error": false, "message": "Berhasil logout" }
```

---

### GET `/api/v1/auth/me`

Cek siapa user yang sedang login berdasarkan token.

**Headers:** `Authorization: Bearer <token>`

**Success (200):**
```json
{
  "error": false,
  "data": {
    "id": "a4f54394-...",
    "name": "Super Admin",
    "email": "admin@helpdesk.local",
    "phone": null,
    "role": "MANAGER"
  }
}
```

**Error (401):** `{ "error": true, "message": "Token tidak valid atau sudah expired. Silakan login ulang." }`

---

## 2. Categories

**Auth:** Token wajib (semua role)

### GET `/api/v1/categories`

List semua kategori. **Panggil ini dulu** sebelum membuat tiket.

**Success (200):**
```json
{
  "error": false,
  "data": [
    { "id": "0fa69525-...", "name": "Account", "description": "Support for Account issues" },
    { "id": "0e405668-...", "name": "Hardware", "description": "Support for Hardware issues" },
    { "id": "d90bc26c-...", "name": "Network", "description": "Support for Network issues" },
    { "id": "1f2c57cd-...", "name": "Other", "description": "Support for Other issues" },
    { "id": "d55ed9fd-...", "name": "Software", "description": "Support for Software issues" }
  ]
}
```

---

## 3. Tickets

**Auth:** Token wajib. Role-specific per endpoint.

### GET `/api/v1/tickets`

**Role:** Semua. USER otomatis hanya melihat tiket sendiri.

**Query Parameters:**

| Param | Tipe | Contoh | Keterangan |
|-------|------|--------|------------|
| `status` | string | `OPEN` | `OPEN`, `IN_PROGRESS`, `PENDING`, `RESOLVED`, `CLOSED` |
| `category_id` | UUID | `0e405668-...` | Dari `GET /categories` |
| `search` | string | `printer` | Cari di judul, kode, deskripsi |
| `limit` | number | `10` | Pagination: jumlah per halaman |
| `offset` | number | `0` | Pagination: mulai dari data ke-berapa |

> **Catatan:** `user_id` dan `staff_id` filter masih bisa digunakan oleh STAFF/MANAGER. USER tidak perlu kirim `user_id` — otomatis difilter.

---

### GET `/api/v1/tickets/:id`

**Role:** Semua. USER hanya bisa lihat tiket sendiri.

---

### POST `/api/v1/tickets`

**Role:** USER only

**Request Body:**
```json
{
  "title": "Printer lantai 2 error",
  "description": "Printer HP LaserJet error code E-05. Sudah coba restart tapi tetap error.",
  "category_id": "0e405668-b47e-4fcc-aa1a-373892dcd6ef"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `title` | string | Ya | 5-200 karakter |
| `description` | string | Ya | 10-5000 karakter |
| `category_id` | UUID | Ya | Dari `GET /api/v1/categories` |

> `user_id` **tidak perlu dikirim** — otomatis dari token.

---

### POST `/api/v1/tickets/:id/claim`

**Role:** STAFF / MANAGER

Tidak perlu request body. `staff_id` otomatis dari token.

**Error (409):** `{ "error": true, "message": "Tiket sudah diklaim oleh staff lain" }`

---

### POST `/api/v1/tickets/:id/unclaim`

**Role:** STAFF only

**Request Body:**
```json
{
  "unclaim_reason": "Saya tidak memiliki keahlian untuk masalah ini"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `unclaim_reason` | string | Ya | 5-2000 karakter |

> `staff_id` **tidak perlu dikirim** — otomatis dari token. Harus staff yang sedang menangani.

---

### POST `/api/v1/tickets/:id/assign`

**Role:** MANAGER only

**Request Body:**
```json
{ "staff_id": "a82f29aa-..." }
```

> Ambil `staff_id` dari `GET /api/v1/tickets/staff-list`.

---

### PATCH `/api/v1/tickets/:id/status`

**Role:** MANAGER only

**Request Body:**
```json
{ "status": "CLOSED" }
```

> Saat status → `CLOSED`, poin otomatis diberikan ke staff.

---

### PATCH `/api/v1/tickets/:id/pending`

**Role:** STAFF only

**Request Body:**
```json
{
  "pending_reason": "Menunggu sparepart dari vendor, estimasi 3 hari"
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `pending_reason` | string | Ya | 5-2000 karakter |

> Setelah pending, tiket harus dikembalikan ke `IN_PROGRESS` oleh Manager sebelum bisa di-resolve.

---

### PATCH `/api/v1/tickets/:id/resolve`

**Role:** STAFF only. Hanya dari status `IN_PROGRESS`.

**Request Body:**
```json
{
  "resolution_note": "Printer sudah diganti cartridge baru. Gunakan kertas A4 70gsm."
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `resolution_note` | string | Ya | 10-5000 karakter |

---

### PATCH `/api/v1/tickets/:id/difficulty`

**Role:** MANAGER only

**Request Body:**
```json
{ "difficulty_level": 2 }
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `difficulty_level` | number | Ya | `1` (Mudah/10poin), `2` (Sedang/20poin), `3` (Sulit/30poin) |

---

### GET `/api/v1/tickets/staff-list`

**Role:** Semua (untuk dropdown assign)

**Success (200):**
```json
{
  "error": false,
  "data": [
    { "id": "a82f29aa-...", "name": "IT Support Staff", "role": "STAFF" },
    { "id": "a4f54394-...", "name": "Super Admin", "role": "MANAGER" }
  ]
}
```

---

## 4. Chat

**Auth:** Token wajib (semua role)

### GET `/api/v1/chat/:ticketId`

Ambil semua pesan chat pada tiket.

---

### POST `/api/v1/chat/:ticketId`

Kirim pesan chat.

**Request Body:**
```json
{
  "message": "Baik, saya akan cek printer tersebut."
}
```

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| `message` | string | Ya | 1-2000 karakter |

> `sender_id` **tidak perlu dikirim** — otomatis dari token.

---

## 5. Users (Manager Only)

**Auth:** Token wajib + role MANAGER

### GET `/api/v1/users`

List semua user + statistik.

### GET `/api/v1/users/:id`

Detail satu user.

### POST `/api/v1/users`

Buat user baru.

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
| `name` | string | Ya | 2-100 karakter |
| `email` | string | Ya | Harus unik |
| `phone` | string | Tidak | Nomor WhatsApp |
| `password` | string | Ya | 6-100 karakter |
| `role` | string | Ya | `USER` atau `STAFF` |

### PUT `/api/v1/users/:id`

Update user. Tidak bisa edit diri sendiri (gunakan `/profile`).

**Request Body:**
```json
{
  "name": "Nama Baru",
  "email": "email.baru@perusahaan.com",
  "phone": "08111222333",
  "role": "STAFF"
}
```

### PATCH `/api/v1/users/:id/toggle-active`

Toggle aktif/nonaktif. Tidak perlu body. Tidak bisa menonaktifkan diri sendiri.

---

## 6. Leaderboard

**Auth:** Token wajib + role STAFF atau MANAGER

### GET `/api/v1/leaderboard`

**Query Parameters:**

| Param | Default | Keterangan |
|-------|---------|------------|
| `view` | `monthly` | `monthly` atau `yearly` |
| `month` | bulan ini | 1-12 (hanya untuk monthly) |
| `year` | tahun ini | e.g. 2026 |

### GET `/api/v1/leaderboard/periods`

Periode yang memiliki data.

### GET `/api/v1/leaderboard/:staffId`

Detail stats staff + riwayat poin. Query params sama seperti ranking.

---

## 7. Profile

**Auth:** Token wajib. Otomatis mengakses profil user yang login.

### GET `/api/v1/profile`

Ambil profil sendiri. Tidak perlu kirim userId.

### PUT `/api/v1/profile`

Update profil sendiri.

**Request Body:**
```json
{
  "name": "Dicky Updated",
  "email": "dicky.new@local.com",
  "phone": "08999888777"
}
```

### PUT `/api/v1/profile/password`

Ganti password sendiri.

**Request Body:**
```json
{
  "current_password": "password123",
  "new_password": "passwordbaru456"
}
```

**Success (200):** `{ "error": false, "message": "Password berhasil diubah" }`

**Error (400):** `{ "error": true, "message": "Password saat ini salah" }`

---

## Ringkasan Auth per Endpoint

| Endpoint | Method | Auth | Role |
|----------|--------|------|------|
| `/auth/login` | POST | ❌ | Public |
| `/auth/register` | POST | ❌ | Public |
| `/auth/logout` | POST | ✅ | Semua |
| `/auth/me` | GET | ✅ | Semua |
| `/categories` | GET | ✅ | Semua |
| `/tickets` | GET | ✅ | Semua (USER: tiket sendiri) |
| `/tickets/:id` | GET | ✅ | Semua (USER: tiket sendiri) |
| `/tickets` | POST | ✅ | USER |
| `/tickets/:id/claim` | POST | ✅ | STAFF, MANAGER |
| `/tickets/:id/unclaim` | POST | ✅ | STAFF |
| `/tickets/:id/assign` | POST | ✅ | MANAGER |
| `/tickets/:id/status` | PATCH | ✅ | MANAGER |
| `/tickets/:id/pending` | PATCH | ✅ | STAFF |
| `/tickets/:id/resolve` | PATCH | ✅ | STAFF |
| `/tickets/:id/difficulty` | PATCH | ✅ | MANAGER |
| `/tickets/staff-list` | GET | ✅ | Semua |
| `/chat/:ticketId` | GET | ✅ | Semua |
| `/chat/:ticketId` | POST | ✅ | Semua |
| `/users` | GET | ✅ | MANAGER |
| `/users/:id` | GET | ✅ | MANAGER |
| `/users` | POST | ✅ | MANAGER |
| `/users/:id` | PUT | ✅ | MANAGER |
| `/users/:id/toggle-active` | PATCH | ✅ | MANAGER |
| `/leaderboard` | GET | ✅ | STAFF, MANAGER |
| `/leaderboard/periods` | GET | ✅ | STAFF, MANAGER |
| `/leaderboard/:staffId` | GET | ✅ | STAFF, MANAGER |
| `/profile` | GET | ✅ | Semua (diri sendiri) |
| `/profile` | PUT | ✅ | Semua (diri sendiri) |
| `/profile/password` | PUT | ✅ | Semua (diri sendiri) |
