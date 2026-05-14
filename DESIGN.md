\# Design Document — Web Image Processing Studio



\---



\## 1. Ringkasan Proyek



\*\*Nama Aplikasi:\*\* PixelForge — Web Image Processing Studio

\*\*Tipe:\*\* Single Page Application (SPA) + REST API Backend

\*\*Target Pengguna:\*\* Mahasiswa pengolahan citra, researcher, dan desainer yang membutuhkan tools berbasis web



\### Stack Teknologi



| Layer | Teknologi |

|---|---|

| Frontend | Vite + React, Axios, Tailwind CSS |

| Backend | FastAPI, Uvicorn |

| Image I/O | Pillow (hanya decode/encode binary ↔ array) |

| Array Buffer | NumPy (hanya sebagai wadah array, \*\*bukan filter\*\*) |

| Algoritma Citra | \*\*Manual — ditulis sendiri\*\*, tanpa OpenCV / skimage / scipy |



> ⚠️ \*\*Aturan Inti:\*\* Semua algoritma pengolahan citra (konvolusi, transformasi, segmentasi, kompresi, dll.) wajib diimplementasikan manual. Library \*\*hanya boleh digunakan\*\* untuk membaca/menulis file gambar (Pillow) dan menyimpan data piksel sebagai array multidimensi (NumPy).



\---



\## 2. Arsitektur Sistem



```

┌─────────────────────────────────────────────────────────────────┐

│                     FRONTEND (Vite + React)                     │

│                                                                 │

│  ┌───────────┐   ┌──────────────────┐   ┌───────────────────┐  │

│  │ Toolbar   │   │ Canvas Workspace  │   │  Control Panel    │  │

│  │ Menu Bar  │   │  Before | After   │   │  Tabs + Sliders   │  │

│  └───────────┘   └──────────────────┘   └───────────────────┘  │

│                                                                 │

│  ┌──────────────────────────────────────────────────────────┐   │

│  │                   API Service Layer                      │   │

│  │  imageService.js — Axios, multipart/form-data builder    │   │

│  └──────────────────────────────────────────────────────────┘   │

└───────────────────────────┬─────────────────────────────────────┘

&#x20;                           │  HTTP POST multipart/form-data

&#x20;                           │  ← HTTP 200 JSON { image: base64 }

&#x20;                           ▼

┌─────────────────────────────────────────────────────────────────┐

│                      BACKEND (FastAPI)                          │

│                                                                 │

│  ┌──────────────┐   ┌──────────────────────────────────────┐   │

│  │   Routers    │   │         Processing Modules           │   │

│  │  /enhance    │   │  enhancement.py  │  transform.py     │   │

│  │  /transform  │   │  restoration.py  │  edge\_binary.py   │   │

│  │  /restore    │   │  color.py        │  segmentation.py  │   │

│  │  /edge       │   │  compression.py  │  histogram.py     │   │

│  │  /color      │   └──────────────────────────────────────┘   │

│  │  /segment    │                                               │

│  │  /compress   │   ┌──────────────────────────────────────┐   │

│  │  /histogram  │   │           utils/                     │   │

│  └──────────────┘   │  image\_io.py  — Pillow decode/encode │   │

│                     │  array\_ops.py — NumPy wrappers        │   │

│                     │  algorithms.py — konvolusi, affine,  │   │

│                     │    interpolasi, DCT (semua manual)    │   │

│                     └──────────────────────────────────────┘   │

└─────────────────────────────────────────────────────────────────┘

```



\### Prinsip Pemrosesan



\- \*\*Backend-first:\*\* Semua pengolahan piksel terjadi di Python (FastAPI), bukan di browser

\- \*\*Frontend = UI only:\*\* React hanya menampilkan gambar, menerima input pengguna, dan mengirim request

\- \*\*Stateless API:\*\* Setiap request membawa gambar lengkap (tidak ada session state di server)

\- \*\*Satu gambar per request:\*\* Frontend selalu mengirim state gambar terkini sebagai binary



\---



\## 3. Alur Data \& Kontrak API



\### 3.1 Alur Umum Per Operasi



```

1\. User pilih file  →  React simpan sebagai File object (originalFile)

2\. User atur parameter  →  slider/input di Control Panel

3\. User klik "Apply"  →  imageService.js buat FormData:

&#x20;     formData.append("image", fileBlob, "image.png")

&#x20;     formData.append("params", JSON.stringify({ brightness: 30, ... }))

4\. Axios POST ke /api/{modul}/{operasi}

5\. FastAPI terima multipart:

&#x20;     image  →  UploadFile (binary)  →  Pillow decode  →  NumPy array \[H,W,C]

&#x20;     params →  JSON.parse()

6\. Algoritma manual jalankan transformasi pada array

7\. NumPy array  →  Pillow encode  →  bytes  →  base64 string

8\. Return JSON:

&#x20;     { "image": "data:image/png;base64,iVBOR...", "meta": { ... } }

9\. React terima response  →  set ke <img src={...}>  →  tampil di panel After

```



