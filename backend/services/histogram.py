import numpy as np

from utils.image_utils import bgr_to_grayscale

def grayscale_histogram(img: np.ndarray) -> dict:
    """Calculate the grayscale histogram of an image."""
    gray = bgr_to_grayscale(img)
    hist = np.histogram(gray.ravel(), bins=256, range=(0, 256))[0]
    return {"gray": hist.tolist()}

def rgb_histogram(img: np.ndarray) -> dict:
    """Calculate the RGB histogram of an image."""
    result = {}
    channels = [
        ("blue", img[:, :, 0]),
        ("green", img[:, :, 1]),
        ("red", img[:, :, 2]),
    ]
    
    for label, channel in channels:
        hist = np.histogram(channel.ravel(), bins=256, range=(0, 256))[0]
        result[label] = hist.tolist()
        
    return result
