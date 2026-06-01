import numpy as np
from numpy.lib.stride_tricks import sliding_window_view


def generate_gaussian_kernel(size: int, sigma: float) -> np.ndarray:
    """
    Rumus: G9(x, y) = (1 / 2*pi*sigma^2) * exp(-(x^2 + y^2) / 2*sigma^2)
    kernel dinormalisasi agar jumlah semua elemen = 1
    """

    k = size // 2
    kernel = np.zeros((size, size), dtype=np.float32)

    for i in range(size):
        for j in range(size):
            x = i - k
            y = j - k
            kernel[i, j] = np.exp(-(x**2 + y**2) / (2 * sigma**2))
    return kernel / kernel.sum()


def generate_sobel_kernels() -> tuple[np.ndarray, np.ndarray]:
    """
    return berupa kernel sobel untuk deteksi gradient horizontal dan vertikal
    Sobel X -> deteksi tepi vertikal (perubahan horizontal)
    Sobel Y -> deteksi tepi horizontal (perubahan vertikal)
    """

    kernel_x = np.array(
        [
            [-1, 0, 1],
            [-2, 0, 2],
            [-1, 0, 1],
        ],
        dtype=np.float32,
    )

    kernel_y = np.array(
        [
            [-1, -2, -1],
            [0, 0, 0],
            [1, 2, 1],
        ],
        dtype=np.float32,
    )

    return kernel_x, kernel_y


def generate_prewitt_kernels() -> tuple[np.ndarray, np.ndarray]:
    """
    mengembalikan kernel prewitt untuk deteksi gradient horizontal

    mirip sobel tapi tanpa pembobotan pada baris/kolom tengah
    """

    kernel_x = np.array([[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]], dtype=np.float32)

    kernel_y = np.array([[-1, -1, -1], [0, 0, 0], [1, 1, 1]], dtype=np.float32)

    return kernel_x, kernel_y


def generate_roberts_kernels() -> tuple[np.ndarray, np.ndarray]:
    """
    mengembalikan kernel Roberts Cross untuk deteksi gradient diagonal

    Roberts menggunakan kernel 2x2
    """

    kernel_x = np.array(
        [
            [1, 0],
            [0, -1],
        ],
        dtype=np.float32,
    )

    kernel_y = np.array([[0, 1], [-1, 0]], dtype=np.float32)

    return kernel_x, kernel_y


def generate_laplacian_kernel() -> np.ndarray:
    """
    mengembalikan kerjel Laplacian 4-connectivity untuk deteksi tepi berdasarkan turunan kedua intensitas gambar
    """

    return np.array([[0, 1, 0], [1, -4, 1], [0, 1, 0]], dtype=np.float32)


def convolve2d_single_channel(img: np.ndarray, kernel: np.ndarray) -> np.ndarray:
    """
    konvolusi 2d manual pada single channel (grayscale)

    padding mode 'edge' digunakan untuk menghindari borderhitam

    output dalam float32 tanpa clipping

    caller bertanggung jawab melakukan clipping
    """

    kernel_flipped = np.flipud(np.fliplr(kernel))
    k_h, k_w = kernel_flipped.shape
    pad_h, pad_w = k_h // 2, k_w // 2

    padded = np.pad(
        img.astype(np.float32), ((pad_h, pad_h), (pad_w, pad_w)), mode="edge"
    )
    windows = sliding_window_view(padded, (k_h, k_w))

    return np.sum(windows * kernel_flipped, axis=(-2, -1))


def convolve2d(img: np.ndarray, kernel: np.ndarray) -> np.ndarray:
    """
    konvolusi 2d untuk grayscale maupun bgr

    konvolusi dilakukan perchannel secara independen

    output diclip ke [0, 255] dan dikembalikan sebagai uint8
    """

    if len(img.shape) == 2:
        result = convolve2d_single_channel(img, kernel)
        return np.clip(result, 0, 255).astype(np.uint8)

    channels = [
        convolve2d_single_channel(img[:, :, c], kernel) for c in range(img.shape[2])
    ]

    return np.clip(np.stack(channels, axis=2), 0, 255).astype(np.uint8)


