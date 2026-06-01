import numpy as np


def rotate_image(
    image: np.ndarray,
    angle_degrees: float,
    interpolation_method: str = "bilinear",
    resize_to_fit: bool = True,
) -> np.ndarray:
    height, width = image.shape[:2]

    # ubah sudut derajat ke radian
    angle_radians = np.radians(angle_degrees)
    cos_theta = np.cos(angle_radians)
    sin_theta = np.sin(angle_radians)

    # tentukan ukuran canvas output
    if resize_to_fit:
        new_width = int(abs(width * cos_theta) + abs(height * sin_theta))
        new_height = int(abs(width * sin_theta) + abs(height * cos_theta))
    else:
        new_width = width
        new_height = height

    # tentukan titik pusat rotasi untuk gambar asli dan gambar baru
    center_x_source = (width - 1) / 2.0
    center_y_source = (height - 1) / 2.0

    center_x_destination = (new_width - 1) / 2.0
    center_y_destination = (new_height - 1) / 2.0

    # buat grid koordinat pixel untuk gambar output
    y_coords, x_coords = np.indices((new_height, new_width))

    # geser koordinat agar titik origin (0,0) berada di tengah output
    x_centered = x_coords - center_x_destination
    y_centered = y_coords - center_y_destination

    # hitung koordinat asal di gambar dengan rotasi berlawanan arah
    source_x = x_centered * cos_theta + y_centered * sin_theta + center_x_source
    source_y = -x_centered * sin_theta + y_centered * cos_theta + center_y_source

    # siapkan canvas kosong untuk menyimpan hasil (default berwarna hitam)
    if image.ndim == 3:
        channels = image.shape[2]
        rotated_image = np.zeros((new_height, new_width, channels), dtype=np.uint8)
    else:
        rotated_image = np.zeros((new_height, new_width), dtype=np.uint8)

    # terapkan interpolasi
    if interpolation_method.lower() == "nearest":
        nearest_x = np.round(source_x).astype(np.int32)
        nearest_y = np.round(source_y).astype(np.int32)

        # buat masking untuk koordinat asal yang valid (di dalam batas gambar asli)
        is_inside_bounds = (
            (nearest_x >= 0)
            & (nearest_x < width)
            & (nearest_y >= 0)
            & (nearest_y < height)
        )

        # pindahkan pixel yang valid ke canvas baru
        rotated_image[y_coords[is_inside_bounds], x_coords[is_inside_bounds]] = image[
            nearest_y[is_inside_bounds], nearest_x[is_inside_bounds]
        ]
    else:
        # cari koordinat 4 tetangga pixel terdekat
        x0 = np.floor(source_x).astype(np.int32)
        x1 = x0 + 1
        y0 = np.floor(source_y).astype(np.int32)
        y1 = y0 + 1

        # buat mask untuk cek apakah pixel asal dalam jangkauan interpolasi bilinear
        is_inside_bilinear_bounds = (
            (source_x >= 0)
            & (source_x < width - 1)
            & (source_y >= 0)
            & (source_y < height - 1)
        )

        x0_valid = x0[is_inside_bilinear_bounds]
        x1_valid = x1[is_inside_bilinear_bounds]
        y0_valid = y0[is_inside_bilinear_bounds]
        y1_valid = y1[is_inside_bilinear_bounds]

        # hitung jarak sub pixel antara koordinat riil dengan pixel integer kiri-atas
        delta_x = source_x[is_inside_bilinear_bounds] - x0_valid
        delta_y = source_y[is_inside_bilinear_bounds] - y0_valid

        # jika gambar rgb, selaraskan dimensi delta_x dan delta_y untuk broadcasting
        if image.ndim == 3:
            delta_x = delta_x[:, np.newaxis]
            delta_y = delta_y[:, np.newaxis]

        # ambil nilai pixel dari 4 tetangga tedekat dari gambar asli
        pixel_top_left = image[y0_valid, x0_valid]
        pixel_top_right = image[y0_valid, x1_valid]
        pixel_bottom_left = image[y1_valid, x0_valid]
        pixel_bottom_right = image[y1_valid, x1_valid]

        # terapkan rumus rata-rata tertimbang interpolasi bilinear
        interpolated_pixels = (1 - delta_y) * (
            (1 - delta_x) * pixel_top_left + delta_x * pixel_top_right
        ) + delta_y * ((1 - delta_x) * pixel_bottom_left + delta_x * pixel_bottom_right)

        # terapkan hasil interpolasi pada canvas output (diclip pada range [0, 255])
        rotated_image[
            y_coords[is_inside_bilinear_bounds],
            x_coords[is_inside_bilinear_bounds],
        ] = np.clip(interpolated_pixels, 0, 255).astype(np.uint8)

    return rotated_image
