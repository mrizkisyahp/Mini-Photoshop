import os
from fastapi import APIRouter, File, UploadFile, Form, Response

from utils.image_utils import read_image_as_array, encode_image_to_bytes
from services.geometric import rotate_image

router = APIRouter()


@router.post("/api/geometric/rotate")
async def rotate_image_endpoint(
    file: UploadFile = File(...),
    rotate: float = Form(0.0),
    method: str = Form("bilinear"),
    fit: bool = Form(True),
):
    _, file_extension = os.path.splitext(file.filename)
    if not file_extension:
        file_extension = ".jpg"

    original_image = await read_image_as_array(file)

    processed_image = rotate_image(
        image=original_image,
        angle_degrees=rotate,
        interpolation_method=method,
        resize_to_fit=fit,
    )

    encoded_image_bytes = encode_image_to_bytes(
        processed_image, extension=file_extension
    )

    media_type = f"image/{file_extension.replace('.', '')}"
    if media_type == "image/jpg":
        media_type = "image/jpeg"

    return Response(content=encoded_image_bytes, media_type=media_type)
