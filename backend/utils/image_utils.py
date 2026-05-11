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

def encode_image_to_bytes(img: np.ndarray, extension: str = '.jpg') -> bytes:
    """
    Encodes an OpenCV image array back into raw bytes.
    """
    # Encode the image into memory buffer
    success, encoded_image = cv2.imencode(extension, img)
    
    if not success:
        raise ValueError("Failed to encode image")
        
    # Return the raw bytes
    return encoded_image.tobytes()
