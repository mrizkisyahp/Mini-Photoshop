import numpy as np
import cv2


def brightness_contrast(img: np.ndarray, brightness: int, contrast: float) -> np.ndarray:
    # konversi tipe data untuk mencegah overflow
    img_calc = img.astype(np.int16)
    
    # rumus transformasi linear
    # p_out = contrast * p_in + brightness
    res = (img_calc * contrast) + brightness
    
    # clipping agar nilai tidak ada yang di atas 255 atau di bawah 0
    res_clipped = np.clip(res, 0, 255)
    
    # kembalikan ke format asli
    res_final = res_clipped.astype(np.uint8)
    
    return res_final

def histogram_equalization(img: np.ndarray) -> np.ndarray:
    
    # ubah warna dari format BGR ke HSV
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    
    # pisahkan h=warna, s=kepekatan, v=kecerahan/intensitas
    h, s, v = cv2.split(hsv)
    
    # hitung histogram manual menggunakan numpy
    hist, bins = np.histogram(v.flatten(), 256, [0, 256])
    
    # hitung cdf
    cdf = hist.cumsum()
    
    # cari nilai minimum non-zero dalam cdf untuk normalisasi
    cdf_min = cdf[cdf > 0].min()
    total_pixels = v.size
    
    # normalisasi CDF ke rentang [0, 255] menggunakan rumus standar histogram equalization
    # formula: (cdf(v) - cdf_min) / (total_pixels - cdf_min) * 255
    cdf_normalized = np.zeros(256, dtype=np.uint8)
    denom = total_pixels - cdf_min
    if denom > 0:
        for i in range(256):
            if cdf[i] > 0:
                cdf_normalized[i] = round((cdf[i] - cdf_min) / denom * 255)
    
    # pemetaan nilai piksel lama ke nilai piksel baru berdasarkan index cdf
    v_eq = cdf_normalized[v]
    
    # gabungkan kembali channel H, S, V yang sudah di-equalize
    hsv_eq = cv2.merge((h, s, v_eq))
    
    # kembalikan ke format BGR
    res_final = cv2.cvtColor(hsv_eq, cv2.COLOR_HSV2BGR)
    
    return res_final

def manual_convolution2d(img: np.ndarray, kernel: np.ndarray) -> np.ndarray:
   
    # flip kernel untuk operasi konvolusi (opsional jika kernel simetris, tapi ini by definition)
    kernel = np.flipud(np.fliplr(kernel))
    
    k_h, k_w = kernel.shape
    pad_h, pad_w = k_h // 2, k_w // 2
    
    # konversi ke float32 untuk mencegah overflow/underflow saat dikalikan nilai negatif di kernel
    img_float = img.astype(np.float32)
    
    # lakukan padding pada gambar agar ukuran output tetap sama
    if len(img.shape) == 3:
        # mode edge untuk menghindari border warna hitam (0) di pinggir gambar
        padded_img = np.pad(img_float, ((pad_h, pad_h), (pad_w, pad_w), (0, 0)), mode='edge')
        output = np.zeros_like(img_float)
        
        # looping elemen kernel (berjalan seperti sliding window terhadap seluruh gambar)
        for j in range(k_h):
            for i in range(k_w):
                # ekstrak tetangga (ROI) dan kalikan dengan nilai matriks kernel
                # gunakan operasi slicing numpy agar tidak perlu nested loop yang sangat lambat (bisa freeze)
                roi = padded_img[j : j + img.shape[0], i : i + img.shape[1]]
                # tambahkan ke variabel output (harus broadcast matrix per channel 3 warna BGR)
                output += roi * kernel[j, i]
                
    else:
        padded_img = np.pad(img_float, ((pad_h, pad_h), (pad_w, pad_w)), mode='edge')
        output = np.zeros_like(img_float)
        
        for j in range(k_h):
            for i in range(k_w):
                roi = padded_img[j : j + img.shape[0], i : i + img.shape[1]]
                output += roi * kernel[j, i]
                
    # pastikan nilai rentang warna aman [0, 255]
    output = np.clip(output, 0, 255)
    return output.astype(np.uint8)


def generate_gaussian_kernel(size: int, sigma: float) -> np.ndarray:

    kernel = np.zeros((size, size))
    k = size // 2
    
    for i in range(size):
        for j in range(size):
            # posisi relatif dari titik tengah kernel
            x = i - k
            y = j - k
            
            # hitung nilai probabilitas dari kurva genta (Gaussian)
            kernel[i, j] = (1 / (2 * np.pi * sigma ** 2)) * np.exp(-(x ** 2 + y ** 2) / (2 * sigma ** 2))
            
    # normalisasi agar total penjumlahan seluruh nilai kernel = 1 (agar kecerahan gambar tidak berubah)
    return kernel / np.sum(kernel)


def sharpen(img: np.ndarray, amount: float = 1.0) -> np.ndarray:
    kernel = np.array([
        [0, -amount, 0],
        [-amount, 1 + 4*amount, -amount],
        [0, -amount, 0]
    ])
    
    # hitung dengan fungsi perhitungan konvolusi manual yang dibuat sendiri
    res_final = manual_convolution2d(img, kernel)
    return res_final

def blur(img: np.ndarray, ksize: int = 5, sigma: float = 1.0) -> np.ndarray:
    # hitung kernel matrix gaussian dengan parameter dinamis
    kernel = generate_gaussian_kernel(size=ksize, sigma=sigma)
    
    # lakukan smoothing dengan konvolusi manual
    res_final = manual_convolution2d(img, kernel)
    return res_final

