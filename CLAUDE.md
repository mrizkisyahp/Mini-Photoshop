# CLAUDE.md — Mini Photoshop

Panduan ini membantu Claude memahami arsitektur, stack teknologi, dan konvensi pengembangan proyek **Mini Photoshop** — aplikasi pengolahan citra digital berbasis web untuk mata kuliah Pengolahan Citra Digital.

---

## Deskripsi Proyek

Mini Photoshop adalah aplikasi web interaktif yang mengimplementasikan konsep-konsep utama pengolahan citra digital. Seluruh pemrosesan gambar dilakukan di **backend Python** (bukan di browser), dikirim ke **frontend React** untuk ditampilkan.

- **Mata Kuliah:** Pengolahan Citra Digital
- **Dosen:** Rizki Elisa Nalawati, S.T., M.T.

---

## Arsitektur Sistem

### Stack Teknologi

| Layer            | Teknologi           | Keterangan                                            |
| ---------------- | ------------------- | ----------------------------------------------------- |
| Frontend         | React + Vite        | UI interaktif, slider, preview before/after, drag-crop |
| Backend          | Python + FastAPI    | REST API untuk pemrosesan gambar                      |
| Image Processing | OpenCV + Pillow     | Library utama seluruh operasi citra                   |
| Histogram        | Matplotlib          | Generate grafik, dikirim sebagai PNG ke frontend      |
| CNN (Bonus)      | PyTorch / TensorFlow | Object recognition dengan pretrained model           |

### Alur Komunikasi

```
User → React (upload) → FastAPI (POST multipart/form-data atau base64)
     → OpenCV/PIL (proses) → Response gambar → React (panel after)
```

> **Pilih multipart/form-data** untuk performa lebih baik pada gambar besar.

---

## Struktur Folder

```
mini-photoshop/
├── frontend/                  ← React (Vite)
│   ├── src/
│   │   ├── components/        ← Toolbar, Slider, Preview, dll.
│   │   ├── pages/             ← Halaman utama editor
│   │   ├── api/               ← Axios calls ke FastAPI
│   │   └── App.jsx
│   └── package.json
│
├── backend/                   ← Python FastAPI
│   ├── main.py                ← Entry point FastAPI
│   ├── routers/
│   │   ├── enhancement.py     ← Brightness, Contrast, HE, Sharpen, Blur
│   │   ├── geometric.py       ← Rotate, Flip, Crop, Resize, Translate
│   │   ├── restoration.py     ← Gaussian, Median, Noise Removal
│   │   ├── edge.py            ← Canny, Sobel, Prewitt, Robert, Laplacian, LoG
│   │   ├── morphology.py      ← Erosion, Dilation
│   │   ├── color.py           ← Grayscale, Channel Split, Hue/Saturation
│   │   ├── segmentation.py    ← Threshold, Edge-based, Watershed
│   │   ├── compression.py     ← JPEG, RLE, Huffman, LZW, Quantization
│   │   ├── histogram.py       ← Histogram grayscale & RGB
│   │   └── cnn.py             ← Object recognition (bonus)
│   ├── utils/
│   │   └── image_utils.py     ← Helper: decode/encode base64
│   └── requirements.txt
│
└── README.md
```

---

## Fitur & Metode

### Image Management
- Load image: JPG, PNG, BMP dari file lokal
- Save image: custom filename & format
- Reset ke gambar awal
- Preview: panel before–after side by side

### Image Enhancement

| Fitur                  | Metode                                          | Library                                |
| ---------------------- | ----------------------------------------------- | -------------------------------------- |
| Brightness & Contrast  | Linear scaling (α·pixel + β) + Gamma Correction | `cv2.convertScaleAbs`                  |
| Histogram Equalization | CLAHE                                           | `cv2.createCLAHE()`                    |
| Sharpening             | Unsharp Masking (blur → subtract)               | OpenCV + NumPy                         |
| Smoothing / Blur       | Gaussian Blur + Bilateral Filter                | `cv2.GaussianBlur`, `cv2.bilateralFilter` |

