// Semua library peta dan algoritma rute hanya menggunakan CrootJS versi 0.0.16.
// JavaScript bawaan browser digunakan untuk UI, bukan library peta lain.
import { createMap, addGeoJSON, fitMap, getGeoJSON, onMapClick } from 'https://cdn.jsdelivr.net/gh/crootjs/lib@0.0.16/map.min.js';
import { addMarker } from 'https://cdn.jsdelivr.net/gh/crootjs/lib@0.0.16/mapmarker.min.js';
import { findRoute } from 'https://cdn.jsdelivr.net/gh/crootjs/lib@0.0.16/georoute.min.js';
import { onClick, setInnerText } from 'https://cdn.jsdelivr.net/gh/crootjs/lib@0.0.16/element.min.js';

const ID = 'peta';
const LOKASI = {
  pintu: [107.5756005, -6.8759056],
  simpang: [107.5770125, -6.8765357],
  tengah: [107.577563, -6.8778339],
  selatan: [107.5793283, -6.8786286]
};
const RUPIAH = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

let jalan = null;
let ruteAktif = null;
let hapusRute = () => {};

createMap(ID, { center: [107.577, -6.877], zoom: 16 });
const asalPin = addMarker(ID, LOKASI.pintu, {
  label: 'A • Jemput', color: '#149562', draggable: true,
  title: 'Geser titik penjemputan', onDragEnd: gambarRute
});
const tujuanPin = addMarker(ID, LOKASI.selatan, {
  label: 'B • Tujuan', color: '#e64b62', draggable: true,
  title: 'Geser tujuan', onDragEnd: gambarRute
});

// Fungsi CrootJS menangani event tombol.
onClick('reset', () => {
  document.getElementById('asal').value = 'pintu';
  document.getElementById('tujuan').value = 'selatan';
  asalPin.setPosition(LOKASI.pintu);
  tujuanPin.setPosition(LOKASI.selatan);
  gambarRute(true);
});
onClick('download', () => {
  if (!ruteAktif) return tampilStatus('Belum ada rute untuk diunduh.', true);
  const geojson = { type: 'FeatureCollection', features: [ruteAktif] };
  const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = 'rute-ojek-simulasi.geojson';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 500);
});
for (const key of ['asal', 'tujuan']) {
  document.getElementById(key).addEventListener('change', () => {
    asalPin.setPosition(LOKASI[document.getElementById('asal').value]);
    tujuanPin.setPosition(LOKASI[document.getElementById('tujuan').value]);
    gambarRute(true);
  });
}
onMapClick(ID, (posisi) => { tujuanPin.setPosition(posisi); gambarRute(); });

getGeoJSON('./data/jalan.geojson', (response) => {
  if (!response.data) {
    tampilStatus('Gagal memuat data/jalan.geojson. Jalankan via server HTTP/GitHub Pages.', true);
    return;
  }
  jalan = response.data;
  setInnerText('ruas', `${jalan.features.length} ruas`);
  addGeoJSON(ID, jalan, {
    style: { stroke: '#718a9a', strokeWidth: 3, strokeOpacity: 0.75 },
    popup: (fitur) => fitur.properties?.nama || 'Jalan'
  });
  gambarRute(true);
});

function tampilStatus(pesan, error = false) {
  setInnerText('status', pesan);
  document.getElementById('status').classList.toggle('error', error);
}
function hitungTarifSimulasi(meter) {
  const kilometerTambahan = Math.ceil(Math.max(0, meter - 2000) / 1000);
  return 10000 + kilometerTambahan * 2500;
}
function gambarRute(sesuaikanTampilan = false) {
  if (!jalan) return;
  const awal = asalPin.getPosition();
  const akhir = tujuanPin.getPosition();
  hapusRute();
  hapusRute = () => {};
  ruteAktif = findRoute(awal, akhir, jalan);
  if (!ruteAktif) {
    setInnerText('jarak', 'Tidak tersedia');
    setInnerText('harga', '—');
    tampilStatus('Tidak ada jalur terhubung. Pilih titik di jaringan jalan yang tersedia.', true);
    return;
  }
  const meter = ruteAktif.properties.distance;
  const ongkos = hitungTarifSimulasi(meter);
  ruteAktif.properties.ongkos_simulasi_idr = ongkos;
  ruteAktif.properties.catatan = 'Bukan tarif aktual Gojek';
  hapusRute = addGeoJSON(ID, ruteAktif, {
    style: { stroke: '#0a8eaa', strokeWidth: 7 },
    popup: () => `Rute terpendek: ${Math.round(meter)} meter • estimasi ${RUPIAH.format(ongkos)}`
  });
  if (sesuaikanTampilan) fitMap(ID, ruteAktif, 95);
  setInnerText('jarak', meter >= 1000 ? `${(meter / 1000).toFixed(2)} km` : `${Math.round(meter)} m`);
  setInnerText('harga', RUPIAH.format(ongkos));
  tampilStatus('Rute berhasil dihitung menggunakan jaringan jalan GeoJSON.');
}
