# Integrasi PHP (cURL)

Panduan lengkap mengintegrasikan REST API ke project PHP menggunakan **cURL procedural**. Cocok untuk pemula.

## Arsitektur

```
Browser ──> PHP Page ──> function.php ──> cURL ──> REST API ──> PostgreSQL
                              │
                         $_SESSION
                       (token + user)
```

PHP tidak terhubung langsung ke database. Semua data melalui REST API via HTTP (cURL).

## Setup

### 1. Copy `function.php` ke folder project PHP Anda

### 2. Set Base URL API di `function.php`

```php
// Baris paling atas di function.php — ganti sesuai server REST API Anda
$API_BASE_URL = "http://localhost:3001/api/v1";

// Jika REST API di server lain:
$API_BASE_URL = "http://192.168.1.100:3001/api/v1";
```

### 3. Pastikan PHP cURL aktif

```bash
php -m | grep curl
# Jika belum: sudo apt install php-curl && sudo systemctl restart apache2
```

### 4. Jalankan REST API

```bash
cd rest-api
npm start
# Server berjalan di http://localhost:3001
```

### 5. Jalankan PHP

```bash
cd tikett
php -S localhost:8080
# Buka http://localhost:8080/login.php
```

---

## Contoh 1: Login

### Fungsi di `function.php`

```php
/**
 * Kirim request ke REST API (fungsi dasar).
 * Otomatis kirim Bearer token dari $_SESSION jika ada.
 */
function api_request($method, $endpoint, $data = null) {
    global $API_BASE_URL;

    $url = $API_BASE_URL . $endpoint;
    $ch = curl_init();

    $headers = ['Content-Type: application/json'];
    if (isset($_SESSION['token'])) {
        $headers[] = 'Authorization: Bearer ' . $_SESSION['token'];
    }

    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    curl_setopt($ch, CURLOPT_TIMEOUT, 15);

    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    } elseif ($method === 'PATCH') {
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PATCH');
        if ($data) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        return ['error' => true, 'message' => 'Gagal terhubung ke server: ' . $curlError];
    }

    return json_decode($response, true);
}

function api_post($endpoint, $data) { return api_request('POST', $endpoint, $data); }

/**
 * Login — kirim email+password ke API, simpan token di $_SESSION.
 */
function api_login($email, $password) {
    $result = api_post('/auth/login', [
        'email'    => $email,
        'password' => $password,
    ]);

    if (!$result['error'] && isset($result['data']['token'])) {
        $_SESSION['token'] = $result['data']['token'];
        $_SESSION['user']  = $result['data']['user'];
        return true;
    }

    $_SESSION['login_error'] = $result['message'] ?? 'Login gagal';
    return false;
}

function is_logged_in() { return isset($_SESSION['token']); }
function get_user_role() { return $_SESSION['user']['role'] ?? ''; }
function get_current_user_data() { return $_SESSION['user'] ?? null; }

function require_login() {
    if (!is_logged_in()) { header('Location: login.php'); exit; }
}
```

### Halaman `login.php` (kode lengkap)

