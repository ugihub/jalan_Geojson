# Membuat Peta Rute Ojek Online dengan GeoJSON dan CrootJS: Simulasi Ongkos Mulai Rp10.000

**Topik:** Sistem Informasi Geografis (SIG), GeoJSON, CrootJS, JavaScript, GitHub Pages\
**Kode sumber:** https://github.com/ugihub/geojson/tree/master/docs

## Pendahuluan

Dalam tugas Sistem Informasi Geografis (SIG), saya membuat aplikasi peta digital untuk memvisualisasikan polyline jalan, memilih lokasi awal serta tujuan, lalu menghitung jalur terpendek berdasarkan jaringan jalan GeoJSON. Aplikasi ini menggunakan **CrootJS sebagai satu-satunya library JavaScript** untuk peta dan routing, kemudian disiapkan agar bisa dipublikasikan lewat GitHub Pages.

Untuk mempraktikkan penggunaan rute, saya menambahkan **simulasi ongkos ojek online dengan tarif minimal Rp10.000**. Ini adalah rumus contoh untuk pembelajaran, **bukan harga resmi Gojek dan bukan layanan pemesanan kendaraan**.

## 1. Menyiapkan alat dan proyek

Siapkan browser, editor kode (misalnya VS Code), akun GitHub, serta akses ke [geojson.io](https://geojson.io/) dan [dokumentasi CrootJS](https://croot.js.org/). Aplikasi menggunakan HTML, CSS, JavaScript ES Modules bawaan browser, serta data GeoJSON. Tidak diperlukan framework frontend, backend, maupun database.

Pada proyek yang saya gunakan, file tersusun sebagai berikut:

```text
geojson/
├── 7141240016.geojson     # data GeoJSON tugas sebelumnya
├── readme.md
└── docs/
    ├── index.html
    ├── index.js
    ├── style.css
    ├── jalan.geojson      # jaringan jalan untuk routing
    └── README.md
```

Folder `docs/` digunakan sebagai sumber publikasi GitHub Pages. File GeoJSON lama pada root repository tidak perlu dihapus.

## 2. Membuat polyline jalan di geojson.io

1. Buka [geojson.io](https://geojson.io/) dan arahkan peta ke kawasan yang akan didigitalisasi.
2. Pilih alat menggambar garis (*polyline*) dan ikuti bentuk jalan sesuai lokasi.
3. Pada titik persimpangan yang terhubung, gunakan vertex dengan koordinat sama agar algoritma mengenalinya sebagai satu jaringan.
4. Lengkapi properties, misalnya `nama` dan `jenis` jalan, bila diperlukan.
5. Simpan hasilnya sebagai GeoJSON dengan nama `jalan.geojson`.

Contoh format GeoJSON jaringan jalan:

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {"nama": "Jalan Contoh"},
      "geometry": {
        "type": "LineString",
        "coordinates": [
          [107.5756005, -6.8759056],
          [107.5761533, -6.8761523],
          [107.5766105, -6.8763563]
        ]
      }
    }
  ]
}
```

Koordinat GeoJSON mengikuti urutan `[longitude, latitude]`. Pastikan file jalan mengandung `LineString`/`MultiLineString` dan ruas yang saling menyambung; polygon bangunan tidak otomatis menjadi jaringan rute. Pada aplikasi ini, data demonstrasi `jalan.geojson` berasal dari contoh CrootJS untuk area sekitar ULBI/Sarijadi dengan atribusi kontributor OpenStreetMap.

## 3. Menyiapkan HTML dan CSS

Dalam `docs/index.html`, siapkan elemen peta dan output hasil perhitungan:

```html
<link rel="stylesheet" href="style.css">
<script type="module" src="index.js"></script>

