# GeoRoute — Rute Ojek Simulasi GeoJSON dengan CrootJS

Aplikasi peta statis untuk tugas SIG: jaringan jalan berbentuk **GeoJSON LineString**, rute terpendek dengan **CrootJS saja** (tanpa Leaflet/Mapbox/Google Maps JS), tarif minimum simulasi Rp10.000, dan hosting **GitHub Pages**.

## Fitur
- Peta dan polyline jalan dengan `map.js` CrootJS.
- Pemilihan dua titik lokasi via dropdown, marker A/B draggable, klik peta mengubah B.
- Perhitungan jalur terpendek (`georoute.js`) dan jarak dari GeoJSON jalan.
- Simulasi ongkos: Rp10.000 untuk 2 km pertama; Rp2.500 per km tambahan (dibulatkan ke atas).
- Ekspor hasil rute sebagai GeoJSON.

> Ini tugas demonstrasi SIG, **bukan layanan Gojek resmi**. CrootJS `findRoute()` mengasumsikan jalan dua arah dan mengoptimalkan jarak, tidak mengetahui kemacetan, satu arah, atau biaya resmi layanan.

## Struktur
```
index.html
style.css
main.js
data/jalan.geojson
.nojekyll
README.md
TUTORIAL_MEDIUM2.md
```

## Menjalankan
Jalankan HTTP static server dari direktori proyek, misalnya `python -m http.server 8000`, lalu buka `http://localhost:8000`. **Jangan buka lewat `file://`** karena GeoJSON diambil melalui fetch.

## Deploy ke GitHub Pages
1. Buat repo baru atau upload file-file ini ke root repo publik.
2. Buka **Settings → Pages → Build and deployment**.
3. Pilih **Deploy from a branch → main/master → / (root) → Save**.
4. Buka halaman yang terbit di `https://USERNAME.github.io/NAMA_REPO/`.

## Mengganti dengan data dari geojson.io
Buka <https://geojson.io/>, gambar jalur **Polyline** sepanjang jalan, pastikan jalan yang bersimpangan memakai vertex sama, simpan **Save → GeoJSON** lalu gunakan nama `data/jalan.geojson`. Titik lokasi awal/tujuan di `main.js` juga harus disesuaikan agar berada di wilayah jalan.

## Sumber dan lisensi data
Koordinat jalan contoh diadaptasi dari proyek [crootjs/examples/geo/route](https://github.com/crootjs/examples/tree/main/geo/route), yang mengatribusikan OpenStreetMap contributors (ODbL). Peta dasar menggunakan tile OpenStreetMap via library CrootJS, atribusi © OpenStreetMap contributors harus tetap terlihat.

Referensi: <https://croot.js.org/docs/map>, <https://croot.js.org/docs/georoute>, <https://croot.js.org/docs/mapmarker>.
