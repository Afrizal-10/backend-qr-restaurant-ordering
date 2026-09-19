# Restoku Backend

Backend untuk **Real-Time QR Restaurant Ordering System** — customer scan QR di meja, pesan makanan/minuman, bayar (cash atau QRIS), tanpa perlu bikin akun. Admin & Cashier mengelola operasional lewat dashboard dengan update real-time.

## Tech Stack

- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Auth**: JWT + bcryptjs
- **Validasi**: Zod
- **Real-time**: Socket.IO
- **Payment**: Midtrans (QRIS, Sandbox)
- **Upload gambar**: Cloudinary (+ Multer)
- **AI Assistant**: Google Gemini (`gemini-3.6-flash`) dengan function calling read-only
- **Security**: Helmet, CORS

## Requirements

- Node.js 18+
- PostgreSQL 14+
- Akun gratis: [Cloudinary](https://cloudinary.com), [Midtrans Sandbox](https://dashboard.midtrans.com), [Google AI Studio](https://aistudio.google.com/apikey)

## Installation

```bash
git clone <repo-url>
cd backend
npm install --legacy-peer-deps
```

> Kalau `npm install` biasa muncul error `Cannot read properties of null (reading 'edgesOut')`, itu bug npm 10.x — pakai `--legacy-peer-deps`.

## Environment

Copy `.env.example` jadi `.env`, lalu isi:

```dotenv
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/resto_ordering"
JWT_SECRET="ganti-dengan-secret-random"
JWT_EXPIRES_IN="1d"
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"

CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

MIDTRANS_SERVER_KEY=""
MIDTRANS_CLIENT_KEY=""
MIDTRANS_IS_PRODUCTION="false"

GEMINI_API_KEY=""
```

Kalau `CLOUDINARY_*`/`MIDTRANS_*`/`GEMINI_API_KEY` dikosongkan, server tetap jalan normal — cuma fitur yang bersangkutan (upload gambar, QRIS, AI chat) yang tidak berfungsi sampai diisi.

## Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Jalankan migration (buat tabel di database)
npx prisma migrate dev --name init

# Isi data awal (1 admin, 1 cashier)
npm run prisma:seed
```

Akun hasil seed:
| Role | Email | Password |
|---|---|---|
| ADMIN | admin@restoku.com | password123 |
| CASHIER | cashier@restoku.com | password123 |

## Run Development

```bash
npm run dev
```

Server jalan di `http://localhost:5000`. Cek `GET /api/health` untuk pastikan server hidup.

## Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # 8 model: User, Category, Product, Table, Order, OrderItem, Payment, OrderStatusHistory
│   └── seed.ts
├── src/
│   ├── config/             # env, prisma client, cloudinary, midtrans, gemini, constants
│   ├── controllers/        # HTTP request/response handler (tipis, tanpa business logic)
│   ├── services/           # Business logic (query database, kalkulasi, dsb)
│   ├── routes/             # Endpoint + middleware chain
│   ├── middlewares/        # auth, RBAC, validasi, error handler, upload
│   ├── validators/         # Zod schema per fitur
│   ├── sockets/            # Socket.IO setup, room, event
│   ├── utils/              # Helper kecil (generate order number, QR token, parseId, dll)
│   ├── app.ts              # Konfigurasi Express app
│   └── server.ts           # Entry point, HTTP server + Socket.IO
├── .env.example
└── package.json
```

Arsitektur: **Route → Middleware → Controller → Service → Prisma → PostgreSQL**. Business logic selalu di service, controller cuma jembatani request/response.

## Authentication

`POST /api/auth/login` dengan email + password → dapat JWT. Sertakan di setiap request yang butuh login:

```
Authorization: Bearer <token>
```

Role: `ADMIN` dan `CASHIER`. RBAC diterapkan lewat `authMiddleware` (verifikasi token) + `roleMiddleware("ADMIN", ...)` (cek role) di setiap route yang butuh.

## API Overview

Semua response pakai format konsisten:

```json
{ "success": true, "message": "...", "data": { } }
```

| Resource         | Endpoint                                                                              | Akses                                         |
| ---------------- | ------------------------------------------------------------------------------------- | --------------------------------------------- |
| **Auth**         | `POST /api/auth/login`                                                                | Publik                                        |
|                  | `GET /api/auth/me`                                                                    | Login                                         |
| **Users**        | `GET/POST /api/users`, `GET/PUT/DELETE /api/users/:id`, `PATCH /api/users/:id/status` | ADMIN                                         |
| **Categories**   | `GET /api/categories`, `GET /api/categories/:id`                                      | Publik                                        |
|                  | `POST/PUT/DELETE /api/categories(/:id)`                                               | ADMIN                                         |
| **Products**     | `GET /api/products`, `GET /api/products/:id`                                          | Publik (beda hasil kalau login sebagai staff) |
|                  | `POST/PUT/DELETE /api/products(/:id)`, `PATCH /api/products/:id/availability`         | ADMIN                                         |
|                  | `POST /api/products/upload-image`                                                     | ADMIN                                         |
| **Tables**       | `GET /api/tables/qr/:qrToken`                                                         | Publik                                        |
|                  | `GET /api/tables`, `GET /api/tables/:id`                                              | ADMIN, CASHIER                                |
|                  | `POST/PUT/DELETE /api/tables(/:id)`, `POST /api/tables/:id/(generate\|regenerate)-qr` | ADMIN                                         |
| **Orders**       | `POST /api/orders`                                                                    | Publik (customer checkout)                    |
|                  | `GET /api/orders`, `GET /api/orders/:id`                                              | ADMIN, CASHIER                                |
|                  | `PATCH /api/orders/:id/status`, `PATCH /api/orders/:id/cancel`                        | ADMIN, CASHIER                                |
| **Payments**     | `POST /api/payments/:orderId/qris`, `GET /api/payments/:orderId/status`               | Publik (customer)                             |
|                  | `GET /api/payments/:id`, `PATCH /api/payments/:id/confirm`                            | ADMIN, CASHIER                                |
| **Dashboard**    | `GET /api/dashboard/summary`, `/sales`, `/top-products`, `/orders`                    | ADMIN                                         |
|                  | `GET /api/dashboard/cashier`                                                          | ADMIN, CASHIER                                |
| **AI Assistant** | `POST /api/ai/chat`                                                                   | ADMIN, CASHIER                                |

## Fitur Utama

- **QR per meja**: token random & aman (`crypto.randomBytes`), regenerate akan membuat token lama otomatis tidak berlaku.
- **Kalkulasi harga selalu di server**: subtotal → tax (10%) → service charge (5%) → total. Harga product diambil dari database, bukan dari request (`OrderItem.price` adalah snapshot harga saat order dibuat).
- **Status order & transisi terkontrol**: `PENDING → CONFIRMED → PREPARING → READY → SERVED → COMPLETED`, atau `CANCELLED` (cuma dari `PENDING`/`CONFIRMED`). Setiap perubahan status tercatat di `order_status_histories`.
- **Payment**: CASH (konfirmasi manual oleh cashier) atau QRIS lewat Midtrans Sandbox (polling status, bukan webhook — supaya bisa ditest tanpa expose `localhost`).
- **Real-time (Socket.IO)**: room `order:{id}` untuk customer, room `cashier`/`admin` untuk dashboard staff (butuh JWT valid untuk join). Event: `new_order`, `order_confirmed`, `order_preparing`, `order_ready`, `order_served`, `order_completed`, `order_cancelled`, `payment_updated`, `table_status_updated`.
- **AI Assistant**: chat berbasis Gemini dengan _function calling read-only_ — AI cuma bisa membaca data (dashboard, order, product, dll), tidak pernah bisa membuat/mengubah/menghapus apa pun. Tool yang tersedia beda per role (ADMIN dapat akses data bisnis penuh termasuk rekap per hari/minggu/bulan/tahun, CASHIER cuma data operasional).

## Known Limitations (v1)

Sesuai scope awal, fitur berikut **belum** dibuat: multi-restoran, akun customer, loyalty/voucher, delivery, split bill, refund kompleks, payment gateway production (masih Sandbox), microservices.

Socket.IO belum ada autentikasi berlapis untuk room `order:{id}` (customer cuma perlu tahu `orderId`-nya) — cukup untuk v1 karena `orderId` tidak dipakai sebagai bukti kepemilikan apa pun yang sensitif.