<div id="map" class="map"></div>
<output id="status">Memuat data jalan...</output>
<output id="ongkos">Rp10.000</output>
```

Pada `docs/style.css`, berikan tinggi pada container agar petanya tampil:

```css
.map {
  height: 420px;
  overflow: hidden;
  border-radius: 8px;
}
```

Kode HTML lengkap terdapat di repository. JavaScript tidak perlu ditulis sebagai event handler inline.

## 4. Mengimpor modul resmi CrootJS

Library diimpor dari repository resmi `crootjs/lib` melalui CDN jsDelivr, menggunakan **versi tetap `0.0.16` dan file `.min.js` untuk produksi**. jsDelivr menghasilkan versi minifikasi secara otomatis, sehingga URL seperti `map.min.js` tetap tersedia meskipun berkas tersebut tidak disimpan di repository. Gunakan file `.js` saat membaca atau men-debug source, dan hindari `@latest` agar versi library tidak berubah tanpa disengaja.

```js
import {
  createMap, addGeoJSON, fitMap, onMapClick, getGeoJSON
} from "https://cdn.jsdelivr.net/gh/crootjs/lib@0.0.16/map.min.js";

import { addMarker } from "https://cdn.jsdelivr.net/gh/crootjs/lib@0.0.16/mapmarker.min.js";
import { addScaleBar, addLocateButton, addTrackButton } from "https://cdn.jsdelivr.net/gh/crootjs/lib@0.0.16/mapcontrol.min.js";
import { findRoute, getDistance } from "https://cdn.jsdelivr.net/gh/crootjs/lib@0.0.16/georoute.min.js";
import { setInnerText } from "https://cdn.jsdelivr.net/gh/crootjs/lib@0.0.16/element.min.js";
```

Lima modul tersebut seluruhnya merupakan bagian dari CrootJS. Tidak digunakan Leaflet, Turf.js, Mapbox GL JS, OpenLayers, atau jQuery. Gambar peta dasar OpenStreetMap dimuat oleh modul `map.js` CrootJS; tile gambar bukan library JavaScript tambahan.

## 5. Menampilkan jaringan jalan dan memilih rute

Di `docs/index.js`, buat peta dan marker awal serta tujuan. Modul `mapmarker.js` menyediakan marker yang bisa digeser.

```js
createMap("map", { center: [107.5759, -6.8736], zoom: 16 });
addScaleBar("map");
addLocateButton("map");
addTrackButton("map");

let roads = null;
let removeRoute = () => {};

const start = addMarker("map", [107.5760061, -6.8729768], {
  color: "#16a34a", label: "A", draggable: true, onDragEnd: showRoute
});
const end = addMarker("map", [107.5772, -6.8752], {
  color: "#dc2626", label: "B", draggable: true, onDragEnd: showRoute
});

onMapClick("map", position => {
  end.setPosition(position);
  showRoute();
});

getGeoJSON("jalan.geojson", response => {
  if (!response.data) {
    setInnerText("status", "Data jalan gagal dimuat.");
    return;
  }
  roads = response.data;
  addGeoJSON("map", roads, {
    style: { stroke: "#6b7280", strokeWidth: 2, strokeOpacity: 0.5 },
    popup: false
  });
  showRoute();
});
```

Setelah data berhasil dibaca, pemindahan marker akan memanggil `showRoute()`. Karena `jalan.geojson` berada di folder yang sama dengan `index.html`, alamat relatifnya adalah `jalan.geojson`.

## 6. Menghitung rute dan simulasi ongkos

Fungsi `findRoute()` dari CrootJS mencari jalur terpendek melalui jaringan `LineString` yang diberikan, lalu mengembalikan fitur `LineString` dengan `properties.distance` (meter) ketika berhasil. Berikut **inti** fungsi perhitungannya:

```js
function showRoute() {
  if (!roads) return;
  const from = start.getPosition();
  const to = end.getPosition();
  const route = findRoute(from, to, roads);

  removeRoute();
  removeRoute = () => {};
  if (!route || !Number.isFinite(route.properties?.distance)) {
    setInnerText("status", "Rute tidak ditemukan atau jarak tidak valid.");
    setInnerText("ongkos", "—");
    return;
  }

  removeRoute = addGeoJSON("map", route, {
    style: { stroke: "#2563eb", strokeWidth: 5 }, popup: false
  });

  const meter = route.properties.distance;
  const tarif = 10000 + Math.ceil(Math.max(0, meter - 2000) / 1000) * 2500;
  setInnerText("ongkos", new Intl.NumberFormat("id-ID", {
    style: "currency", currency: "IDR", maximumFractionDigits: 0
  }).format(tarif));
  setInnerText("status", `Jarak rute: ${(meter / 1000).toFixed(2)} km`);
}
```

Rumus tersebut menetapkan Rp10.000 untuk perjalanan sampai 2 km dan tambahan Rp2.500 untuk setiap kilometer berikutnya, dibulatkan ke atas. Tarif dihitung dari jarak **melalui jaringan jalan**, bukan jarak garis lurus. Implementasi lengkap pada GitHub juga menampilkan perbandingan jarak lurus dan menyesuaikan posisi peta ke rute pertama.

## 7. Menguji aplikasi secara lokal

Jalankan server HTTP statis dari dalam folder `docs/`:

```bash
cd docs
python -m http.server 8000
```

Buka `http://localhost:8000/`. Periksa apakah peta dan polyline tampil, marker dapat digeser, klik peta memindahkan tujuan, rute diperbarui, dan biaya selalu minimal Rp10.000 jika rute valid. Pembukaan HTML secara langsung lewat `file://` tidak disarankan karena permintaan file GeoJSON membutuhkan konteks HTTP.

