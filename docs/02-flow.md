# Alur Aplikasi

## Flowchart Sistem

![Flowchart IT Helpdesk](/docs/images/flowchart.jpg)

---

## Ticket Status Flow

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

**Alur utama:**
```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
```

**Dengan pending:**
```
OPEN → IN_PROGRESS → PENDING → IN_PROGRESS → RESOLVED → CLOSED
```

### Siapa Bisa Apa?

| Aksi | USER | STAFF | MANAGER |
|------|------|-------|---------|
| Buat tiket | ✅ | ❌ | ❌ |
| Klaim tiket OPEN | ❌ | ✅ | ✅ |
| Lepas tiket (unclaim) | ❌ | ✅ (tiket sendiri) | ❌ |
| Set pending | ❌ | ✅ (tiket sendiri) | ❌ |
| Resolve tiket | ❌ | ✅ (tiket sendiri, dari IN_PROGRESS) | ❌ |
| Assign staff | ❌ | ❌ | ✅ |
| Ubah status | ❌ | ❌ | ✅ |
| Set difficulty | ❌ | ❌ | ✅ |
| Tutup tiket | ❌ | ❌ | ✅ |
| Chat pada tiket | ✅ (tiket sendiri) | ✅ (tiket yang ditangani) | ✅ (semua tiket) |
| Lihat leaderboard | ❌ | ✅ | ✅ |
| Kelola user | ❌ | ❌ | ✅ |

### Aturan Penting

1. **PENDING → RESOLVED tidak bisa langsung.** Staff harus minta Manager mengubah status ke IN_PROGRESS dulu, baru bisa resolve.
2. **Poin diberikan saat CLOSED.** Saat Manager menutup tiket, sistem otomatis memberi poin ke staff (10 × difficulty_level).
3. **Difficulty hanya oleh Manager.** Staff tidak bisa melihat atau mengubah tingkat kesulitan.
4. **USER hanya lihat tiket sendiri.** Endpoint GET tickets otomatis difilter berdasarkan user yang login.

## Alur Lengkap (Step by Step)

### 1. User Login & Buat Tiket
```
POST /api/v1/auth/login
Body: { "email": "user@email.com", "password": "password123" }
→ Simpan response.data.token di localStorage

GET /api/v1/categories
Headers: { Authorization: "Bearer <token>" }
→ Tampilkan sebagai dropdown

POST /api/v1/tickets
Headers: { Authorization: "Bearer <token>" }
Body: {
  "title": "Printer error",
  "description": "Printer di lantai 2 error code E-05",
  "category_id": "id-dari-dropdown"
}
→ user_id otomatis dari token, tidak perlu dikirim
```

### 2. Staff Login & Klaim Tiket
```
POST /api/v1/auth/login
Body: { "email": "staff@helpdesk.local", "password": "staff123" }
→ Simpan token

GET /api/v1/tickets?status=OPEN
Headers: { Authorization: "Bearer <token>" }
→ Tampilkan daftar tiket yang bisa diklaim

POST /api/v1/tickets/{ticketId}/claim
Headers: { Authorization: "Bearer <token>" }
→ staff_id otomatis dari token
```

### 3. Staff Chat & Tangani Tiket
```
POST /api/v1/chat/{ticketId}
Headers: { Authorization: "Bearer <token>" }
Body: { "message": "Saya sedang cek masalahnya" }
→ sender_id otomatis dari token

(Opsional) Staff pending tiket:
PATCH /api/v1/tickets/{ticketId}/pending
Headers: { Authorization: "Bearer <token>" }
Body: { "pending_reason": "Menunggu sparepart" }

(Jika pending) Manager kembalikan ke IN_PROGRESS:
PATCH /api/v1/tickets/{ticketId}/status
Headers: { Authorization: "Bearer <token-manager>" }
Body: { "status": "IN_PROGRESS" }

Staff resolve tiket (harus dari IN_PROGRESS):
PATCH /api/v1/tickets/{ticketId}/resolve
Headers: { Authorization: "Bearer <token>" }
Body: { "resolution_note": "Sudah diperbaiki..." }
```

### 4. Manager Set Difficulty & Tutup Tiket
```
PATCH /api/v1/tickets/{ticketId}/difficulty
Headers: { Authorization: "Bearer <token-manager>" }
Body: { "difficulty_level": 2 }

PATCH /api/v1/tickets/{ticketId}/status
Headers: { Authorization: "Bearer <token-manager>" }
Body: { "status": "CLOSED" }
→ Poin otomatis diberikan ke staff (10 × difficulty)
```

### 5. Logout
```
POST /api/v1/auth/logout
Headers: { Authorization: "Bearer <token>" }
→ Token dihapus dari database, tidak bisa dipakai lagi
```