def compute_gradient_magnitude(
    img: np.ndarray, kernel_x: np.ndarray, kernel_y: np.ndarray
) -> np.ndarray:
    """
    hitung gradient magnitude dari dua kernel arah x dan y

    magnitude = sqrt(Gx^2 + Gy^2)

    input harus grayscale (2d array)
    """

    gx = convolve2d_single_channel(img.astype(np.float32), kernel_x)
    gy = convolve2d_single_channel(img.astype(np.float32), kernel_y)

    magnitude = np.sqrt(gx**2 + gy**2)

    return magnitude


def compute_gradient_direction(
    img: np.ndarray, kernel_x: np.ndarray, kernel_y: np.ndarray
) -> np.ndarray:
    """
    hitung gradient direction (sudut dalam derajat) dari dua kernel arah

    direction = arctan(Gy, Gx) dikonversi ke derajat

    input harus grayscale (2d array)
    """

    gx = convolve2d_single_channel(img.astype(np.float32), kernel_x)
    gy = convolve2d_single_channel(img.astype(np.float32), kernel_y)

    return np.degrees(np.arctan2(gy, gx))


def compute_gradients(
    img: np.ndarray, kernel_x: np.ndarray, kernel_y: np.ndarray
) -> tuple[np.ndarray, np.ndarray]:
    """
    hitung gradient magnitude dan direction sekaligus dalam satu fungsi

    menghindari konvolusi ganda yang redundan

    returns: (magnitude, direction_in_degrees)
    """

    gx = convolve2d_single_channel(img.astype(np.float32), kernel_x)
    gy = convolve2d_single_channel(img.astype(np.float32), kernel_y)

    magnitude = np.sqrt(gx**2 + gy**2)
    direction = np.degrees(np.arctan2(gy, gx))

    return magnitude, direction


def non_maximum_suppression(
    gradient_magnitude: np.ndarray, gradient_direction: np.ndarray
) -> np.ndarray:
    """
    menipiskan lebar garis tepi dengan membandingkan kekuatan piksel gradien terhadap tetangganya searah garis sudut gradien
    """

    height, width = gradient_magnitude.shape
    suppressed_image = np.zeros_like(gradient_magnitude)

    # normalisasi arah sudut derajat ke rentang [0, 180]
    normalized_direction = np.where(
        gradient_direction < 0, gradient_direction + 180, gradient_direction
    )

    # padding untuk menghindari error out-of-bounds
    padded_magnitude = np.pad(gradient_magnitude, 1, mode="constant", constant_values=0)

    # buat koordinat indeks grid output
    y_coords, x_coords = np.indices((height, width))
    y_padded = y_coords + 1
    x_padded = x_coords + 1

    # 1. Sektor Horizontal (0 derajat): periksa tetangga kiri & kanan
    mask_horizontal = ((normalized_direction >= 0) & (normalized_direction < 22.5)) | (
        (normalized_direction >= 157.5) & (normalized_direction <= 180)
    )
    is_local_max_horizontal = (
        gradient_magnitude >= padded_magnitude[y_padded, x_padded - 1]
    ) & (gradient_magnitude >= padded_magnitude[y_padded, x_padded + 1])
    suppressed_image[mask_horizontal & is_local_max_horizontal] = gradient_magnitude[
        mask_horizontal & is_local_max_horizontal
    ]

    # 2. Sektor Diagonal 45 derajat: periksa tetangga kanan-atas & kiri-bawah
    mask_diagonal_45 = (normalized_direction >= 22.5) & (normalized_direction < 67.5)
    is_local_max_diagonal_45 = (
        gradient_magnitude >= padded_magnitude[y_padded - 1, x_padded + 1]
    ) & (gradient_magnitude >= padded_magnitude[y_padded + 1, x_padded - 1])
    suppressed_image[mask_diagonal_45 & is_local_max_diagonal_45] = gradient_magnitude[
        mask_diagonal_45 & is_local_max_diagonal_45
    ]

    # 3. Sektor Vertical (90 derajat): periksa tetangga atas & bawah
    mask_vertical = (normalized_direction >= 67.5) & (normalized_direction < 112.5)
    is_local_max_vertical = (
        gradient_magnitude >= padded_magnitude[y_padded - 1, x_padded]
    ) & (gradient_magnitude >= padded_magnitude[y_padded + 1, x_padded])
    suppressed_image[mask_vertical & is_local_max_vertical] = gradient_magnitude[
        mask_vertical & is_local_max_vertical
    ]

    # 4. Sektor Diagonal 135 derajat: periksa tetangga kiri-atas & kanan-bawah
    mask_diagonal_135 = (normalized_direction >= 112.5) & (normalized_direction < 157.5)
    is_local_max_diagonal_135 = (
        gradient_magnitude >= padded_magnitude[y_padded - 1, x_padded - 1]
    ) & (gradient_magnitude >= padded_magnitude[y_padded + 1, x_padded + 1])
    suppressed_image[mask_diagonal_135 & is_local_max_diagonal_135] = (
        gradient_magnitude[mask_diagonal_135 & is_local_max_diagonal_135]
    )

    return suppressed_image


