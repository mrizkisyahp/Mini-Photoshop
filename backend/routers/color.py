from fastapi import APIRouter, File, UploadFile, Form, Response
import os

from services.color import grayscale, hsv_adjust, channel as isolate_channel
from utils.image_utils import read_image_as_array, encode_image_to_bytes

router = APIRouter()


@router.post("/api/color/grayscale")
async def grayscale_endpoint(file: UploadFile = File(...)):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"

    img = await read_image_as_array(file)
    hasil_manipulasi = grayscale(img)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)

    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"

    return Response(content=output_bytes, media_type=media_t)


@router.post("/api/color/hsv")
async def hsv_endpoint(
    file: UploadFile = File(...),
    hsvHue: float = Form(0.0),
    hsvSaturation: float = Form(0.0),
):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"

    img = await read_image_as_array(file)
    hasil_manipulasi = hsv_adjust(img, hsvHue, hsvSaturation)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)

    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"

    return Response(content=output_bytes, media_type=media_t)


@router.post("/api/color/channel")
async def channel_endpoint(
    file: UploadFile = File(...),
    channel: str = "r",
):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"

    img = await read_image_as_array(file)
    hasil_manipulasi = isolate_channel(img, channel)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)

    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"

    return Response(content=output_bytes, media_type=media_t)
