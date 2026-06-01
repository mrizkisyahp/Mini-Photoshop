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
    kernel_1d = np.exp(-(x ** 2) / (2 * (sigma ** 2)))

    # Normalisasi agar jumlah semua elemen = 1
    kernel_1d /= kernel_1d.sum()

    # Buat 2D Gaussian kernel dari hasil outer product dua kernel 1D
    kernel_2d = np.outer(kernel_1d, kernel_1d)

    # Vectorized 2D Convolution using sliding window views (No loops!)
    from numpy.lib.stride_tricks import sliding_window_view
    
    if img.ndim == 3:
        img_padded = np.pad(img, ((radius, radius), (radius, radius), (0, 0)), mode='reflect')
        # windows shape: (h, w, c, kernel_size, kernel_size)
        windows = sliding_window_view(img_padded, (kernel_size, kernel_size), axis=(0, 1))
        # Multiply window views with kernel_2d and sum across spatial axes
        hasil = np.sum(windows * kernel_2d, axis=(-2, -1))
    else:
        img_padded = np.pad(img, ((radius, radius), (radius, radius)), mode='reflect')
        windows = sliding_window_view(img_padded, (kernel_size, kernel_size))
        hasil = np.sum(windows * kernel_2d, axis=(-2, -1))

    # Clip ke range [0, 255] dan kembalikan ke uint8
    res_final = np.clip(hasil, 0, 255).astype(np.uint8)

    return res_final


def median_filter(img: np.ndarray, kernel_size: int) -> np.ndarray:
    # Validasi kernel_size harus ganjil dan positif
    if kernel_size % 2 == 0:
        kernel_size += 1
    kernel_size = max(1, kernel_size)

    radius = kernel_size // 2
    from numpy.lib.stride_tricks import sliding_window_view

    # Vectorized Median Filter using sliding window views
    if img.ndim == 3:
        img_padded = np.pad(img, ((radius, radius), (radius, radius), (0, 0)), mode='reflect')
        h, w, c = img.shape
        # windows shape: (h, w, c, kernel_size, kernel_size)
        windows = sliding_window_view(img_padded, (kernel_size, kernel_size), axis=(0, 1))
        # Reshape to flatten window coordinates to take median
        windows_flattened = windows.reshape(h, w, c, -1)
        hasil = np.median(windows_flattened, axis=-1)
    else:
        img_padded = np.pad(img, ((radius, radius), (radius, radius)), mode='reflect')
        h, w = img.shape
        windows = sliding_window_view(img_padded, (kernel_size, kernel_size))
        windows_flattened = windows.reshape(h, w, -1)
        hasil = np.median(windows_flattened, axis=-1)

    return hasil.astype(np.uint8)


def add_salt_pepper_noise(img: np.ndarray, amount: float) -> np.ndarray:
    """
    Menambahkan noise Salt & Pepper (impulse noise) pada citra secara acak.
    amount adalah persentase piksel yang terkena noise (0.01 hingga 0.3).
    """
    noisy_img = img.copy()
    h, w = img.shape[:2]
    
    # Hitung jumlah piksel yang akan diubah menjadi noise
    num_noise = int(amount * h * w)
    
    # Tentukan koordinat acak
    coords_y = np.random.randint(0, h, num_noise)
    coords_x = np.random.randint(0, w, num_noise)
    
    # Tentukan secara acak apakah noise berupa Salt (255) atau Pepper (0)
    # 50% salt, 50% pepper
    salt_or_pepper = np.random.randint(0, 2, num_noise)
    
    for idx in range(num_noise):
        y = coords_y[idx]
        x = coords_x[idx]
        val = 255 if salt_or_pepper[idx] == 1 else 0
        
        if img.ndim == 3:
            noisy_img[y, x, :] = val
        else:
            noisy_img[y, x] = val
            
    return noisy_img