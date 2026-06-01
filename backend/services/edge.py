import numpy as np
from utils.image_utils import bgr_to_grayscale, grayscale_to_bgr
from utils.math_utils import (
    generate_gaussian_kernel,
    convolve2d_single_channel,
    generate_sobel_kernels,
    compute_gradients,
    non_maximum_suppression,
    double_threshold,
    hysteresis_tracking,
    compute_gradient_magnitude,
)


def threshold(image: np.ndarray, threshold_value: int) -> np.ndarray:
    gray = bgr_to_grayscale(image)

    binary = np.where(gray >= threshold_value, 255, 0).astype(np.uint8)

    return grayscale_to_bgr(binary)


def canny(
    image: np.ndarray,
    low_threshold: float = 50.0,
    high_threshold: float = 150.0,
) -> np.ndarray:
    # grayscale * noise reduction menggunakan gaussian blur
    grayscale_image = bgr_to_grayscale(image)
    gaussian_kernel = generate_gaussian_kernel(size=5, sigma=1.4)
    blurred_image = convolve2d_single_channel(grayscale_image, gaussian_kernel)

    # perhitungan gradien citra (sobel)
    sobel_kernel_x, sobel_kernel_y = generate_sobel_kernels()
    gradient_magnitude, gradient_direction = compute_gradients(
        blurred_image, sobel_kernel_x, sobel_kernel_y
    )

    # penipisan tepi
    suppressed_image = non_maximum_suppression(gradient_magnitude, gradient_direction)

    # double thresholding
    thresholded_image = double_threshold(
        suppressed_image, low_threshold, high_threshold
    )

    # pelacakan tepi
    edges = hysteresis_tracking(thresholded_image)

    return grayscale_to_bgr(edges)


def sobel(image: np.ndarray) -> np.ndarray:
    # konversi gambar BGR ke grayscale
    grayscale_image = bgr_to_grayscale(image)

    # dapatkan kernel sobel arah x dan y
    sobel_kernel_x, sobel_kernel_y = generate_sobel_kernels()

    # hitung magnitudo gradien (Gx^2 + Gy^2)^0.5
    gradient_magnitude = compute_gradient_magnitude(
        grayscale_image, sobel_kernel_x, sobel_kernel_y
    )

    # clipping ke range [0, 255] dan ubah ke format uint8
    sobel_edges = np.clip(gradient_magnitude, 0, 255).astype(np.uint8)

    # kembalikan ke format BGR
    return grayscale_to_bgr(sobel_edges)
