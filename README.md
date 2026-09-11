# TRC Brand Deals — Dashboard Analytics

Dashboard evaluasi 360° workflow inbound WhatsApp brand deals TRC. Semua angka
di-generate otomatis dari data percakapan lewat endpoint `stats` Pureva API —
tidak ada laporan manual yang ditulis orang yang dievaluasi.

Dua halaman, dipilih lewat sidebar:

| Halaman | Isi |
| --- | --- |
| **Dashboard** ([`app/page.tsx`](app/page.tsx)) | Enam blok visualisasi + filter |
| **Knowledge** ([`app/knowledge/`](app/knowledge/)) | Chatbot internal untuk menanyakan kondisi brand deal |

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
  knowledge.ts CRUD thread Knowledge + pembuka stream jawaban
lib/
  format.ts          durasi, tanggal, angka, preset rentang, tick sumbu
  chart-series.ts    definisi seri & warna (dipakai chart + legend di server)
  types.ts           StatusName, isSuccessStatus, metapaging
  knowledge-stream.ts parser SSE + streamChat() untuk sisi klien
app/
  page.tsx                 dashboard
  knowledge/               halaman chat + server action rename/hapus
  api/knowledge/chat/      route handler yang mem-proxy stream dari backend
components/
  charts/      client component recharts
  dashboard/   stat tile, filter, tabel
  knowledge/   thread chat, composer, daftar thread, renderer markdown
  layout/      sidebar
  ui/          card, legend, empty state
```

## Knowledge

Tanya-jawab internal tentang kondisi brand deal, di atas data yang sama dengan
dashboard. Halaman `/knowledge` untuk thread baru, `/knowledge/<conv_id>` untuk
thread yang sudah ada.

```
Browser  ──POST /api/knowledge/chat──▶  Route handler  ──▶  Pureva API (SSE)
   ▲                                    (server, pegang                │
   └──────────── token demi token ───────  CLIENT_SECRET) ◀────────────┘
```

Route handler di [`app/api/knowledge/chat/route.ts`](app/api/knowledge/chat/route.ts)
ada supaya `CLIENT_SECRET` dan `TENANT_ID` tetap di server — browser tidak pernah
bicara langsung ke Pureva API, sama seperti jalur data dashboard.

Jawabannya di-stream sebagai Server-Sent Events. Menutup tab tidak membatalkan
jawabannya: backend tetap menyelesaikan dan menyimpannya, jadi thread-nya utuh waktu
dibuka lagi.

Markdown jawaban dirender jadi elemen React lewat
[`components/knowledge/Markdown.tsx`](components/knowledge/Markdown.tsx), bukan lewat
`dangerouslySetInnerHTML`. Jawaban agent mengutip isi pesan WhatsApp dan siapa pun bisa
mengirim pesan ke nomor bisnisnya, jadi HTML di dalam teks tidak boleh punya jalan untuk
dieksekusi.

### Prasyarat

Backend butuh tabel `kb_conversations` dan `kb_chats` (`docs/db/knowledge.sql` di repo
`pureva-api`) plus `OPENAI_API_KEY`. Selama itu belum ada, halaman Knowledge tetap render
dan menampilkan pesan errornya — dashboard tidak terpengaruh.


## Isi dashboard

| Blok | Endpoint |
| --- | --- |
| 4 stat tile (inbound/hari, response median, tanpa balasan, % dalam target) | `stats/summary` |
| Volume percakapan per hari (stacked bar) | `stats/chats-volume` |
| Distribusi lead status (donut) | `stats/lead-status` |
| Response time harian, median + p90 + garis target (line) | `stats/response-time` |
| Kapan inbound masuk, jam × hari (heatmap) | `stats/inbound-heatmap` |
| Brand deal yang sedang berjalan (tabel) | `stats/needs-action/list` |

Semua chart memakai [Recharts](https://recharts.org). Heatmap dibangun dari
`ScatterChart` dengan custom shape, bukan library terpisah.

Filter (rentang tanggal, metrik response, target balas) disimpan di query
string (`?range=30d&mode=all_flat&target=900`), jadi state-nya bisa di-share
lewat URL dan data selalu di-fetch ulang di server.

`mode` memilih definisi yang dipakai **semua** angka response di layar —
stat tile, chart harian, dan persentase dalam target — supaya satu halaman
tidak pernah mencampur dua definisi:

| `mode` | Turn yang diukur | Jeda dihitung |
| --- | --- | --- |
| `first` | turn pembuka tiap percakapan | apa adanya |
| `all_working` | semua turn | hanya Senin–Jumat 09.00–18.00 |
| `all_flat` (default) | semua turn | apa adanya |

Pada `all_working`, turn yang masuk Sabtu 10.00 dan dibalas Senin 09.05 terbaca
5 menit, bukan dua hari. Libur nasional belum dikecualikan — belum ada sumber
datanya, jadi tanggal merah masih terhitung hari kerja. Toggle "Kecualikan
weekend" disembunyikan di mode ini karena jeda akhir pekan memang sudah nol.

Tabel brand deal sengaja lepas dari semua filter itu —
`stats/needs-action/list` mengembalikan semua percakapan yang `brand_name`-nya
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
