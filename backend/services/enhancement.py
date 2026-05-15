import numpy as np


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