\### 3.2 Format Request



```

POST /api/{modul}/{operasi}

Content-Type: multipart/form-data



Field:

&#x20; image   : binary (file gambar — JPG / PNG / BMP)

&#x20; params  : string (JSON — parameter operasi)

```



Contoh params per operasi:

```json

// Brightness

{ "value": 50 }



// Rotate

{ "angle": 45.0, "interpolation": "bilinear" }



// Edge Detection

{ "method": "canny", "low\_threshold": 50, "high\_threshold": 150 }



// Compression

{ "method": "huffman", "quality": 70 }

```



\### 3.3 Format Response



```json

// Sukses

{

&#x20; "status": "ok",

&#x20; "image": "data:image/png;base64,iVBORw0KGgo...",

&#x20; "meta": {

&#x20;   "width": 800,

&#x20;   "height": 600,

&#x20;   "format": "PNG",

&#x20;   "original\_size\_bytes": 245000,

&#x20;   "output\_size\_bytes": 198000,

&#x20;   "compression\_ratio": 1.24,

&#x20;   "psnr": 38.5

&#x20; }

}



// Error

{

&#x20; "status": "error",

&#x20; "message": "Kernel size must be odd number"

}

```



> `meta` bersifat opsional — hanya diisi jika operasi menghasilkan metadata bermakna (kompresi mengisi `compression\_ratio` dan `psnr`; operasi lain cukup `width` dan `height`).



\### 3.4 Daftar Endpoint API



| Method | Endpoint | Operasi |

|---|---|---|

| POST | `/api/enhance/brightness` | Brightness adjustment |

| POST | `/api/enhance/contrast` | Contrast adjustment |

| POST | `/api/enhance/equalize` | Histogram equalization |

| POST | `/api/enhance/sharpen` | Sharpening |

| POST | `/api/enhance/smooth` | Smoothing / blur |

| POST | `/api/transform/rotate` | Rotasi |

| POST | `/api/transform/flip` | Flip horizontal / vertikal |

| POST | `/api/transform/crop` | Crop area |

| POST | `/api/transform/resize` | Resize / scale |

| POST | `/api/transform/translate` | Translasi |

| POST | `/api/restore/gaussian` | Gaussian blur |

| POST | `/api/restore/median` | Median filter |

| POST | `/api/restore/denoise` | Noise removal (salt \& pepper) |

| POST | `/api/edge/threshold` | Thresholding (manual + Otsu) |

| POST | `/api/edge/detect` | Edge detection (6 metode) |

| POST | `/api/edge/morphology` | Erosion / Dilation |

| POST | `/api/color/grayscale` | RGB → Grayscale |

| POST | `/api/color/split` | Channel split (R, G, B) |

| POST | `/api/color/adjust` | Hue / Saturation |

| POST | `/api/segment/threshold` | Threshold segmentation |

| POST | `/api/segment/edge` | Edge-based segmentation |

| POST | `/api/segment/region` | Region-based segmentation |

| POST | `/api/compress` | Kompresi (semua metode) |

| POST | `/api/histogram` | Hitung \& return data histogram |



\---



\## 4. Aturan Penggunaan Library



\### 4.1 Pillow — Hanya untuk I/O



```python

\# ✅ BOLEH — decode binary → array

from PIL import Image

import io



async def decode\_image(upload: UploadFile) -> np.ndarray:

&#x20;   contents = await upload.read()

&#x20;   img = Image.open(io.BytesIO(contents)).convert("RGB")

&#x20;   return np.array(img, dtype=np.float64)



\# ✅ BOLEH — encode array → base64

def encode\_image(arr: np.ndarray) -> str:

&#x20;   arr\_uint8 = np.clip(arr, 0, 255).astype(np.uint8)

&#x20;   img = Image.fromarray(arr\_uint8)

&#x20;   buffer = io.BytesIO()

&#x20;   img.save(buffer, format="PNG")

&#x20;   b64 = base64.b64encode(buffer.getvalue()).decode()

&#x20;   return f"data:image/png;base64,{b64}"



\# ❌ TIDAK BOLEH — filter dari Pillow

img.filter(ImageFilter.GaussianBlur(radius=2))  # ❌

img.filter(ImageFilter.SHARPEN)                 # ❌

img.resize((w, h), Image.LANCZOS)               # ❌ (gunakan manual)

```



\### 4.2 NumPy — Hanya sebagai Wadah Array



NumPy digunakan \*\*hanya\*\* untuk membaca/menulis nilai piksel secara efisien, bukan untuk komputasi filter.



