# IT Helpdesk REST API

REST API untuk sistem IT Helpdesk, dibangun dengan Express.js + PostgreSQL (`pg`).  
Terhubung ke database yang sama dengan aplikasi Next.js utama.

## Quick Start

```bash
cd rest-api
npm install
cp .env.example .env   # Edit sesuai konfigurasi DB Anda
npm run dev             # Development (auto-reload)
npm start               # Production
```

Server berjalan di `http://localhost:3001`  
Health check: `GET http://localhost:3001/api/v1`

## Environment Variables

Buat file `.env`:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DATABASE
PORT=3001
```

## Struktur Folder

```
rest-api/
├── src/
│   ├── app.js                 # Entry point Express
│   ├── config/database.js     # Pool koneksi PostgreSQL
│   ├── middleware/errorHandler.js
│   ├── models/                # Query database (raw SQL)
│   ├── controllers/           # Logic bisnis
│   ├── routes/                # Definisi endpoint
│   └── validators/            # Validasi input (express-validator)
├── .env
├── API_DOCS.md                # Dokumentasi endpoint lengkap
└── package.json
```

## Deployment dengan PM2 (STB Armbian / VPS)

### 1. Install Node.js & PM2

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 global
sudo npm install -g pm2
```

### 2. Setup Aplikasi

```bash
cd /home/user/it-helpdesk-nextjs/rest-api
npm install --production
cp .env.example .env
nano .env  # Isi DATABASE_URL
```

### 3. Jalankan dengan PM2

```bash
# Start aplikasi
pm2 start src/app.js --name "helpdesk-api"

# Cek status
pm2 status

# Lihat log
pm2 logs helpdesk-api

# Restart
pm2 restart helpdesk-api
```

### 4. Auto-start saat Boot

```bash
# Generate startup script
pm2 startup

# Ikuti instruksi yang muncul (copy-paste command sudo)
# Lalu simpan proses saat ini
pm2 save
```

### 5. Update Aplikasi

```bash
cd /home/user/it-helpdesk-nextjs/rest-api
git pull
npm install --production
pm2 restart helpdesk-api
```

## Dokumentasi API

Lihat [API_DOCS.md](./API_DOCS.md) untuk dokumentasi lengkap semua endpoint.
