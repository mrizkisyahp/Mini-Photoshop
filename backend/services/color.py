import cv2
import numpy as np

from utils.image_utils import bgr_to_grayscale, grayscale_to_bgr


def grayscale(img: np.ndarray) -> np.ndarray:
    gray = bgr_to_grayscale(img)
    return grayscale_to_bgr(gray)


def hsv_adjust(
    img: np.ndarray,
    hue: float = 0.0,
    saturation: float = 0.0,
) -> np.ndarray:
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(np.float32)

    h = hsv[:, :, 0]
    s = hsv[:, :, 1]
    v = hsv[:, :, 2]

    # OpenCV stores hue in range 0..179, while the UI slider uses degrees.
    h = (h + (hue / 2.0)) % 180
    s = np.clip(s * (1.0 + saturation / 100.0), 0, 255)

    adjusted_hsv = cv2.merge((h, s, v)).astype(np.uint8)
    return cv2.cvtColor(adjusted_hsv, cv2.COLOR_HSV2BGR)


def channel(img: np.ndarray, selected_channel: str) -> np.ndarray:
    output = np.zeros_like(img)

    if selected_channel == "r":
        output[:, :, 2] = img[:, :, 2]
    elif selected_channel == "g":
        output[:, :, 1] = img[:, :, 1]
    elif selected_channel == "b":
        output[:, :, 0] = img[:, :, 0]
    else:
        return img.copy()

    return output
