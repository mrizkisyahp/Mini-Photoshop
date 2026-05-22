import numpy as np


def gaussian_blur(img: np.ndarray, kernel_size: int, sigma: float) -> np.ndarray:
    
    if kernel_size % 2 == 0:
        kernel_size += 1
    kernel_size = max(1, kernel_size)
    
    if sigma == 0.0:
        sigma = 0.3 * ((kernel_size - 1) * 0.5 - 1) + 0.8
    

    # Buat 1D Gaussian kernel
    radius = kernel_size // 2
    x = np.arange(-radius, radius + 1, dtype=np.float64)

    # Rumus Gaussian: G(x) = exp(-x^2 / (2 * sigma^2))
    kernel_1d = np.exp(-(x ** 2) / (2 * sigma ** 2))

    # Normalisasi agar jumlah semua elemen = 1
    kernel_1d /= kernel_1d.sum()

    # Buat 2D Gaussian kernel dari hasil outer product dua kernel 1D
    # G(x,y) = G(x) * G(y) karena Gaussian bersifat separable
    kernel_2d = np.outer(kernel_1d, kernel_1d)

    # Padding pada gambar agar tepi tidak terpotong (reflect padding)
    pad = radius
    if img.ndim == 3:
        img_padded = np.pad(img, ((pad, pad), (pad, pad), (0, 0)), mode='reflect')
    else:
        img_padded = np.pad(img, ((pad, pad), (pad, pad)), mode='reflect')

    # Konvolusi manual dengan kernel 2D
    h, w = img.shape[:2]
    hasil = np.zeros_like(img, dtype=np.float64)

    for i in range(h):
        for j in range(w):
            region = img_padded[i:i + kernel_size, j:j + kernel_size]
            if img.ndim == 3:
                # Terapkan kernel ke setiap channel (R, G, B)
                for c in range(img.shape[2]):
                    hasil[i, j, c] = np.sum(region[:, :, c] * kernel_2d)
            else:
                hasil[i, j] = np.sum(region * kernel_2d)

    # Clip ke range [0, 255] dan kembalikan ke uint8
    res_final = np.clip(hasil, 0, 255).astype(np.uint8)

    return res_final


def median_filter(img: np.ndarray, kernel_size: int) -> np.ndarray:
    
    # Validasi kernel_size harus ganjil dan positif
    if kernel_size % 2 == 0:
        kernel_size += 1
    kernel_size = max(1, kernel_size)

    radius = kernel_size // 2

    # Padding reflect agar tepi tidak terpotong
    if img.ndim == 3:
        img_padded = np.pad(img, ((radius, radius), (radius, radius), (0, 0)), mode='reflect')
    else:
        img_padded = np.pad(img, ((radius, radius), (radius, radius)), mode='reflect')

    h, w = img.shape[:2]
    hasil = np.zeros_like(img)

    for i in range(h):
        for j in range(w):
            region = img_padded[i:i + kernel_size, j:j + kernel_size]
            if img.ndim == 3:
                # Ambil median tiap channel secara terpisah
                for c in range(img.shape[2]):
                    hasil[i, j, c] = np.median(region[:, :, c])
            else:
                hasil[i, j] = np.median(region)

    return hasil.astype(np.uint8)