```python

\# ✅ BOLEH — akses dan manipulasi array dasar

img\[y, x]                           # baca piksel

img\[y, x] = \[255, 0, 0]            # tulis piksel

np.zeros((h, w, 3), dtype=float)   # buat canvas kosong

np.clip(result, 0, 255)            # clamp nilai

np.array(pil\_image)                # konversi dari Pillow

img.shape, img.dtype               # metadata array

output = img.copy()                # copy array



\# ✅ BOLEH — slicing untuk crop

cropped = img\[y1:y2, x1:x2]



\# ❌ TIDAK BOLEH — filter / transform siap pakai

np.fft.fft2(img)                   # ❌ FFT

np.correlate(...)                  # ❌ korelasi

np.convolve(...)                   # ❌ konvolusi

scipy.ndimage.gaussian\_filter()    # ❌ scipy filter

```



> \*\*Aturan praktis:\*\* Jika NumPy dipanggil dengan nama fungsi yang menyebut filter, transform, atau statistik lanjutan — itu tidak boleh. NumPy hanya boleh sebagai array container: indexing, slicing, zeros, copy, clip, astype.



\### 4.3 Yang Wajib Ditulis Manual



Semua logika berikut harus diimplementasikan sendiri dengan loop Python atau operasi array per-elemen:



\- Konvolusi 2D (untuk semua kernel filter)

\- Kernel Gaussian, Sobel, Prewitt, Roberts, Laplacian, LoG

\- Algoritma Canny (NMS, double threshold, hysteresis)

\- Transformasi affine (rotate, scale, translate) + interpolasi

\- Median sort \& selection

\- Histogram equalization (CDF mapping)

\- DCT/IDCT 2D (untuk JPEG simulasi)

\- Huffman tree building \& encoding

\- RLE, LZW, Arithmetic coding

\- K-means clustering (region segmentation)

\- RGB ↔ HSV conversion



\---



\## 5. Layout \& Struktur UI



\### 5.1 Struktur Halaman Utama



```

┌────────────────────────────────────────────────────────────────────┐

│  HEADER — Logo | Menu Bar (File · Edit · Filter · Transform · Help)│

├───────────┬────────────────────────────────┬───────────────────────┤

│           │                                │                       │

│  SIDEBAR  │        CANVAS WORKSPACE        │    CONTROL PANEL      │

│ (Toolbox) │                                │                       │

│           │  ┌──────────┬──────────────┐   │  ┌─────────────────┐  │

│  ○ Select │  │  BEFORE  │    AFTER     │   │  │  Tab Navigator  │  │

│  ○ Crop   │  │          │              │   │  │  Enhancement /  │  │

│  ○ Pan    │  │  \[image] │  \[result]    │   │  │  Transform /    │  │

│  ○ Zoom   │  │          │              │   │  │  Restore / ...  │  │

│           │  └──────────┴──────────────┘   │  └─────────────────┘  │

│  ───────  │                                │                       │

│  HISTORY  │  Zoom: \[──●──] Fit | 1:1 | 2x │  \[Parameter Sliders]  │

│  (Steps)  │                                │                       │

│           │  Status: 800×600 | RGB | 2.4MB │  \[Apply]   \[Reset]    │

└───────────┴────────────────────────────────┴───────────────────────┘

│                    HISTOGRAM PANEL (collapsible)                    │

└────────────────────────────────────────────────────────────────────┘

```



\### 5.2 Zona-Zona UI



| Zona | Ukuran | Konten |

|---|---|---|

| Header / Menu Bar | 48px tinggi | Logo, menu dropdown |

| Sidebar Toolbox | 64px lebar | Icon tools (select, crop, pan, zoom) |

| Canvas Workspace | Fleksibel | Split view Before \\| After, draggable divider |

| Control Panel | 300px lebar | Tabs + sliders + tombol aksi |

| Histogram Panel | 200px tinggi | Collapsible, distribusi Before \& After |

| Status Bar | 28px tinggi | Dimensi, format, ukuran file, koordinat kursor |



\---



\## 6. Komponen UI Detail



\### 6.1 Menu Bar



```

File          Edit          Filter              Transform        Help

├─ Open       ├─ Undo       ├─ Enhancement      ├─ Rotate        ├─ Docs

├─ Save As    ├─ Redo       │  ├─ Brightness     ├─ Flip H/V     └─ About

├─ Reset      └─ History    │  ├─ Contrast       ├─ Crop

└─ Export                   │  ├─ Sharpening     ├─ Resize

&#x20;                           │  └─ Smoothing      └─ Translate

&#x20;                           ├─ Restoration

&#x20;                           │  ├─ Gaussian Blur

&#x20;                           │  ├─ Median Filter

&#x20;                           │  └─ Noise Removal

&#x20;                           ├─ Edge \& Binary

&#x20;                           │  ├─ Threshold

&#x20;                           │  ├─ Edge Detection

&#x20;                           │  └─ Morphology

&#x20;                           ├─ Color

&#x20;                           │  ├─ Grayscale

&#x20;                           │  ├─ Channel Split

&#x20;                           │  └─ Hue/Saturation

&#x20;                           ├─ Segmentation

&#x20;                           └─ Compression

```



