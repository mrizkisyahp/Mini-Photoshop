from fastapi import APIRouter, File, UploadFile, Form, Response
import os

from utils.image_utils import read_image_as_array, encode_image_to_bytes
from services.edge import threshold as apply_threshold

router = APIRouter()


@router.post("/api/edge/threshold")
async def threshold_endpoint(
    file: UploadFile = File(...),
    threshold: int = Form(128),
):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"

    img = await read_image_as_array(file)

    hasil_manipulasi = apply_threshold(img, threshold)

    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)

    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"

    return Response(content=output_bytes, media_type=media_t)