```php
<?php
require_once 'function.php';

// Jika sudah login, redirect ke halaman sesuai role
if (is_logged_in()) {
    $role = get_user_role();
    if ($role === 'MANAGER') header('Location: index-manager.php');
    elseif ($role === 'STAFF') header('Location: index.php');
    else header('Location: tiket-baru-user.php');
    exit;
}

// Handle form submit
$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email    = trim($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($email && $password) {
        if (api_login($email, $password)) {
            // Login berhasil — redirect berdasarkan role
            $role = get_user_role();
            if ($role === 'MANAGER') header('Location: index-manager.php');
            elseif ($role === 'STAFF') header('Location: index.php');
            else header('Location: tiket-baru-user.php');
            exit;
        } else {
            // Login gagal — ambil pesan error
            $error = $_SESSION['login_error'] ?? 'Email atau password salah';
            unset($_SESSION['login_error']);
        }
    } else {
        $error = 'Email dan password wajib diisi';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Login - Tiket</title>
    <link href="css/styles.css" rel="stylesheet" />
</head>
<body>
    <div class="container">
        <div class="row justify-content-center" style="margin-top: 150px;">
            <div class="col-lg-5">
                <div class="card shadow-lg border-0 rounded-lg">
                    <div class="card-header">
                        <h3 class="text-center my-4">Login</h3>
                    </div>
                    <div class="card-body">

                        <!-- Tampilkan error jika ada -->
                        <?php if ($error): ?>
                        <div class="alert alert-danger"><?= htmlspecialchars($error) ?></div>
                        <?php endif; ?>

                        <!-- Form login: method POST, action kosong = submit ke diri sendiri -->
                        <form method="POST" action="">
                            <div class="form-floating mb-3">
                                <input class="form-control" id="inputEmail" name="email" type="email"
                                       placeholder="name@example.com"
                                       value="<?= htmlspecialchars($_POST['email'] ?? '') ?>" required />
                                <label for="inputEmail">Email address</label>
                            </div>
                            <div class="form-floating mb-3">
                                <input class="form-control" id="inputPassword" name="password"
                                       type="password" placeholder="Password" required />
                                <label for="inputPassword">Password</label>
                            </div>
                            <div class="d-flex justify-content-center mt-4">
                                <button type="submit" class="btn btn-success px-4">Login</button>
                            </div>
                        </form>

                    </div>
                </div>
            </div>
        </div>
    </div>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

**Penjelasan alur:**
1. User buka `login.php` → tampil form
2. User isi email + password → klik Login
3. PHP terima `$_POST` → panggil `api_login($email, $password)`
4. `function.php` kirim `POST /auth/login` via cURL ke REST API
5. REST API return `{ token, user }` → disimpan di `$_SESSION`
6. PHP redirect ke halaman sesuai role

---

## Contoh 2: Logout

### Fungsi di `function.php`

```php
function api_logout() {
    api_post('/auth/logout', []);  // Beritahu server untuk hapus session
    session_unset();                // Hapus semua $_SESSION
    session_destroy();              // Hancurkan session PHP
}
```

### Halaman `logout.php` (kode lengkap)

```php
<?php
require_once 'function.php';
api_logout();
header('Location: login.php');
exit;
```

> Cukup 4 baris! Panggil `api_logout()` lalu redirect ke login.

---

## Contoh 3: Buat Tiket Baru (CREATE)

### Fungsi di `function.php`

```php
function api_get($endpoint) { return api_request('GET', $endpoint); }

/**
 * Ambil semua kategori tiket untuk dropdown.
 */
function get_categories() {
    return api_get('/categories');
}

/**
 * Buat tiket baru. user_id otomatis dari token (tidak perlu dikirim).
 */
function create_ticket($title, $description, $category_id) {
    return api_post('/tickets', [
        'title'       => $title,
        'description' => $description,
        'category_id' => $category_id,
    ]);
}
```

### Halaman `tiket-baru-user.php` (kode lengkap)

```php
<?php
require_once 'function.php';
require_role('USER');  // Hanya role USER yang boleh akses halaman ini

// ===== Handle form submit (CREATE) =====
$success = '';
$form_error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title       = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $category_id = $_POST['category_id'] ?? '';

    if ($title && $description && $category_id) {
        $result = create_ticket($title, $description, $category_id);
        if (!$result['error']) {
            $success = 'Tiket berhasil dibuat! Kode: ' . ($result['data']['code'] ?? '-');
        } else {
            $form_error = $result['message'] ?? 'Gagal membuat tiket';
        }
    } else {
        $form_error = 'Semua field wajib diisi';
    }
}

// ===== Ambil kategori untuk dropdown (READ) =====
$cat_result = get_categories();
$categories = (!$cat_result['error'] && isset($cat_result['data'])) ? $cat_result['data'] : [];