\### 6.2 Control Panel — Tabs



\*\*Tab: Enhancement\*\*

\- Slider Brightness (-100 → +100)

\- Slider Contrast (-100 → +100)

\- Tombol: Histogram Equalization

\- Slider Sharpening Intensity (0 → 10)

\- Slider Smoothing / Blur Radius (1 → 20)



\*\*Tab: Transform\*\*

\- Slider Rotate (0° → 360°) + input angka manual

\- Toggle Flip: Horizontal | Vertikal

\- Mode Crop: aktifkan drag area di canvas, kirim koordinat (x1,y1,x2,y2)

\- Input Resize: Width × Height + dropdown (px / %)

\- Input Translate: ΔX, ΔY

\- Dropdown Interpolasi: Nearest Neighbor | Bilinear



\*\*Tab: Restoration\*\*

\- Slider Gaussian Blur σ (0.1 → 10)

\- Slider Median Filter Kernel Size (3 → 15, hanya ganjil)

\- Dropdown Noise Type: Salt \& Pepper | Gaussian | Poisson

\- Slider Noise Threshold



\*\*Tab: Edge \& Binary\*\*

\- Slider Threshold (0 → 255) + toggle Otsu otomatis

\- Dropdown Edge Method: Canny | Sobel | Prewitt | Roberts | Laplacian | LoG

\- Input Canny: Low threshold, High threshold

\- Dropdown Morphologi: Erosion | Dilation

\- Slider Kernel Size morfologi (3 → 15)



\*\*Tab: Color\*\*

\- Tombol Convert → Grayscale

\- Tombol Channel Split (tampil 3 preview R, G, B terpisah)

\- Slider Hue (-180 → +180)

\- Slider Saturation (-100 → +100)



\*\*Tab: Segmentation\*\*

\- Dropdown Mode: Threshold | Edge-based | Region-based

\- Slider Threshold Segmentasi

\- Slider Region Sensitivity / Jumlah Cluster K



\*\*Tab: Compression\*\*

\- Dropdown Metode: JPEG Sim | Huffman | Arithmetic | LZW | RLE | Kuantisasi

\- Slider Kualitas / Level (1 → 100)

\- Info panel: ukuran asli, ukuran output, rasio kompresi, PSNR

\- Tombol: Preview | Download



\---



\## 7. Spesifikasi Teknis Algoritma (Backend)



\### 7.1 Image I/O



```

LOAD:

&#x20; User pilih file (JPG/PNG/BMP)

&#x20; → React: File object → kirim via FormData (binary)

&#x20; → FastAPI: UploadFile.read() → Pillow Image.open() → np.array() → float64 \[H,W,3]



SAVE:

&#x20; FastAPI: float64 array → np.clip(0,255).astype(uint8)

&#x20; → Pillow Image.fromarray() → BytesIO → base64 encode

&#x20; → JSON response → React: <img src="data:image/png;base64,...">

&#x20; → User klik Download → convert base64 → Blob → trigger download browser

```



\### 7.2 Image Enhancement



| Fitur | Algoritma Manual |

|---|---|

| Brightness | `out\[y,x,c] = clamp(img\[y,x,c] + delta, 0, 255)` |

| Contrast | `out\[y,x,c] = clamp((img\[y,x,c] - 128) \* factor + 128, 0, 255)` |

| Histogram Equalization | Hitung histogram → CDF → normalisasi → remap: `out = (CDF\[pixel] - CDF\_min) / (H\*W - CDF\_min) \* 255` |

| Sharpening | Konvolusi manual dengan kernel Laplacian unsharp mask |

| Smoothing | Konvolusi manual dengan kernel box atau Gaussian |



\### 7.3 Geometric Transformation



\*\*Matriks Affine Gabungan:\*\*

```

\[a  b  tx]   \[sx\*cosθ  -sy\*sinθ  tx]

\[c  d  ty] = \[sx\*sinθ   sy\*cosθ  ty]

\[0  0   1]   \[0          0        1]

```



Untuk setiap piksel output `(x', y')`, hitung koordinat sumber `(x, y)` dengan inverse matrix, lalu ambil nilai piksel dengan interpolasi.



| Fitur | Teknis |

|---|---|