### Geometric Transformation

| Fitur            | Metode                                                              | Library       |
| ---------------- | ------------------------------------------------------------------- | ------------- |
| Rotate (0°–360°) | Affine matrix via `cv2.getRotationMatrix2D` + `cv2.warpAffine`     | OpenCV        |
| Flip             | `cv2.flip`                                                          | OpenCV        |
| Crop (drag area) | Slicing NumPy array dari koordinat drag event React                 | NumPy + React |
| Resize           | `cv2.resize` dengan interpolasi Lanczos                             | OpenCV        |
| Translation      | Affine transformation matrix                                        | OpenCV        |

> Fitur crop memerlukan implementasi `mousedown`, `mousemove`, `mouseup` di React untuk menentukan koordinat, lalu dikirim ke backend.

### Image Restoration (Noise Reduction)

| Fitur                  | Metode                                        | Keterangan                       |
| ---------------------- | --------------------------------------------- | -------------------------------- |
| Gaussian Blur          | `cv2.GaussianBlur` (kernel & sigma adjustable) | Untuk Gaussian noise            |
| Median Filter          | `cv2.medianBlur`                              | Untuk Salt & Pepper noise        |
| Salt & Pepper Removal  | Median Filter + threshold cleaning            | Median terbukti paling efektif   |

### Binary & Edge Processing

| Fitur                     | Metode                                              |
| ------------------------- | --------------------------------------------------- |
| Thresholding              | `cv2.threshold` — Binary, Otsu, Adaptive            |
| Edge Detection — Canny    | `cv2.Canny` (default utama)                         |
| Edge Detection — Sobel    | `cv2.Sobel` (Gx, Gy, magnitude)                     |
| Edge Detection — Prewitt  | `cv2.filter2D` + kernel Prewitt manual              |
| Edge Detection — Robert   | `cv2.filter2D` + kernel Robert Cross manual         |
| Edge Detection — Laplacian | `cv2.Laplacian`                                    |
| Edge Detection — LoG      | Gaussian Blur → `cv2.Laplacian`                     |
| Morphology — Erosion      | `cv2.erode` dengan structuring element adjustable   |
| Morphology — Dilation     | `cv2.dilate` dengan structuring element adjustable  |

### Color Processing

| Fitur            | Metode                                          | Library      |
| ---------------- | ----------------------------------------------- | ------------ |
| RGB → Grayscale  | `cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)`         | OpenCV       |
| Channel Splitting | `img[:,:,0]`, `img[:,:,1]`, `img[:,:,2]`       | NumPy        |
| Hue/Saturation   | BGR→HSV → manipulasi H & S → BGR               | `cv2.cvtColor` HSV |

### Image Segmentation

| Fitur             | Metode                                        |
| ----------------- | --------------------------------------------- |
| Threshold-based   | Binary/Otsu thresholding + masking            |
| Edge-based        | Canny + `cv2.findContours`                    |
| Region-based      | Watershed Algorithm — `cv2.watershed`         |

### Image Compression

| Metode                | Implementasi                                        |
| --------------------- | --------------------------------------------------- |
| JPEG Quality Control  | `PIL Image.save(..., quality=X)` (1–95)             |
| Simulasi RLE          | Implementasi manual Run-Length Encoding             |
| Simulasi Huffman      | Pohon Huffman pada data piksel grayscale            |
| Simulasi LZW          | LZW sederhana pada data gambar                      |
| Kuantisasi Warna      | K-Means clustering pada piksel                      |

> Simulasi kompresi (Huffman, RLE, LZW) diimplementasikan sebagai **demo terpisah** yang menampilkan rasio kompresi — tidak harus menghasilkan file format asli.

### Histogram Analysis
- Histogram grayscale dan RGB secara terpisah
- Perbandingan before vs after secara berdampingan
- Divisualisasikan oleh Matplotlib di backend, dikirim ke frontend sebagai **PNG**