// ===== Include header (sidebar + navbar) =====
include "header.php";
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid">
            <div class="row mt-4 d-flex justify-content-center">
                <div class="col">
                    <div class="card shadow p-3 mb-4 bg-body rounded">
                        <div class="card-body text-center rounded"
                             style="font-weight:bold; font-size:30px; color:#fff; background-color:#8c57ff;">
                            Form Tiket Baru
                        </div>
                        <hr>

                        <!-- Pesan sukses -->
                        <?php if ($success): ?>
                        <div class="alert alert-success"><?= htmlspecialchars($success) ?></div>
                        <?php endif; ?>

                        <!-- Pesan error -->
                        <?php if ($form_error): ?>
                        <div class="alert alert-danger"><?= htmlspecialchars($form_error) ?></div>
                        <?php endif; ?>

                        <form method="POST" action="">

                            <!-- Judul -->
                            <div class="mb-3">
                                <label for="title" class="form-label">Judul Kendala :</label>
                                <input type="text" class="form-control" name="title" id="title"
                                       placeholder="Contoh: Printer lantai 2 error"
                                       minlength="5" maxlength="200" required
                                       value="<?= htmlspecialchars($_POST['title'] ?? '') ?>">
                            </div>

                            <!-- Dropdown Kategori (data dari API) -->
                            <div class="mb-3">
                                <label for="category_id" class="form-label">Kategori :</label>
                                <select class="form-select" name="category_id" id="category_id" required>
                                    <option value="">-- Pilih Kategori --</option>
                                    <?php foreach ($categories as $cat): ?>
                                    <option value="<?= htmlspecialchars($cat['id']) ?>"
                                        <?= (isset($_POST['category_id']) && $_POST['category_id'] === $cat['id']) ? 'selected' : '' ?>>
                                        <?= htmlspecialchars($cat['name']) ?>
                                    </option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <!-- Deskripsi -->
                            <div class="form-floating mb-3">
                                <textarea class="form-control" id="description" name="description"
                                          style="height:200px" minlength="10" maxlength="5000"
                                          required placeholder="Tulis kendala"><?= htmlspecialchars($_POST['description'] ?? '') ?></textarea>
                                <label for="description">Tulis Kendala Disini</label>
                            </div>

                            <div class="text-end">
                                <button type="submit" class="btn btn-success">Kirim Kendala</button>
                            </div>

                        </form>
                    </div>
                </div>
            </div>
        </div>
    </main>
    <?php include "footer.php"; ?>
```

**Penjelasan alur:**
1. Halaman dibuka → `require_role('USER')` cek apakah user login dan role-nya USER
2. `get_categories()` dipanggil → cURL `GET /categories` → data kategori untuk dropdown
3. User isi form → klik "Kirim Kendala"
4. PHP terima `$_POST` → panggil `create_ticket($title, $desc, $cat_id)`
5. `function.php` kirim `POST /tickets` dengan Bearer token → REST API buat tiket
6. Tampilkan pesan sukses/error

---

## Contoh 4: List Tiket dalam Antrian (READ)

### Fungsi di `function.php`

```php
/**
 * Ambil daftar tiket dengan filter.
 * Contoh: get_tickets(['status' => 'OPEN', 'limit' => 10])
 */
function get_tickets($params = []) {
    $query = http_build_query($params);
    $endpoint = '/tickets' . ($query ? '?' . $query : '');
    return api_get($endpoint);
}

/**
 * Format tanggal ISO ke format Indonesia.
 */
function format_tanggal($iso) {
    if (!$iso) return '-';
    $dt = new DateTime($iso);
    return $dt->format('d/m/Y H:i');
}

/**
 * Potong teks panjang.
 */
function potong_teks($text, $max = 100) {
    if (strlen($text) <= $max) return $text;
    return substr($text, 0, $max) . '...';
}
```

### Halaman `tiket-antri-user.php` (kode lengkap)

```php
<?php
require_once 'function.php';
require_role('USER');

// ===== Ambil tiket yang sedang dalam antrian (READ) =====
// Panggil API 3x untuk 3 status berbeda
$result1 = get_tickets(['status' => 'OPEN']);
$result2 = get_tickets(['status' => 'IN_PROGRESS']);
$result3 = get_tickets(['status' => 'PENDING']);

// Gabung semua tiket
$tickets = array_merge(
    (!$result1['error'] && isset($result1['data'])) ? $result1['data'] : [],
    (!$result2['error'] && isset($result2['data'])) ? $result2['data'] : [],
    (!$result3['error'] && isset($result3['data'])) ? $result3['data'] : []
);

