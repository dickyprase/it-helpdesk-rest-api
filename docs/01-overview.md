# Overview

Selamat datang di dokumentasi **IT Helpdesk REST API**. API ini menyediakan akses ke seluruh fitur sistem IT Helpdesk.

## Base URL

```
http://localhost:3001/api/v1
```

## Autentikasi (Session Token)

API ini menggunakan **Bearer Token** berbasis session. Alur:

1. **Login** → dapat `token` dari response
2. **Simpan token** di frontend (localStorage / state)
3. **Kirim token** di setiap request via header `Authorization`

```
Authorization: Bearer <token-dari-login>
```

**Contoh fetch JavaScript:**
```javascript
const token = localStorage.getItem('token');

const res = await fetch('http://localhost:3001/api/v1/tickets', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

> Token berlaku **7 hari**. Setelah expired, user harus login ulang.

### Endpoint Tanpa Auth

Hanya 2 endpoint yang bisa diakses tanpa token:

| Endpoint | Keterangan |
|----------|------------|
| `POST /api/v1/auth/login` | Login |
| `POST /api/v1/auth/register` | Register |

Semua endpoint lain **wajib** menyertakan token.

## Format Response

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

## HTTP Status Codes

| Code | Arti | Kapan Muncul |
|------|------|--------------|
| `200` | OK | Request berhasil |
| `201` | Created | Data baru berhasil dibuat |
| `400` | Bad Request | Validasi gagal, input tidak valid |
| `401` | Unauthorized | Token tidak ada, tidak valid, atau expired |
| `403` | Forbidden | Akun dinonaktifkan / role tidak sesuai |
| `404` | Not Found | Data tidak ditemukan |
| `409` | Conflict | Data duplikat (email sudah terdaftar, tiket sudah diklaim) |
| `500` | Server Error | Kesalahan internal server |

## Referensi Nilai (Enum)

### User Roles

| Nilai | Deskripsi |
|-------|-----------|
| `USER` | User biasa. Bisa membuat tiket dan chat pada tiket sendiri |
| `STAFF` | IT Staff. Bisa klaim tiket, set pending, resolve tiket |
| `MANAGER` | Manager. Bisa kelola semua tiket, assign staff, tutup tiket, kelola user, set difficulty |

### Ticket Status

| Nilai | Label | Deskripsi |
|-------|-------|-----------|
| `OPEN` | Terbuka | Tiket baru, belum ada staff yang menangani |
| `IN_PROGRESS` | Diproses | Sedang ditangani oleh staff |
| `PENDING` | Tertunda | Menunggu vendor/pihak ketiga |
| `RESOLVED` | Selesai | Staff sudah memberikan solusi |
| `CLOSED` | Ditutup | Tiket selesai dan ditutup oleh manager |

### Difficulty Level

| Nilai | Label | Poin |
|-------|-------|------|
| `1` | Mudah | 10 poin |
| `2` | Sedang | 20 poin |
| `3` | Sulit | 30 poin |

> Hanya **Manager** yang bisa mengatur difficulty. Poin diberikan otomatis ke staff saat tiket ditutup.

### Kategori Tiket

| Nama | Deskripsi |
|------|-----------|
| `Account` | Masalah terkait akun, login, hak akses |
| `Hardware` | Masalah perangkat keras (printer, PC, monitor, dll) |
| `Network` | Masalah jaringan, internet, WiFi, VPN |
| `Software` | Masalah aplikasi, sistem operasi, update |
| `Other` | Masalah lain yang tidak termasuk kategori di atas |

> Untuk mendapatkan `category_id`, panggil `GET /api/v1/categories` terlebih dahulu.

## Health Check

```
GET /api/v1
```

**Response:**
```json
{
  "error": false,
  "message": "IT Helpdesk REST API v1 is running"
}
```