### CNN Object Recognition (Bonus)
- Framework: PyTorch (rekomendasi untuk fleksibilitas)
- Arsitektur: Pretrained MobileNetV2 atau ResNet dengan fine-tuning
- Router: `backend/routers/cnn.py`

---

## Dependencies

### Backend (`requirements.txt`)

| Package              | Versi Min | Fungsi                             |
| -------------------- | --------- | ---------------------------------- |
| `fastapi`            | 0.110+    | Web framework API                  |
| `uvicorn`            | 0.29+     | ASGI server                        |
| `opencv-python`      | 4.9+      | Library utama pengolahan citra     |
| `Pillow`             | 10.0+     | Pemrosesan gambar & kompresi JPEG  |
| `numpy`              | 1.26+     | Manipulasi array piksel            |
| `matplotlib`         | 3.8+      | Visualisasi histogram              |
| `python-multipart`   | 0.0.9+    | Upload file multipart              |
| `torch`/`tensorflow` | latest    | CNN object recognition (bonus)     |

### Frontend (`package.json`)

| Package          | Fungsi                               |
| ---------------- | ------------------------------------ |
| `react` + `vite` | Framework & build tool               |
| `axios`          | HTTP client ke FastAPI               |
| `rc-slider`      | Komponen slider interaktif           |
| `react-dropzone` | Upload gambar drag & drop            |
| `tailwindcss`    | Styling utility-first                |

---

## Alur Pengembangan

| Tahap               | Fokus                                                              | Output                          |
| ------------------- | ------------------------------------------------------------------ | ------------------------------- |
| 1 — Setup           | Inisialisasi React + FastAPI, koneksi, endpoint test               | Boilerplate berjalan            |
| 2 — Image Mgmt      | Upload, save, reset, preview before/after                          | Upload & tampil gambar          |
| 3 — Enhancement     | Brightness/Contrast, CLAHE, Sharpening, Blur                       | Slider terhubung ke backend     |
| 4 — Geometric       | Rotate, Flip, Resize, Translate, Crop drag                         | Transformasi geometri berfungsi |
| 5 — Restoration     | Gaussian Blur, Median Filter, Salt & Pepper                        | Noise reduction berfungsi       |
| 6 — Edge & Morph    | Canny, Sobel, Prewitt, Robert, Laplacian, LoG, Erosion, Dilation   | Semua edge detection tersedia   |
| 7 — Color & Segment | Grayscale, Channel split, HSV, Watershed                           | Color tools & segmentasi        |
| 8 — Histogram       | Visualisasi grayscale & RGB, before/after comparison               | Grafik histogram tampil         |
| 9 — Compression     | JPEG quality, simulasi RLE/Huffman/LZW/Kuantisasi                  | Fitur kompresi berfungsi        |
| 10 — CNN (Bonus)    | Integrasi pretrained model object recognition                      | Deteksi objek berjalan          |
| 11 — Polish UI      | Responsivitas, UX, error handling, loading state                   | UI siap presentasi              |

---

## Catatan Teknis Penting

- **Komunikasi gambar:** Gunakan `multipart/form-data` untuk performa lebih baik pada gambar besar; `base64` sebagai alternatif.
- **Setiap endpoint FastAPI** menerima gambar + parameter operasi → mengembalikan gambar hasil dalam format yang sama.
- **Crop drag area:** Implementasikan `mousedown`, `mousemove`, `mouseup` di React → kirim koordinat ke backend untuk cropping dengan NumPy slicing.
- **Simulasi kompresi:** Huffman, RLE, LZW cukup tampilkan rasio kompresi sebagai demo akademis — tidak perlu menghasilkan file format asli.
- **Histogram:** Dirender oleh Matplotlib di backend, dikirim ke frontend sebagai gambar PNG.
- **CNN:** Gunakan pretrained model (MobileNetV2/ResNet) dengan fine-tuning agar efisien untuk skala tugas kuliah.