include "header.php";
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid px-4">
            <div class="card mb-4 shadow p-3 mb-5 bg-body rounded">
                <div class="card-header">
                    <i class="fas fa-list me-1"></i>
                    Tiket dalam Antrian (<?= count($tickets) ?>)
                </div>
                <div class="card-body">

                    <!-- Jika tidak ada tiket -->
                    <?php if (empty($tickets)): ?>
                    <div class="text-center text-muted py-4">
                        <i class="fas fa-inbox fa-3x mb-3"></i>
                        <p>Belum ada tiket dalam antrian.</p>
                        <a href="tiket-baru-user.php" class="btn btn-success">Buat Tiket Baru</a>
                    </div>

                    <!-- Jika ada tiket — tampilkan tabel -->
                    <?php else: ?>
                    <table id="datatablesSimpleTicket">
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>Kode Tiket</th>
                                <th>Judul</th>
                                <th>Kategori</th>
                                <th>Status</th>
                                <th>Staff</th>
                                <th>Tanggal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php $no = 1; foreach ($tickets as $t): ?>
                            <tr>
                                <td><?= $no++ ?></td>
                                <td><code><?= htmlspecialchars($t['code'] ?? '-') ?></code></td>
                                <td><?= htmlspecialchars(potong_teks($t['title'] ?? '', 50)) ?></td>
                                <td><?= htmlspecialchars($t['category']['name'] ?? '-') ?></td>
                                <td>
                                    <?php
                                    // Tentukan warna badge berdasarkan status
                                    $status = $t['status'] ?? '';
                                    $badge = 'secondary'; $label = $status;
                                    if ($status === 'OPEN')        { $badge = 'success'; $label = 'Terbuka'; }
                                    if ($status === 'IN_PROGRESS') { $badge = 'primary'; $label = 'Diproses'; }
                                    if ($status === 'PENDING')     { $badge = 'warning'; $label = 'Tertunda'; }
                                    ?>
                                    <span class="badge bg-<?= $badge ?>"><?= $label ?></span>
                                </td>
                                <td><?= htmlspecialchars($t['staff']['name'] ?? 'Belum ada') ?></td>
                                <td><?= format_tanggal($t['created_at'] ?? '') ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <?php endif; ?>

                </div>
            </div>
        </div>
    </main>
    <?php include "footer.php"; ?>
```

---

## Contoh 5: List Tiket Selesai (READ)

### Halaman `tiket-selesai-user.php` (kode lengkap)

```php
<?php
require_once 'function.php';
require_role('USER');

// Ambil tiket RESOLVED dan CLOSED
$r1 = get_tickets(['status' => 'RESOLVED']);
$r2 = get_tickets(['status' => 'CLOSED']);
$tickets = array_merge(
    (!$r1['error'] && isset($r1['data'])) ? $r1['data'] : [],
    (!$r2['error'] && isset($r2['data'])) ? $r2['data'] : []
);

include "header.php";
?>
<div id="layoutSidenav_content">
    <main>
        <div class="container-fluid px-4">
            <div class="card mb-4 shadow p-3 mb-5 bg-body rounded">
                <div class="card-header">
                    <i class="fas fa-check-circle me-1"></i>
                    Tiket Terselesaikan (<?= count($tickets) ?>)
                </div>
                <div class="card-body">
                    <?php if (empty($tickets)): ?>
                    <div class="text-center text-muted py-4">
                        <p>Belum ada tiket yang selesai.</p>
                    </div>
                    <?php else: ?>
                    <table id="datatablesSimpleTicket">
                        <thead>
                            <tr>
                                <th>No</th><th>Kode</th><th>Judul</th>
                                <th>Kategori</th><th>Status</th><th>Staff</th><th>Tanggal</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php $no = 1; foreach ($tickets as $t): ?>
                            <tr>
                                <td><?= $no++ ?></td>
                                <td><code><?= htmlspecialchars($t['code'] ?? '-') ?></code></td>
                                <td><?= htmlspecialchars(potong_teks($t['title'] ?? '', 50)) ?></td>
                                <td><?= htmlspecialchars($t['category']['name'] ?? '-') ?></td>
                                <td>
                                    <?php
                                    $status = $t['status'] ?? '';
                                    if ($status === 'RESOLVED') { $badge = 'info';      $label = 'Selesai'; }
                                    else                        { $badge = 'secondary';  $label = 'Ditutup'; }
                                    ?>
                                    <span class="badge bg-<?= $badge ?>"><?= $label ?></span>
                                </td>
                                <td><?= htmlspecialchars($t['staff']['name'] ?? '-') ?></td>
                                <td><?= format_tanggal($t['created_at'] ?? '') ?></td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </main>
    <?php include "footer.php"; ?>
```

---

## Contoh 6: Sidebar Berdasarkan Role

### Fungsi di `function.php`

```php
function require_login() {
    if (!is_logged_in()) { header('Location: login.php'); exit; }
}