| Rotate | Inverse affine rotation, titik pusat sebagai origin |

| Flip H | `out\[y, x] = img\[y, W-1-x]` |

| Flip V | `out\[y, x] = img\[H-1-y, x]` |

| Crop | Slicing array: `img\[y1:y2, x1:x2]` |

| Resize | Scale matrix affine + interpolasi pilihan pengguna |

| Translate | `out\[y+dy, x+dx] = img\[y, x]` dengan boundary check |



\*\*Interpolasi:\*\*

\- \*\*Nearest Neighbor:\*\* `pixel = img\[round(src\_y), round(src\_x)]`

\- \*\*Bilinear:\*\* Rata-rata tertimbang 4 piksel tetangga berdasarkan jarak subpiksel



\### 7.4 Image Restoration



\*\*Konvolusi 2D Manual (digunakan oleh semua filter berbasis kernel):\*\*

```python

def convolve2d(img, kernel):

&#x20;   kh, kw = kernel.shape

&#x20;   pad\_h, pad\_w = kh // 2, kw // 2

&#x20;   output = np.zeros\_like(img)

&#x20;   padded = pad\_array(img, pad\_h, pad\_w)   # zero-padding manual

&#x20;   for y in range(img.shape\[0]):

&#x20;       for x in range(img.shape\[1]):

&#x20;           region = padded\[y:y+kh, x:x+kw]

&#x20;           output\[y, x] = clamp(

&#x20;               sum\_elementwise(region \* kernel), 0, 255

&#x20;           )

&#x20;   return output

```



| Fitur | Teknis |

|---|---|

| Gaussian Blur | Bangun kernel Gaussian manual: `G(x,y) = (1/2πσ²) \* e^(-(x²+y²)/2σ²)`, normalisasi, lalu konvolusi |

| Median Filter | Per piksel: kumpulkan nilai dalam window kernel → sort manual → ambil median (index tengah) |

| Salt \& Pepper Removal | Deteksi piksel ekstrem (< 10 atau > 245) → ganti dengan median tetangga |



\### 7.5 Binary \& Edge Processing



\*\*Thresholding:\*\*

\- Manual: `out\[y,x] = 255 if img\[y,x] > T else 0`

\- Otsu: Hitung variance inter-class untuk semua nilai T (0–255), pilih T dengan variance tertinggi



\*\*Edge Detection:\*\*



| Metode | Kernel / Algoritma |

|---|---|

| Sobel | `Gx=\[-1,0,1;-2,0,2;-1,0,1]`, `Gy=Gx.T`, magnitude = `sqrt(Gx²+Gy²)` |

| Prewitt | `Gx=\[-1,0,1;-1,0,1;-1,0,1]`, `Gy=Gx.T` |

| Roberts | `Gx=\[1,0;0,-1]`, `Gy=\[0,1;-1,0]` — diagonal 2×2 |

| Laplacian | `\[0,1,0;1,-4,1;0,1,0]` — satu kernel |

| LoG | Gaussian blur manual → Laplacian manual |

| Canny | 1) Gaussian blur → 2) Sobel gradient → 3) NMS → 4) Double threshold → 5) Hysteresis tracking |



\*\*Morphologi (binary image):\*\*

\- \*\*Erosion:\*\* `out\[y,x] = 1` hanya jika semua piksel dalam kernel = 1

\- \*\*Dilation:\*\* `out\[y,x] = 1` jika ada satu piksel dalam kernel = 1



\### 7.6 Color Processing



| Fitur | Formula |

|---|---|

| RGB → Grayscale | `Y = 0.299R + 0.587G + 0.114B` |

| Channel Split | Kembalikan 3 array: `R=\[R,0,0]`, `G=\[0,G,0]`, `B=\[0,0,B]` |

| RGB → HSV (manual) | `V=max(R,G,B)`, `S=(V-min)/V`, `H` dari sudut komponen dominan |

| HSV → RGB (manual) | Hitung sektor H → interpolasi komponen → assign ke R,G,B |

| Hue Adjust | Konversi ke HSV → `H = (H + delta) % 360` → balik ke RGB |

| Saturation Adjust | Konversi ke HSV → `S = clamp(S \* factor, 0, 1)` → balik ke RGB |



\### 7.7 Image Segmentation



| Mode | Teknis |

|---|---|

| Threshold-based | Binarisasi → connected component labeling manual (flood fill / BFS) |

| Edge-based | Canny edge → closing morfologi → flood fill tiap region tertutup |

| Region-based | K-means manual: inisialisasi centroid → assign piksel ke cluster terdekat → update centroid → iterasi hingga konvergen |



\### 7.8 Image Compression



| Metode | Implementasi Manual |

|---|---|

| JPEG Simulasi | Split 8×8 blok → DCT-2D manual → Kuantisasi dengan Q-matrix → IDCT-2D → rekonstruksi |

