import numpy as np


def gaussian_blur(img: np.ndarray) -> np.ndarray:
    
    kernel_size = 5

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