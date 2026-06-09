import cv2
import numpy as np
from fastapi import UploadFile


async def read_image_as_array(file: UploadFile) -> np.ndarray:
    """
    Reads an uploaded file directly into a NumPy array (OpenCV format) in memory.
    """
    # Read the raw binary data from the uploaded file
    image_bytes = await file.read()

    # Convert the bytes into a 1D NumPy array of unsigned 8-bit integers
    nparr = np.frombuffer(image_bytes, np.uint8)

    # Decode the 1D array into a 2D/3D OpenCV image array
    # cv2.IMREAD_COLOR ensures we always get a BGR image
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    return img

async def read_image_and_size(file: UploadFile) -> tuple[np.ndarray, int]:
    """
    Reads an uploaded file and returns the NumPy array along with its exact byte size.
    """
    image_bytes = await file.read()
    size = len(image_bytes)
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img, size


def encode_image_to_bytes(img: np.ndarray, extension: str = ".jpg") -> bytes:
    """
    Encodes an OpenCV image array back into raw bytes.
    """
    # Encode the image into memory buffer
    success, encoded_image = cv2.imencode(extension, img)

    if not success:
        raise ValueError("Failed to encode image")

    # Return the raw bytes
    return encoded_image.tobytes()


def bgr_to_grayscale(img: np.ndarray) -> bytes:
    """
    Konversi BGR ke grayscale menggunakan weigthed luminance
    Rumus = 0.229*R + 0.587*G + 0.114*B
    """

    if len(img.shape) == 2:
        return img.copy()

    b = img[:, :, 0].astype(np.float32)
    g = img[:, :, 1].astype(np.float32)
    r = img[:, :, 2].astype(np.float32)

    gray = 0.114 * b + 0.587 * g + 0.299 * r

    return np.clip(gray, 0, 255).astype(np.uint8)


def grayscale_to_bgr(img: np.ndarray) -> np.ndarray:
    """
    Konversi grayscale 2D ke BGR 3 channel secara manual
    Caranya: stack array yang sama 3 kali di axis ke-2
    """

    if len(img.shape) == 3:
        return img.copy()

    return np.stack([img, img, img], axis=2)
