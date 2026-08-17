# Schedulein - Setup Guide

Panduan lengkap setup web Schedulein (Personal Schedule & Finance Tracker).

## 1. Setup Supabase Project

1. Buka [supabase.com](https://supabase.com) dan login/daftar akun.
2. Klik **"New Project"** atau **"Create a new project"**.
3. Isi form:
   - **Name**: Schedulein (atau nama lain)
   - **Database Password**: Buat password yang kuat (jangan lupa!)
   - **Region**: Pilih region terdekat dengan lokasi lo (misal: Singapore untuk Indonesia)
4. Tunggu sampai project selesai dibuat (± 2-3 menit).

## 2. Buat Tabel di Supabase

### Tabel `schedule_items`

Di Supabase dashboard:
1. Klik **"SQL Editor"** di sidebar kiri.
2. Klik **"New Query"**.
3. Copy-paste query ini:

```sql
CREATE TABLE schedule_items (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  notes text,
  created_at timestamp DEFAULT NOW()
);

ALTER TABLE schedule_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own schedules"
  ON schedule_items FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_schedule_user_date ON schedule_items(user_id, date);
```

4. Klik **"Run"** atau tekan Ctrl+Enter.

### Tabel `transactions`

1. Klik **"New Query"** lagi.
2. Copy-paste query ini:

```sql
CREATE TABLE transactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('income', 'expense')),
  category text NOT NULL,
  amount numeric NOT NULL,
  description text,
  date date NOT NULL,
  created_at timestamp DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own transactions"
  ON transactions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_transaction_user_date ON transactions(user_id, date);
```

3. Klik **"Run"**.

### Tabel `recurring_schedules` (NEW)

1. Klik **"New Query"** lagi.
2. Copy-paste query ini:

```sql
CREATE TABLE recurring_schedules (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  recurrence_type text NOT NULL CHECK (recurrence_type IN ('daily', 'weekly', 'monthly')),
  days_of_week int[] DEFAULT NULL,
  end_date date DEFAULT NULL,
  notes text,
  created_at timestamp DEFAULT NOW()
);

ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own recurring schedules"
  ON recurring_schedules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_recurring_user ON recurring_schedules(user_id);
```

3. Klik **"Run"**.

## 3. Setup Environment Variables

1. Di Supabase dashboard, klik **"Settings"** → **"API"**.
2. Copy nilai dari:
   - **Project URL** → ganti `your_supabase_url_here` di `.env.local`
   - **anon public** → ganti `your_supabase_anon_key_here` di `.env.local`

File `.env.local` akan terlihat seperti:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 4. Jalankan Development Server

```bash
npm run dev
```

Buka browser ke http://localhost:3000 dan klik **"Daftar"** buat bikin akun baru. Setelah login, lo bisa mulai catat jadwal dan transaksi.

## 5. Deploy ke Vercel

1. Push project ke GitHub.
2. Buka [vercel.com](https://vercel.com) dan login.
3. Klik **"Add New..."** → **"Project"**.
4. Pilih repository project ini.
5. Di bagian **"Environment Variables"**, tambahkan:
   - `NEXT_PUBLIC_SUPABASE_URL`: copy dari Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: copy dari Supabase
6. Klik **"Deploy"**.

Setelah selesai, Vercel akan kasih URL public buat web lo. Bisa diakses dari mana aja!

## Fitur Tersedia

### 📅 Jadwal (Schedule)
- **Daily Schedules**: Catat jadwal per hari dari pagi sampai malam
- **Recurring Schedules**: Jadwal tetap (kerja 9-5, mata kuliah per minggu, dll)
- **Indonesian Calendar**: Otomatis detect hari libur nasional Indonesia
- **Browser Notifications**: Notif 30 menit sebelum jadwal dimulai

### 💰 Keuangan (Finance)
- **Income & Expense Tracking**: Catat pemasukan & pengeluaran dengan kategori
- **Monthly Analysis**: Breakdown pengeluaran per kategori + saran hemat
- **Export Features**: 
  - Export CSV (transaksi bulanan)
  - Export Report (TXT dengan summary)
  - Export Custom Range (pilih tanggal)

### 🔄 Recurring Schedules
1. Buka tab "Recurring" di halaman Jadwal
2. Klik "Add Recurring"
3. Isi: Title, waktu, pattern (Daily/Weekly/Monthly), hari (jika weekly)
4. Save → jadwal otomatis tercipta setiap harinya

**Contoh:**
- Kerja: Senin-Jumat, 9:00-17:00
- Kuliah Math: Senin 9:00-12:00
- Kuliah Fisika: Rabu 10:00-13:00

### 🎌 Indonesian Holidays
Sistem otomatis mendeteksi hari libur nasional (Tahun Baru, Isra Mi'raj, Idul Fitri, Idul Adha, Hari Kemerdekaan, Natal, dll). Ketika buka jadwal di hari libur, akan muncul notifikasi hari libur.

## Troubleshooting

**Masalah: Error "invalid login credentials" saat login**
→ Pastiin email dan password lo udah terdaftar di Supabase, atau daftar akun baru.

**Masalah: Data tidak keliatan**
→ Cek di Supabase Dashboard → "SQL Editor" → jalankan:
```sql
SELECT * FROM schedule_items;
SELECT * FROM transactions;
```

**Masalah: Warna hijau tidak keliatan**
→ Pastiin file `tailwind.config.ts` udah ada dan npm run dev sudah jalan.

---

Selamat menggunakan Schedulein! 🎉
