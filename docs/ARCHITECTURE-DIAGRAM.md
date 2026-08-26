# Arsitektur Aplikasi PRIMA (Flutter + WebView + Next.js)

Berikut adalah gambar ilustrasi arsitektur terbaru yang sudah **ditambahkan dengan alur cron-job.org** untuk Bapak jadikan acuan saat menggambar ulang di Canva.

![Arsitektur PRIMA dengan Cronjob](file:///C:/Users/acer/.gemini/antigravity-ide/brain/c9edc301-e9f3-44af-ad78-28846ad45798/flutter_webview_cron_architecture_1787722997691.jpg)

### Panduan Komponen untuk di Canva:
1. **Sisi Kiri Bawah (Flutter App):** Aplikasi *native* di HP petambak yang memuat `WebView` (website PRIMA).
2. **Sisi Kanan Bawah (Supabase):** Database PostgreSQL tempat jadwal Anco (`active_timers`) disimpan.
3. **Sisi Tengah Bawah (Next.js Web App):** Otak sistem (API & Frontend).
4. **Sisi Kanan Atas (Cron-job.org):** Ikon Jam/Gir. Fungsinya "mengetuk pintu" / *trigger* API Next.js secara berkala (misal tiap 5 menit). Panah mengarah ke Next.js.
5. **Sisi Kiri Atas (Firebase):** Setelah Next.js dibangunkan oleh Cronjob, Next.js menyuruh Firebase mengirimkan *Push Notification*. Panah dari Next.js ke Firebase, lalu dari Firebase menukik ke HP pengguna (Flutter).

*Desain ini sangat menggambarkan flow notifikasi eskalasi secara utuh. Selamat mendesain di Canva, Pak!*