**Catatan pengujian:** contoh kode dan jaringan jalan sudah diperiksa secara statis. Pengujian tampilan dan interaksi di browser tetap perlu dilakukan setelah aplikasi dijalankan.

## 8. Mempublikasikan melalui GitHub Pages

Pada repository [ugihub/geojson](https://github.com/ugihub/geojson):

1. Buka **Settings → Pages**.
2. Pada bagian **Build and deployment**, pilih **Deploy from a branch**.
3. Atur branch **`master`** dan folder **`/docs`**.
4. Klik **Save**, kemudian pastikan proses deployment berhasil.
5. Setelah aktif, alamat publik yang diharapkan adalah **https://ugihub.github.io/geojson/**.

Alamat di atas adalah pola URL GitHub Pages dan perlu dicek sebelum dikumpulkan sebagai tautan website aktif. Jangan memilih `/ (root)` karena aplikasi terbaru berada dalam folder `docs/`.

## 9. Hasil dan keterbatasan

Aplikasi memperlihatkan jaringan jalan vektor, titik A dan B, rute terpendek, panjang perjalanan, serta simulasi biaya. CrootJS menghitung rute berdasarkan GeoJSON yang disediakan, bukan lewat API navigasi maupun sistem pemesanan Gojek. Karena itu, hasilnya tidak mempertimbangkan kondisi lalu lintas, aturan jalan satu arah, ketersediaan driver, atau tarif aktual.

## Kesimpulan

Praktikum ini memperlihatkan bahwa polyline GeoJSON dapat dipakai sebagai jaringan rute pada aplikasi peta web. CrootJS menangani tampilan peta, marker, kontrol, pemuatan GeoJSON, dan perhitungan jalur tanpa tambahan library JavaScript lain. GitHub Pages menyediakan hosting statis untuk hasil tugas.

## Referensi

- Dokumentasi CrootJS: https://croot.js.org/
- Source CrootJS: https://github.com/crootjs/lib
- Contoh peta dan routing CrootJS: https://github.com/crootjs/examples/tree/main/geo/route
- Editor GeoJSON: https://geojson.io/
- Konfigurasi GitHub Pages: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- Hak cipta data OpenStreetMap: https://www.openstreetmap.org/copyright

**Tautan source code:** https://github.com/ugihub/geojson/tree/master/docs\
**Tautan website GitHub Pages:** https://ugihub.github.io/geojson/ *(periksa status deployment sebelum dipublikasikan di Medium)*

---

**Saran sebelum publish:** tambahkan screenshot peta, tampilan rute A–B, dan estimasi Rp10.000 dari hasil pengujian browser yang sebenarnya. Artikel Medium dapat dibuat di https://medium.com/new-story. URL artikel baru tersedia setelah proses Publish selesai.
