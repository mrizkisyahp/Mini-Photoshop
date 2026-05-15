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
    
    # normalisasi cdf, gunakan masking untuk mengabaikan nilai 0 agar pembagian tidak error
    cdf_m = np.ma.masked_equal(cdf, 0)
    
    # isi kembali yang di-mask dengan angka 0
    cdf_final = np.ma.filled(cdf_m, 0).astype(np.uint8)
    
    # pemetaan nilai piksel lama ke nilai piksel baru berdasarkan index cdf
    v_eq = cdf_final[v]
    
    # gabungkan kembali channel H, S, V yang sudah di-equalize
    hsv_eq = cv2.merge((h, s, v_eq))
    
    # kembalikan ke format BGR
    res_final = cv2.cvtColor(hsv_eq, cv2.COLOR_HSV2BGR)
    
    return res_final
    