def double_threshold(
    suppressed_image: np.ndarray, low_threshold: float, high_threshold: float
) -> np.ndarray:
    """
    mengklasifikasikan pixel ke dalam 3 kategori: tepi kuat (255), tepi lemah (50), dan bukan tepi (0)
    """

    thresholded_image = np.zeros_like(suppressed_image, dtype=np.uint8)

    is_strong_edge = suppressed_image >= high_threshold
    is_weak_edge = (suppressed_image >= low_threshold) & (
        suppressed_image < high_threshold
    )

    thresholded_image[is_strong_edge] = 255
    thresholded_image[is_weak_edge] = 50

    return thresholded_image


def hysteresis_tracking(thresholded_image: np.ndarray) -> np.ndarray:
    """
    melacak dan mengubah tepi lemah (50) menjadi tepi kuat (255) menggunakan BFS jika terhubung dengan piksel tepi kuat lainnya
    """

    height, width = thresholded_image.shape
    result_image = thresholded_image.copy()

    # temukan koordinat awal semua tepi kuat sebagai pemicu BFS
    strong_y, strong_x = np.where(result_image == 255)
    tracking_queue = list(zip(strong_y, strong_x))

    # lacak piksel yang sudah dikunjungi
    visited_pixels = np.zeros_like(result_image, dtype=bool)
    visited_pixels[result_image == 255] = True

    # tetangga 8 arah
    neighbor_offsets = [
        (-1, -1),
        (-1, 0),
        (-1, 1),
        (0, -1),
        (0, 1),
        (1, -1),
        (1, 0),
        (1, 1),
    ]

    queue_index = 0
    while queue_index < len(tracking_queue):
        current_y, current_x = tracking_queue[queue_index]
        queue_index += 1

        for offset_y, offset_x in neighbor_offsets:
            neighbor_y = current_y + offset_y
            neighbor_x = current_x + offset_x

            # validasi batas gambar
            if 0 <= neighbor_y < height and 0 <= neighbor_x < width:
                # naikkan status tepi lemah menjadi tepi kuat jika terhubung
                if (
                    result_image[neighbor_y, neighbor_x] == 50
                    and not visited_pixels[neighbor_y, neighbor_x]
                ):
                    result_image[neighbor_y, neighbor_x] = 255
                    visited_pixels[neighbor_y, neighbor_x] = True
                    tracking_queue.append((neighbor_y, neighbor_x))

    result_image[result_image == 50] = 0
    return result_image
