# Schedulein

Personal Schedule & Finance Tracker — web app buat manajin jadwal harian dan keuangan bulanan.

## 🎯 Fitur

- **📅 Jadwal Harian**: Catat aktivitas dari pagi sampe malam, lihat jadwal besok atau bulan depan.
- **💰 Tracking Keuangan**: Catat pemasukan & pengeluaran dengan kategori otomatis.
- **📊 Analisis Pengeluaran**: Lihat breakdown per kategori dan dapet saran hemat berdasarkan pengeluaran terbesar.
- **🔐 Login Aman**: Auth dengan email & password via Supabase.
- **🌍 Akses Dimana Saja**: Web app responsive, bisa diakses dari laptop, tablet, atau mobile.
- **🎨 Warna Hijau Pastel**: Design yang nyaman di mata.

## 🚀 Quick Start

1. **Setup Supabase** — Ikuti [SETUP.md](./SETUP.md) untuk bikin database dan environment variables.
2. **Install & Run**:
   ```bash
   npm install
   npm run dev
   ```
3. **Buka http://localhost:3000** — Daftar akun dan mulai pakai!

## 💻 Tech Stack

- **Frontend**: Next.js 14 (React + TypeScript)
- **Styling**: Tailwind CSS (dengan tema hijau pastel)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Authentication (email/password)
- **Hosting**: Vercel (app) + Supabase (database)

## 📝 Struktur Folder

```
schedulein/
├── app/                    # Next.js pages
│   ├── jadwal/           # Halaman jadwal harian
│   ├── keuangan/         # Halaman keuangan & analisis
│   ├── login/            # Halaman login
│   ├── register/         # Halaman registrasi
│   ├── layout.tsx        # Layout root
│   └── page.tsx          # Redirect ke jadwal atau login
├── components/           # Reusable components
│   └── Navbar.tsx        # Navigation bar
├── lib/
│   └── supabase.ts       # Supabase client setup
├── middleware.ts         # Auth middleware
├── tailwind.config.ts    # Tailwind theme config (hijau pastel)
├── .env.local            # Environment variables (jangan commit!)
└── SETUP.md              # Panduan setup lengkap
```

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build untuk production
npm run build

# Start production server
npm start
```

## 📖 Dokumentasi Lengkap

Untuk setup detail Supabase, environment variables, dan deployment → lihat [SETUP.md](./SETUP.md).

---

Made with 💚 by Rafael
