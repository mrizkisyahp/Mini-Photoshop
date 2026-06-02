import cv2
import matplotlib
import numpy as np

matplotlib.use("Agg")

from matplotlib import pyplot as plt

from utils.image_utils import bgr_to_grayscale


def _figure_to_bgr_array(fig) -> np.ndarray:
    fig.canvas.draw()

    width, height = fig.canvas.get_width_height()
    rgba = np.frombuffer(fig.canvas.buffer_rgba(), dtype=np.uint8)
    rgba = rgba.reshape((height, width, 4))
    rgb = rgba[:, :, :3]

    plt.close(fig)
    return cv2.cvtColor(rgb, cv2.COLOR_RGB2BGR)


def grayscale_histogram(img: np.ndarray) -> np.ndarray:
    gray = bgr_to_grayscale(img)

    fig, ax = plt.subplots(figsize=(8, 4), dpi=120)
    ax.hist(gray.ravel(), bins=256, range=(0, 256), color="#22d3ee")
    ax.set_title("Grayscale Histogram")
    ax.set_xlabel("Intensity")
    ax.set_ylabel("Frequency")
    ax.set_xlim([0, 255])
    ax.grid(True, alpha=0.25)
    fig.tight_layout()

    return _figure_to_bgr_array(fig)


def rgb_histogram(img: np.ndarray) -> np.ndarray:
    fig, ax = plt.subplots(figsize=(8, 4), dpi=120)

    channels = [
        ("Blue", img[:, :, 0], "#2563eb"),
        ("Green", img[:, :, 1], "#22c55e"),
        ("Red", img[:, :, 2], "#ef4444"),
    ]

    for label, channel, color in channels:
        hist = np.histogram(channel.ravel(), bins=256, range=(0, 256))[0]
        ax.plot(hist, color=color, label=label, linewidth=1.5)

    ax.set_title("RGB Histogram")
    ax.set_xlabel("Intensity")
    ax.set_ylabel("Frequency")
    ax.set_xlim([0, 255])
    ax.grid(True, alpha=0.25)
    ax.legend()
    fig.tight_layout()

    return _figure_to_bgr_array(fig)
