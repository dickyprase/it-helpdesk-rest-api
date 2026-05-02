# Database & ERD

## Download Schema

📥 **[Download schema.sql](/docs/downloads/schema.sql)** — Import langsung ke phpMyAdmin / MySQL / MariaDB

> **Cara import di phpMyAdmin:**
> 1. Buat database baru (misal: `helpdesk`)
> 2. Pilih database tersebut
> 3. Klik tab **"Import"**
> 4. Pilih file `schema.sql` → klik **"Go"**
> 5. Semua tabel + data awal (kategori, template notifikasi) otomatis dibuat

---

## Entity Relationship Diagram

![ERD IT Helpdesk](/docs/images/erd.svg)

## Relasi Antar Tabel

```
User 1──N Ticket     (sebagai pembuat)
User 1──N Ticket     (sebagai staff handler)
User 1──N Chat       (sebagai pengirim)
User 1──N LeaderboardLog
User 1──N Session
Category 1──N Ticket
Ticket 1──N Chat
Ticket 1──N TicketAttachment (cascade delete)
Ticket 1──N LeaderboardLog
WA_Setting (standalone, 1 row)
Notification_Template (standalone, 1 row per event_type)
```

---

## Tabel Detail

### User

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | Auto-generated |
| `name` | String | NOT NULL | Nama lengkap |
| `email` | String | UNIQUE, NOT NULL | Email login |
| `phone` | String | nullable | Nomor WhatsApp (08xx / 628xx) |
| `password_hash` | String | NOT NULL | bcrypt hash |
| `role` | Enum | NOT NULL, default `USER` | `USER`, `STAFF`, `MANAGER` |
| `is_active` | Boolean | default `true` | User nonaktif tidak bisa login |
| `created_at` | DateTime | auto | |
| `updated_at` | DateTime | auto | |

### Session

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | String | PK | Random 64-char hex |
| `user_id` | UUID | FK → User | CASCADE delete |
| `expires_at` | DateTime | NOT NULL | 7 hari dari pembuatan |

### Category

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | Auto-generated |
| `name` | String | UNIQUE | Account, Hardware, Network, Software, Other |
| `description` | String | nullable | |

### Ticket

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | Auto-generated |
| `code` | String | UNIQUE | Format: `TKT-XXXXX-XXXX` |
| `title` | String | NOT NULL | 5-200 karakter |
| `description` | String | NOT NULL | 10-5000 karakter |
| `status` | Enum | NOT NULL, default `OPEN` | `OPEN`, `IN_PROGRESS`, `PENDING`, `RESOLVED`, `CLOSED` |
| `difficulty_level` | Int | default `1` | 1 (Mudah), 2 (Sedang), 3 (Sulit). Hanya Manager |
| `resolution_note` | Text | nullable | Arahan/solusi dari staff |
| `pending_reason` | Text | nullable | Alasan pending |
| `category_id` | UUID | FK → Category | Index |
| `user_id` | UUID | FK → User | Pembuat tiket |
| `staff_id` | UUID | FK → User, nullable | Staff yang menangani |
| `created_at` | DateTime | auto | Index |
| `updated_at` | DateTime | auto | |

### TicketAttachment

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | |
| `filename` | String | NOT NULL | Nama file asli |
| `filepath` | String | NOT NULL | Path untuk serving |
| `filetype` | String | NOT NULL | MIME type |
| `filesize` | Int | NOT NULL | Bytes |
| `ticket_id` | UUID | FK → Ticket | CASCADE delete |
| `uploaded_by` | String | NOT NULL | User ID uploader |
| `created_at` | DateTime | auto | |

### Chat

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | |
| `message` | String | NOT NULL | 1-2000 karakter |
| `attachment_url` | String | nullable | Path file |
| `attachment_type` | String | nullable | MIME type |
| `is_voice_note` | Boolean | default `false` | |
| `ticket_id` | UUID | FK → Ticket | Index |
| `sender_id` | UUID | FK → User | Index |
| `created_at` | DateTime | auto | |

### LeaderboardLog

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | |
| `points` | Int | NOT NULL | 10 × difficulty_level |
| `period_month` | Int | NOT NULL | 1-12 |
| `period_year` | Int | NOT NULL | e.g. 2026 |
| `staff_id` | UUID | FK → User | Index |
| `ticket_id` | UUID | FK → Ticket | Index |
| `created_at` | DateTime | auto | |

### WA_Setting

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | |
| `is_enabled` | Boolean | default `false` | Toggle notifikasi global |
| `session_data` | Text | nullable | Reserved |
| `connection_status` | String | default `disconnected` | |
| `updated_at` | DateTime | auto | |

### Notification_Template

| Kolom | Tipe | Constraint | Keterangan |
|-------|------|------------|------------|
| `id` | UUID | PK | |
| `event_type` | String | UNIQUE | e.g. `ticket_created` |
| `template_body` | Text | NOT NULL | Mendukung variabel `[nama-user]` dll |
| `variables` | String | NOT NULL | Comma-separated |
| `created_at` | DateTime | auto | |
| `updated_at` | DateTime | auto | |

---

## Scoring System

```
Poin = 10 × difficulty_level

Difficulty 1 (Mudah)  → 10 poin
Difficulty 2 (Sedang) → 20 poin
Difficulty 3 (Sulit)  → 30 poin
```

Poin dicatat di tabel `LeaderboardLog` saat Manager mengubah status tiket ke `CLOSED`. Setiap tiket hanya menghasilkan 1 entry leaderboard (dicek duplikat). Hanya **Manager** yang bisa mengatur difficulty level.
