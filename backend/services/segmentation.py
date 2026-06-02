import cv2
import numpy as np

from services.edge import canny
from utils.image_utils import bgr_to_grayscale, grayscale_to_bgr


def threshold_based(img: np.ndarray, threshold_value: int = 128) -> np.ndarray:
    gray = bgr_to_grayscale(img)
    segmented = np.where(gray >= threshold_value, 255, 0).astype(np.uint8)
    return grayscale_to_bgr(segmented)


def edge_based(img: np.ndarray) -> np.ndarray:
    return canny(img)


def region_based(img: np.ndarray, regions: int = 3) -> np.ndarray:
    region_count = max(2, min(int(regions), 10))

    pixels = img.reshape((-1, 3)).astype(np.float32)

    criteria = (
        cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER,
        20,
        1.0,
    )

    _, labels, centers = cv2.kmeans(
        pixels,
        region_count,
        None,
        criteria,
        3,
        cv2.KMEANS_PP_CENTERS,
    )

    centers = np.uint8(centers)
    segmented = centers[labels.flatten()]

    return segmented.reshape(img.shape)
