from fastapi import APIRouter, File, UploadFile, Form, Response
import os

from utils.image_utils import *
from utils.enhancement import brightness_contrast

router = APIRouter()

@router.post("/api/enhancement/brightness-contrast")
async def brightness_contrast_endpoint(
    file: UploadFile = File(...),
    brightness: int = Form(0),
    contrast: float = Form(1.0)
):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"
    
    img = await read_image_as_array(file)
    
    hasil_manipulasi = brightness_contrast(img, brightness, contrast)
    
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)
    
    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"
    
    return Response(content=output_bytes, media_type=media_t)