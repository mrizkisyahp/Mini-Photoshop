import cv2
import numpy as np


def rotate(img: np.ndarray, angle: float) -> np.ndarray:
    """
    Memutar citra berdasarkan sudut derajat (0-360) menggunakan matriks transformasi affine 2D.
    """
    h, w = img.shape[:2]
    center = (w // 2, h // 2)
    # Dapatkan matriks transformasi affine rotasi
    M = cv2.getRotationMatrix2D(
        center, -angle, 1.0
    )  # Gunakan -angle agar putaran searah jarum jam (CW) sesuai UI
    # Jalankan transformasi affine
    rotated = cv2.warpAffine(
        img,
        M,
        (w, h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0),
    )
    return rotated


def flip(img: np.ndarray, mode: str) -> np.ndarray:
    """
    Mencerminkan citra secara horizontal, vertikal, atau kedua arah.
    """
    if mode == "horizontal":
        return cv2.flip(img, 1)
    elif mode == "vertical":
        return cv2.flip(img, 0)
    elif mode == "both":
        return cv2.flip(img, -1)
    return img


def crop(img: np.ndarray, x: int, y: int, width: int, height: int) -> np.ndarray:
    """
    Memotong area ketertarikan (ROI) dari koordinat citra dengan validasi out-of-bounds.
    """
    h, w = img.shape[:2]

    # Batasi koordinat agar berada dalam rentang piksel gambar yang sah
    x1 = max(0, min(int(x), w - 1))
    y1 = max(0, min(int(y), h - 1))
    x2 = max(x1 + 16, min(x1 + int(width), w))
    y2 = max(y1 + 16, min(y1 + int(height), h))

    cropped = img[y1:y2, x1:x2]
    return cropped


def translate(img: np.ndarray, tx: float, ty: float) -> np.ndarray:
    """
    Menggeser posisi citra secara vertikal/horizontal menggunakan matriks translasi affine.
    """
    h, w = img.shape[:2]
    M = np.float32([[1, 0, tx], [0, 1, ty]])
    translated = cv2.warpAffine(
        img,
        M,
        (w, h),
        flags=cv2.INTER_LINEAR,
        borderMode=cv2.BORDER_CONSTANT,
        borderValue=(0, 0, 0),
    )
    return translated


def resize(img: np.ndarray, width: int, height: int) -> np.ndarray:
    """
    Mengubah ukuran dimensi citra menggunakan interpolasi bilinear.
    """
    # Batasi ukuran minimum aman
    width = max(16, int(width))
    height = max(16, int(height))
    resized = cv2.resize(img, (width, height), interpolation=cv2.INTER_LINEAR)
    return resized