| Kuantisasi | Kurangi bit depth: `out = round(pixel / step) \* step` dimana `step = 2^(8-bits)` |

| RLE | Scan baris piksel grayscale → encode pasangan (nilai, jumlah\_berturut) |

| Huffman | Hitung frekuensi intensitas → bangun binary tree → assign kode → hitung bits total → compression ratio |

| Arithmetic Coding | Hitung probabilitas → encoding interval → simulasikan bits output dan compression ratio |

| LZW | Dictionary encoding pada data piksel → simulasikan compression ratio |



> Untuk Huffman, Arithmetic, dan LZW: tujuan utama adalah \*\*simulasi dan analisis\*\* (compression ratio, entropy, PSNR). Output gambar dikembalikan dari JPEG simulasi atau Kuantisasi; metode lain mengembalikan statistik kompresi saja.



\*\*DCT-2D Manual:\*\*

```python

def dct2d(block):

&#x20;   N = 8

&#x20;   result = np.zeros((N, N))

&#x20;   for u in range(N):

&#x20;       for v in range(N):

&#x20;           sum\_val = 0.0

&#x20;           for x in range(N):

&#x20;               for y in range(N):

&#x20;                   sum\_val += (block\[x, y]

&#x20;                       \* cos((2\*x+1)\*u\*pi / (2\*N))

&#x20;                       \* cos((2\*y+1)\*v\*pi / (2\*N)))

&#x20;           cu = 1/sqrt(2) if u == 0 else 1

&#x20;           cv = 1/sqrt(2) if v == 0 else 1

&#x20;           result\[u, v] = (2/N) \* cu \* cv \* sum\_val

&#x20;   return result

```



\### 7.9 Histogram Analysis



\- Backend hitung distribusi frekuensi intensitas (0–255) per channel (R, G, B, Grayscale)

\- Return sebagai array JSON: `{ "red": \[12, 45, ...], "green": \[...], "blue": \[...], "gray": \[...] }`

\- Frontend render histogram menggunakan `<canvas>` React component (bar chart manual) atau Chart.js

\- Statistik ikut di-return: mean, std dev, min, max per channel

\- Panel histogram menampilkan Before \& After side-by-side



\---



\## 8. Desain Visual \& Estetika



\### 8.1 Tema \& Palet Warna



Tema: \*\*Industrial Dark\*\* — profesional, dense, mirip Adobe Photoshop / GIMP



```

Background Utama  : #1a1a2e  (navy gelap)

Panel Sidebar     : #16213e

Panel Kanan       : #0f3460

Accent Utama      : #e94560  (merah koral — tombol aksi, highlight aktif)

Accent Sekunder   : #533483  (ungu — hover state)

Teks Utama        : #eaeaea

Teks Sekunder     : #a0a0b0

Border / Divider  : #2d2d4a

Success           : #00d9b5  (teal — operasi berhasil)

Warning           : #f5a623  (amber — request sedang diproses)

Error             : #ff4d6d  (merah terang — response error dari API)

```



\### 8.2 Tipografi



```

Display / Logo  : "Space Mono" — monospace tegas

UI Label        : "IBM Plex Sans" — bersih, technical

Angka / Data    : "JetBrains Mono" — nilai piksel, koordinat, stats

```



\### 8.3 Komponen Visual



\- \*\*Tombol Apply:\*\* Background accent merah, rounded 4px, disabled + spinner saat request berlangsung

\- \*\*Loading State:\*\* Overlay semi-transparan di canvas After + spinner — muncul selama API call

\- \*\*Slider:\*\* Custom track gelap dengan thumb berwarna accent

\- \*\*Panel:\*\* Subtle glassmorphism `backdrop-filter: blur(8px)`, border 1px transparan

\- \*\*Tab Aktif:\*\* Underline accent merah + teks putih

\- \*\*Toast:\*\* Muncul di pojok kanan bawah — sukses (teal), error (merah), loading (amber)



\---



\## 9. Interaksi \& UX



\### 9.1 Keyboard Shortcuts



| Shortcut | Aksi |

|---|---|

| `Ctrl+O` | Buka gambar |

| `Ctrl+S` | Simpan / Download hasil |

| `Ctrl+Z` | Undo (load step sebelumnya) |

| `Ctrl+R` | Reset ke gambar awal |

| `H` | Toggle histogram panel |

| `Space+Drag` | Pan canvas |

| `Scroll` | Zoom in/out canvas |



\### 9.2 Alur Pengguna Utama