function require_role() {
    $roles = func_get_args();  // Terima banyak parameter: require_role('STAFF', 'MANAGER')
    require_login();
    if (!in_array(get_user_role(), $roles)) {
        header('Location: login.php');
        exit;
    }
}
```

### Halaman `header.php` (potongan sidebar)

```php
<?php
if (!function_exists('is_logged_in')) { require_once 'function.php'; }
require_login();
$current_user = get_current_user_data();
$current_role = get_user_role();
?>
<!-- ... navbar ... -->
<div class="sb-sidenav-menu">
    <div class="nav">

        <!-- Tampilkan menu USER hanya jika role = USER -->
        <?php if ($current_role === 'USER'): ?>
        <a class="nav-link" href="tiket-baru-user.php">Buat Tiket Baru</a>
        <a class="nav-link" href="tiket-antri-user.php">Dalam Antrian</a>
        <a class="nav-link" href="tiket-selesai-user.php">Selesai</a>
        <?php endif; ?>

        <!-- Tampilkan menu STAFF hanya jika role = STAFF -->
        <?php if ($current_role === 'STAFF'): ?>
        <a class="nav-link" href="tiket-baru-support.php">Tiket Baru</a>
        <a class="nav-link" href="tiket-antri-support.php">Dalam Antrian</a>
        <?php endif; ?>

        <!-- Tampilkan menu MANAGER hanya jika role = MANAGER -->
        <?php if ($current_role === 'MANAGER'): ?>
        <a class="nav-link" href="validasi-poin.php">Validasi Poin</a>
        <a class="nav-link" href="akun.php">Kelola Akun</a>
        <?php endif; ?>

        <!-- Logout — semua role -->
        <a class="nav-link" href="logout.php">Keluar</a>

    </div>
</div>
<div class="sb-sidenav-footer">
    Login sebagai: <?= htmlspecialchars($current_user['name'] ?? '-') ?> (<?= $current_role ?>)
</div>
```

---

## Mapping Halaman → Fungsi → Endpoint

| Halaman PHP | Fungsi di `function.php` | Endpoint REST API |
|-------------|-------------------------|-------------------|
| `login.php` | `api_login($email, $pass)` | `POST /auth/login` |
| `logout.php` | `api_logout()` | `POST /auth/logout` |
| `tiket-baru-user.php` | `get_categories()` | `GET /categories` |
| | `create_ticket($title, $desc, $cat_id)` | `POST /tickets` |
| `tiket-antri-user.php` | `get_tickets(['status'=>'OPEN'])` | `GET /tickets?status=OPEN` |
| | `get_tickets(['status'=>'IN_PROGRESS'])` | `GET /tickets?status=IN_PROGRESS` |
| `tiket-selesai-user.php` | `get_tickets(['status'=>'RESOLVED'])` | `GET /tickets?status=RESOLVED` |
| | `get_tickets(['status'=>'CLOSED'])` | `GET /tickets?status=CLOSED` |
| `chat.php` | `get_chat_messages($ticket_id)` | `GET /chat/:ticketId` |
| | `send_chat_message($ticket_id, $msg)` | `POST /chat/:ticketId` |
| `akun.php` | `get_users()` | `GET /users` |
| | `create_user(...)` | `POST /users` |
| | `update_user(...)` | `PUT /users/:id` |
| | `toggle_user_active($id)` | `PATCH /users/:id/toggle-active` |
| `validasi-poin.php` | `update_ticket_status($id, 'CLOSED')` | `PATCH /tickets/:id/status` |

---

## Tips & Troubleshooting

### Cek koneksi ke API

```php
<?php
$ch = curl_init("http://localhost:3001/api/v1");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
echo $response;
// Harus tampil: {"error":false,"message":"IT Helpdesk REST API v1 is running"}
```

### Debug response API

```php
$result = get_tickets();
echo '<pre>';
print_r($result);
echo '</pre>';
```

### Error "Gagal terhubung ke server"

1. Pastikan REST API sudah berjalan (`npm start` di folder `rest-api/`)
2. Pastikan `$API_BASE_URL` di `function.php` benar
3. Jika beda server, pastikan firewall mengizinkan port 3001
4. Cek apakah PHP cURL aktif: `php -m | grep curl`

### Error "Token tidak ditemukan"

User belum login. Pastikan halaman memanggil `require_login()` atau `require_role('USER')` di awal file.

### Akun untuk testing

| Role | Email | Password |
|------|-------|----------|
| Manager | admin@helpdesk.local | admin123 |
| Staff | staff@helpdesk.local | staff123 |
| User | (buat via register atau akun.php) | - |
