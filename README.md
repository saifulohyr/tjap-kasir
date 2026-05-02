# Tjap Chacoh POS (Point of Sale)

Sistem Kasir Modern yang dirancang khusus untuk kedai kopi **Tjap Chacoh**. Dibangun menggunakan **Next.js 14**, **Tailwind CSS**, dan **Supabase** untuk integrasi database real-time.

## 🚀 Fitur Utama

- **Hardware Integration**: Cetak struk langsung ke *Thermal Bluetooth Printer* (ESC/POS) menggunakan Web Bluetooth API.
- **Dine-in & Takeaway**: Alur pemesanan yang fleksibel dengan penanda status pada setiap struk.
- **Multipayment**: Mendukung pembayaran Tunai (Cash) dan QRIS (Statik).
- **Analytics Dashboard**: Pantau pendapatan harian, item terlaris, dan rincian metode pembayaran secara real-time.
- **Draft Management**: Simpan pesanan pelanggan sebagai draft jika belum ingin langsung dibayar.
- **Security**: Akses dashboard yang dilindungi oleh PIN Kasir.

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Lucide Icons, Framer Motion.
- **State Management**: Zustand.
- **Backend/Database**: Supabase (PostgreSQL).
- **Styling**: Vanilla CSS & Tailwind CSS.
- **Hardware Communication**: Web Bluetooth API + ESC/POS Command Generator.

## 📦 Instalasi & Pengembangan Lokal

1. Clone repositori:
   ```bash
   git clone https://github.com/saifulohyr/tjap-kasir.git
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Setup Environment Variables: Buat file `.env.local` dan isi dengan kredensial Supabase Anda:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```

## 📄 Struktur Proyek

- `src/app`: Halaman-halaman utama (POS, Analytics, Inventory, Login).
- `src/components`: Komponen UI modular (PaymentModal, ProductCard, Sidebar, dll).
- `src/utils`: Utilitas logika (ESC/POS Generator, date formatter).
- `src/store`: State management menggunakan Zustand.
- `src/hooks`: Custom hooks untuk integrasi hardware (Web Bluetooth).

## 🖨️ Panduan Cetak Bluetooth

Pastikan Anda menggunakan browser yang mendukung **Web Bluetooth API** (Chrome/Edge versi stabil). 
1. Klik tombol **"Connect Bluetooth Printer"** pada layar konfirmasi pembayaran.
2. Pilih printer thermal Bluetooth dari daftar perangkat.
3. Klik **"Cetak Struk"** untuk mencetak secara instan tanpa dialog browser.

---
Dikembangkan oleh Tim Engineering Tjap Chacoh.