```

1\. LOAD

&#x20;  Klik "Open" → pilih file (JPG/PNG/BMP)

&#x20;  → React simpan sebagai File object

&#x20;  → Kirim ke POST /api/histogram untuk tampilkan histogram awal

&#x20;  → Tampil di panel Before, panel After kosong (menunggu operasi)



2\. EDIT

&#x20;  Pilih tab → atur parameter (slider/input)

&#x20;  → Klik "Apply"

&#x20;  → Axios POST multipart/form-data (gambar binary + params JSON)

&#x20;  → Loading overlay di panel After

&#x20;  → Response base64 → tampil di panel After

&#x20;  → Histogram After ter-update otomatis



3\. CHAIN OPERATION (edit berturut-turut)

&#x20;  Hasil After menjadi input operasi berikutnya

&#x20;  → React menyimpan hasil terakhir sebagai Blob untuk request selanjutnya

&#x20;  → History stack bertambah



4\. COMPARE

&#x20;  Geser divider tengah untuk perbandingan Before | After

&#x20;  → Panel Before selalu menampilkan gambar original



5\. UNDO

&#x20;  Ctrl+Z → ambil gambar dari history stack → tampil di After



6\. SAVE

&#x20;  Klik "Save As" → isi nama file → pilih format

&#x20;  → Convert base64 → Blob → trigger download browser

```



\### 9.3 State Management (React)



```

App State:

&#x20; originalFile      : File     — gambar asli, tidak pernah berubah

&#x20; currentImageBlob  : Blob     — gambar terkini (dikirim ke API berikutnya)

&#x20; historyStack      : Blob\[]   — stack undo (max 20 langkah, LRU)

&#x20; isLoading         : boolean  — true selama API call berlangsung

&#x20; afterImageSrc     : string   — base64 untuk panel After

&#x20; histogramData     : object   — data histogram Before \& After

&#x20; activeTab         : string   — tab aktif di Control Panel

&#x20; params            : object   — nilai slider/input saat ini

```



\### 9.4 Feedback \& State



\- \*\*Loading:\*\* Tombol Apply disabled + spinner, overlay di canvas After

\- \*\*Sukses:\*\* Toast hijau "Operation applied", panel After diperbarui

\- \*\*Error:\*\* Toast merah dengan pesan dari API (`error.message`)

\- \*\*Undo:\*\* Toast biru "Reverted to previous step"



\---



\## 10. Struktur File Proyek



```

pixelforge/

│

├── frontend/                            # Vite + React

│   ├── index.html

│   ├── vite.config.js

│   ├── package.json

│   └── src/

│       ├── main.jsx

│       ├── App.jsx

│       ├── components/

│       │   ├── layout/

│       │   │   ├── Header.jsx           # Menu bar

│       │   │   ├── Sidebar.jsx          # Toolbox icons

│       │   │   └── StatusBar.jsx

│       │   ├── workspace/

│       │   │   ├── CanvasWorkspace.jsx  # Container split Before|After

│       │   │   ├── BeforePanel.jsx

│       │   │   ├── AfterPanel.jsx

│       │   │   └── DividerHandle.jsx    # Draggable divider

│       │   ├── controls/

│       │   │   ├── ControlPanel.jsx     # Tab container

│       │   │   ├── tabs/

│       │   │   │   ├── EnhancementTab.jsx

│       │   │   │   ├── TransformTab.jsx

│       │   │   │   ├── RestorationTab.jsx

│       │   │   │   ├── EdgeBinaryTab.jsx

│       │   │   │   ├── ColorTab.jsx

│       │   │   │   ├── SegmentationTab.jsx

│       │   │   │   └── CompressionTab.jsx

│       │   │   └── shared/

│       │   │       ├── SliderInput.jsx

│       │   │       ├── Dropdown.jsx

│       │   │       └── ApplyButton.jsx

│       │   ├── histogram/

│       │   │   └── HistogramPanel.jsx

│       │   └── common/

│       │       ├── Toast.jsx

│       │       └── LoadingOverlay.jsx

│       ├── services/

│       │   └── imageService.js          # Semua Axios calls + FormData builder

│       ├── hooks/

│       │   ├── useImageHistory.js       # Undo stack logic

│       │   └── useHistogram.js          # Fetch \& cache histogram data

│       └── styles/

│           ├── global.css

│           └── variables.css            # CSS custom properties (warna, font)

│

└── backend/                             # FastAPI

&#x20;   ├── main.py                          # App entrypoint, CORS, router mount

&#x20;   ├── requirements.txt

&#x20;   ├── routers/

&#x20;   │   ├── enhance.py

&#x20;   │   ├── transform.py

&#x20;   │   ├── restore.py

&#x20;   │   ├── edge\_binary.py

&#x20;   │   ├── color.py

&#x20;   │   ├── segmentation.py

&#x20;   │   ├── compression.py

&#x20;   │   └── histogram.py

&#x20;   ├── processing/                      # Semua algoritma manual di sini

&#x20;   │   ├── enhancement.py              # brightness, contrast, equalize, sharpen, smooth

&#x20;   │   ├── transform.py                # rotate, flip, crop, resize, translate

&#x20;   │   ├── restoration.py              # gaussian, median, denoise

&#x20;   │   ├── edge\_binary.py              # threshold, canny, sobel, prewitt, roberts,

&#x20;   │   │                               #   laplacian, log, morphology

&#x20;   │   ├── color.py                    # grayscale, channel split, hsv conv, hue/sat

&#x20;   │   ├── segmentation.py             # threshold seg, edge seg, kmeans region

&#x20;   │   ├── compression.py              # dct, huffman, rle, lzw, arithmetic, quantization

&#x20;   │   └── histogram.py                # distribusi frekuensi, statistik

&#x20;   └── utils/

&#x20;       ├── image\_io.py                 # Satu-satunya tempat Pillow dipakai (decode/encode)

&#x20;       ├── array\_ops.py                # NumPy wrappers yang diizinkan

&#x20;       └── algorithms.py              # Primitif manual: convolve2d, clamp, pad\_array,

&#x20;                                       #   affine\_transform, interpolate\_nearest,

&#x20;                                       #   interpolate\_bilinear

```



