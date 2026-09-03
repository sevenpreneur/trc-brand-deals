# TRC Brand Deals — Dashboard Analytics

Dashboard evaluasi 360° workflow inbound WhatsApp brand deals TRC. Semua angka
di-generate otomatis dari data percakapan lewat endpoint `stats` Pureva API —
tidak ada laporan manual yang ditulis orang yang dievaluasi.

Halaman tunggal di [`app/page.tsx`](app/page.tsx) (App Router, server component).

## Setup

```bash
npm install
cp .env.example .env.local   # isi CLIENT_SECRET dan TENANT_ID
npm run dev
```

| Env | Isi |
| --- | --- |
| `BASE_URL` | `https://pureva-api.up.railway.app` |
| `CLIENT_SECRET` | Bearer token statis untuk `/api/v1/stats/*` |
| `TENANT_ID` | Tenant TRC yang di-scope pada tiap request |

Ketiganya hanya dibaca di server ([`apis/api.ts`](apis/api.ts) memakai
`server-only`), jadi tidak pernah ikut ke bundle browser. Kalau salah satu belum
di-set, halaman tetap render dan menampilkan banner error dengan pesan dari API.

## Perintah

```bash
npm run dev
npm run build
npm run start
npm run lint
npx tsc --noEmit -p .   # tidak ada script typecheck terpisah
```

## Struktur

```
apis/
  api.ts     callApi: fetch + Bearer + envelope { success, code, status, message, data }
  stat.ts    wrapper tiap endpoint /api/v1/stats/* + tipe responsnya
lib/
  format.ts        durasi, tanggal, angka, preset rentang, tick sumbu
  chart-series.ts  definisi seri & warna (dipakai chart + legend di server)
  types.ts         StatusName, isSuccessStatus, metapaging
components/
  charts/      client component recharts
  dashboard/   stat tile, filter, tabel
  ui/          card, legend, empty state
```

## Isi dashboard

| Blok | Endpoint |
| --- | --- |
| 4 stat tile (inbound/hari, first response median, tanpa balasan, % dalam target) | `stats/summary` |
| Volume percakapan per hari (stacked bar) | `stats/chats-volume` |
| Distribusi lead status (donut) | `stats/lead-status` |
| First response time harian, median + p90 + garis target (line) | `stats/response-time` |
| Kapan inbound masuk, jam × hari (heatmap) | `stats/inbound-heatmap` |
| Brand deal yang sedang berjalan (tabel) | `stats/needs-action/list` |

Semua chart memakai [Recharts](https://recharts.org). Heatmap dibangun dari
`ScatterChart` dengan custom shape, bukan library terpisah.

Filter (rentang tanggal, target balas) disimpan di query string
(`?range=30d&target=900`), jadi state-nya bisa di-share lewat URL dan data
selalu di-fetch ulang di server. Tabel brand deal sengaja lepas dari filter itu
— `stats/needs-action/list` mengembalikan semua percakapan yang `brand_name`-nya
sudah terisi, bukan potongan periode, supaya deal lama tetap terbaca.

### Belum bisa ditampilkan

Empat elemen di dokumen evaluasi belum punya sumber data di schema saat ini dan
sengaja tidak dibuat-buat angkanya: funnel `Inbound → Qualified → Rate card →
Nego → Closed`, estimasi leakage (Rp), lost reason, dan cycle time inbound →
closed. Semuanya butuh kolom stage/`deal_value`/lost reason pada schema
percakapan lebih dulu.

## Catatan desain

Palet chart mengikuti panduan dataviz dan sudah divalidasi untuk color-vision
deficiency: dua slot kategorikal (biru `--series-1`, oranye `--series-2`) untuk
seri, ramp ordinal satu hue untuk lead status (cold → hot), ramp sequential biru
untuk heatmap, dan token status terpisah yang selalu tampil sebagai ikon +
label. Token-nya ada di [`app/globals.css`](app/globals.css) dengan nilai dark
mode yang dipilih untuk surface gelap, bukan hasil pembalikan otomatis.
