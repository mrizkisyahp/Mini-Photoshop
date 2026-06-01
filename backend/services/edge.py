import numpy as np
from utils.image_utils import bgr_to_grayscale, grayscale_to_bgr


def threshold(img: np.ndarray, threshold_value: int) -> np.ndarray:
    gray = bgr_to_grayscale(img)

    binary = np.where(gray >= threshold_value, 255, 0).astype(np.uint8)

    return grayscale_to_bgr(binary)