\---



\## 11. Prioritas Pengembangan (Roadmap)



\### Fase 1 — Core Infrastructure

\- \[ ] Setup Vite + React project

\- \[ ] Setup FastAPI + Uvicorn + CORS

\- \[ ] Implementasi `image\_io.py` (Pillow decode/encode)

\- \[ ] Implementasi `algorithms.py` (convolve2d, clamp, pad\_array)

\- \[ ] Load image → kirim ke backend → tampil di Before panel

\- \[ ] Split canvas Before | After + draggable divider



\### Fase 2 — Enhancement \& Transform

\- \[ ] Brightness, Contrast endpoint + UI tab

\- \[ ] Histogram Equalization

\- \[ ] Sharpening, Smoothing (konvolusi manual)

\- \[ ] Rotate, Flip (horizontal + vertikal)

\- \[ ] Resize dengan 2 mode interpolasi

\- \[ ] Translate

\- \[ ] Crop via drag di canvas



\### Fase 3 — Filtering \& Edge

\- \[ ] Gaussian Blur (manual kernel + konvolusi)

\- \[ ] Median Filter (manual sort)

\- \[ ] Noise removal (salt \& pepper)

\- \[ ] Thresholding (manual + Otsu)

\- \[ ] Semua 6 metode edge detection

\- \[ ] Erosion \& Dilation morfologi



\### Fase 4 — Color, Segmentation, Compression

\- \[ ] Grayscale conversion

\- \[ ] Channel split (3 preview terpisah)

\- \[ ] Hue/Saturation (manual RGB ↔ HSV)

\- \[ ] Segmentation 3 mode

\- \[ ] JPEG simulasi (DCT manual)

\- \[ ] Huffman, RLE, LZW, Arithmetic (statistik + compression ratio)

\- \[ ] Kuantisasi



\### Fase 5 — Histogram \& Polish

\- \[ ] Histogram panel (Before \& After)

\- \[ ] Undo/Redo history stack

\- \[ ] Toast notifications

\- \[ ] Keyboard shortcuts

\- \[ ] Save As dengan pilihan format \& nama file

\- \[ ] Export histogram sebagai gambar



\---



\## 12. Catatan Teknis Tambahan



\- \*\*Performa konvolusi:\*\* Loop Python murni lambat untuk gambar besar. Gunakan NumPy slicing di dalam loop kernel untuk percepatan terbatas yang tetap dianggap manual. Untuk gambar > 2MP, tampilkan peringatan di UI dan pertimbangkan batasan resolusi.

\- \*\*Stateless backend:\*\* Server tidak menyimpan state gambar antar request. Frontend bertanggung jawab menyimpan history (Blob array, max 20 langkah, LRU eviction).

\- \*\*CORS:\*\* FastAPI dikonfigurasi `allow\_origins=\["http://localhost:5173"]` untuk Vite dev server. Sesuaikan untuk production deployment.

\- \*\*Channel Split response:\*\* Endpoint `/api/color/split` mengembalikan 3 gambar sekaligus: `{ "red": "data:image/png;base64,...", "green": "...", "blue": "..." }`.

\- \*\*Batas upload:\*\* Konfigurasikan `max\_upload\_size` di FastAPI (rekomendasi: 20MB) untuk mencegah gambar terlalu besar.

\- \*\*Aksesibilitas:\*\* Semua tombol memiliki `aria-label`; slider menggunakan `<input type="range">` native dengan keyboard support; kontras warna mengikuti WCAG AA.

