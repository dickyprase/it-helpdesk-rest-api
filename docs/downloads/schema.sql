-- ============================================================
-- IT Helpdesk Database Schema
-- Kompatibel dengan MySQL / MariaDB / phpMyAdmin
-- 
-- Cara import:
-- 1. Buka phpMyAdmin
-- 2. Buat database baru (misal: helpdesk)
-- 3. Pilih database tersebut
-- 4. Klik tab "Import"
-- 5. Pilih file ini → klik "Go"
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- TABEL: User
-- ============================================================
CREATE TABLE IF NOT EXISTS `User` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20) DEFAULT NULL COMMENT 'Nomor WhatsApp (08xx atau 628xx)',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'bcrypt hash',
  `role` ENUM('USER', 'STAFF', 'MANAGER') NOT NULL DEFAULT 'USER',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: Session
-- ============================================================
CREATE TABLE IF NOT EXISTS `Session` (
  `id` VARCHAR(64) NOT NULL COMMENT 'Token session (random hex)',
  `user_id` CHAR(36) NOT NULL,
  `expires_at` TIMESTAMP NOT NULL,
  PRIMARY KEY (`id`),
  KEY `Session_user_id_idx` (`user_id`),
  KEY `Session_expires_at_idx` (`expires_at`),
  CONSTRAINT `Session_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: Category
-- ============================================================
CREATE TABLE IF NOT EXISTS `Category` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Category_name_key` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: Ticket
-- ============================================================
CREATE TABLE IF NOT EXISTS `Ticket` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `code` VARCHAR(50) NOT NULL COMMENT 'Format: TKT-XXXXX-XXXX',
  `title` VARCHAR(200) NOT NULL,
  `description` TEXT NOT NULL,
  `status` ENUM('OPEN', 'IN_PROGRESS', 'PENDING', 'RESOLVED', 'CLOSED') NOT NULL DEFAULT 'OPEN',
  `difficulty_level` TINYINT NOT NULL DEFAULT 1 COMMENT '1=Mudah(10poin), 2=Sedang(20poin), 3=Sulit(30poin)',
  `resolution_note` TEXT DEFAULT NULL COMMENT 'Catatan solusi dari staff',
  `pending_reason` TEXT DEFAULT NULL COMMENT 'Alasan pending',
  `category_id` CHAR(36) NOT NULL,
  `user_id` CHAR(36) NOT NULL COMMENT 'Pembuat tiket',
  `staff_id` CHAR(36) DEFAULT NULL COMMENT 'Staff yang menangani',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Ticket_code_key` (`code`),
  KEY `Ticket_status_idx` (`status`),
  KEY `Ticket_category_id_idx` (`category_id`),
  KEY `Ticket_user_id_idx` (`user_id`),
  KEY `Ticket_staff_id_idx` (`staff_id`),
  KEY `Ticket_created_at_idx` (`created_at`),
  CONSTRAINT `Ticket_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `Category` (`id`),
  CONSTRAINT `Ticket_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User` (`id`),
  CONSTRAINT `Ticket_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: TicketAttachment
-- ============================================================
CREATE TABLE IF NOT EXISTS `TicketAttachment` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `filename` VARCHAR(255) NOT NULL COMMENT 'Nama file asli',
  `filepath` VARCHAR(500) NOT NULL COMMENT 'Path untuk serving',
  `filetype` VARCHAR(100) NOT NULL COMMENT 'MIME type',
  `filesize` INT NOT NULL COMMENT 'Ukuran dalam bytes',
  `ticket_id` CHAR(36) NOT NULL,
  `uploaded_by` CHAR(36) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `TicketAttachment_ticket_id_idx` (`ticket_id`),
  CONSTRAINT `TicketAttachment_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `Ticket` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: Chat
-- ============================================================
CREATE TABLE IF NOT EXISTS `Chat` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `message` TEXT NOT NULL,
  `attachment_url` VARCHAR(500) DEFAULT NULL,
  `attachment_type` VARCHAR(100) DEFAULT NULL COMMENT 'MIME type',
  `is_voice_note` TINYINT(1) NOT NULL DEFAULT 0,
  `ticket_id` CHAR(36) NOT NULL,
  `sender_id` CHAR(36) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `Chat_ticket_id_created_at_idx` (`ticket_id`, `created_at`),
  KEY `Chat_sender_id_idx` (`sender_id`),
  CONSTRAINT `Chat_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `Ticket` (`id`),
  CONSTRAINT `Chat_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `User` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: LeaderboardLog
-- ============================================================
CREATE TABLE IF NOT EXISTS `LeaderboardLog` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `points` INT NOT NULL COMMENT 'Poin = 10 x difficulty_level',
  `period_month` TINYINT NOT NULL COMMENT '1-12',
  `period_year` SMALLINT NOT NULL COMMENT 'Contoh: 2026',
  `staff_id` CHAR(36) NOT NULL,
  `ticket_id` CHAR(36) NOT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `LeaderboardLog_staff_id_idx` (`staff_id`),
  KEY `LeaderboardLog_ticket_id_idx` (`ticket_id`),
  KEY `LeaderboardLog_period_idx` (`period_month`, `period_year`),
  CONSTRAINT `LeaderboardLog_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `User` (`id`),
  CONSTRAINT `LeaderboardLog_ticket_id_fkey` FOREIGN KEY (`ticket_id`) REFERENCES `Ticket` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: WA_Setting
-- ============================================================
CREATE TABLE IF NOT EXISTS `WA_Setting` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `is_enabled` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Toggle notifikasi global',
  `session_data` TEXT DEFAULT NULL,
  `connection_status` VARCHAR(50) NOT NULL DEFAULT 'disconnected',
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABEL: Notification_Template
-- ============================================================
CREATE TABLE IF NOT EXISTS `Notification_Template` (
  `id` CHAR(36) NOT NULL DEFAULT (UUID()),
  `event_type` VARCHAR(50) NOT NULL COMMENT 'Contoh: ticket_created, ticket_resolved',
  `template_body` TEXT NOT NULL COMMENT 'Mendukung variabel [nama-user], [id-ticket], dll',
  `variables` VARCHAR(500) NOT NULL COMMENT 'Comma-separated list variabel',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `Notification_Template_event_type_key` (`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATA AWAL: Kategori
-- ============================================================
INSERT IGNORE INTO `Category` (`id`, `name`, `description`) VALUES
(UUID(), 'Account', 'Masalah terkait akun, login, hak akses'),
(UUID(), 'Hardware', 'Masalah perangkat keras (printer, PC, monitor, dll)'),
(UUID(), 'Network', 'Masalah jaringan, internet, WiFi, VPN'),
(UUID(), 'Software', 'Masalah aplikasi, sistem operasi, update'),
(UUID(), 'Other', 'Masalah lain yang tidak termasuk kategori di atas');

-- ============================================================
-- DATA AWAL: User Admin (password: admin123)
-- ============================================================
INSERT IGNORE INTO `User` (`id`, `name`, `email`, `password_hash`, `role`) VALUES
(UUID(), 'Super Admin', 'admin@helpdesk.local', '$2b$12$LJ3a4FKbHSBTOB7K5Q5Yxe8X5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z', 'MANAGER');

-- CATATAN: Password hash di atas adalah placeholder.
-- Gunakan endpoint POST /api/v1/auth/register atau POST /api/v1/users untuk membuat user
-- dengan password yang di-hash secara benar oleh bcrypt di server.

-- ============================================================
-- DATA AWAL: WA Setting
-- ============================================================
INSERT IGNORE INTO `WA_Setting` (`id`, `is_enabled`, `connection_status`) VALUES
(UUID(), 0, 'disconnected');

-- ============================================================
-- DATA AWAL: Notification Templates
-- ============================================================
INSERT IGNORE INTO `Notification_Template` (`id`, `event_type`, `template_body`, `variables`) VALUES
(UUID(), 'ticket_created', 'Halo [nama-user], tiketmu *[id-ticket]* _[judul-ticket]_ sudah masuk ke sistem.\n\nKategori: *[kategori]*\nStatus: *[status-akhir]*\n\nHarap ditunggu, staff kami akan segera mengatasi keluhanmu.', '[id-ticket],[judul-ticket],[kategori],[nama-user],[status-akhir]'),
(UUID(), 'ticket_assigned', 'Halo [nama-user], tiketmu *[id-ticket]* _[judul-ticket]_ telah ditugaskan kepada staff kami.\n\nStaff: *[nama-staff]*\nKategori: *[kategori]*', '[id-ticket],[judul-ticket],[nama-user],[nama-staff],[kategori]'),
(UUID(), 'ticket_in_progress', 'Halo [nama-user], tiketmu *[id-ticket]* _[judul-ticket]_ sedang dalam proses penanganan.\n\nDitangani oleh: *[nama-staff]*', '[id-ticket],[judul-ticket],[nama-user],[nama-staff],[kategori]'),
(UUID(), 'ticket_pending', 'Halo [nama-user], tiketmu *[id-ticket]* _[judul-ticket]_ saat ini dalam status *Pending*.\n\nDitangani oleh: *[nama-staff]*', '[id-ticket],[judul-ticket],[nama-user],[nama-staff],[kategori]'),
(UUID(), 'ticket_resolved', 'Halo [nama-user], tiketmu *[id-ticket]* _[judul-ticket]_ telah diselesaikan oleh staff kami.\n\nDitangani oleh: *[nama-staff]*', '[id-ticket],[judul-ticket],[nama-user],[nama-staff],[kategori]'),
(UUID(), 'ticket_closed', 'Halo [nama-user], tiketmu *[id-ticket]* _[judul-ticket]_ telah ditutup secara resmi.\n\nKategori: *[kategori]*\nStatus Akhir: *[status-akhir]*', '[id-ticket],[judul-ticket],[nama-user],[kategori],[status-akhir]'),
(UUID(), 'ticket_unclaimed', 'Halo [nama-user], tiketmu *[id-ticket]* _[judul-ticket]_ telah dilepas oleh staff dan kembali ke status *Terbuka*.', '[id-ticket],[judul-ticket],[nama-user],[kategori]');

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- SELESAI!
-- Setelah import, buat user melalui API:
-- POST https://api.zorroserver.net/api/v1/auth/register
-- atau POST https://api.zorroserver.net/api/v1/users (sebagai Manager)
-- ============================================================
