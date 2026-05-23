from fastapi import APIRouter, File, UploadFile, Form, Response
import os

from utils.image_utils import *
from services.geometric import rotate, flip, crop, translate, resize

router = APIRouter()

@router.post("/api/geometric/rotate")
async def rotate_endpoint(
    file: UploadFile = File(...),
    angle: float = Form(0.0)
):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"
    img = await read_image_as_array(file)
    hasil_manipulasi = rotate(img, angle)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)
    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"
    return Response(content=output_bytes, media_type=media_t)

@router.post("/api/geometric/flip")
async def flip_endpoint(
    file: UploadFile = File(...),
    mode: str = Form("horizontal")
):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"
    img = await read_image_as_array(file)
    hasil_manipulasi = flip(img, mode)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)
    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"
    return Response(content=output_bytes, media_type=media_t)

@router.post("/api/geometric/crop")
async def crop_endpoint(
    file: UploadFile = File(...),
    x: int = Form(0),
    y: int = Form(0),
    width: int = Form(100),
    height: int = Form(100)
):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"
    img = await read_image_as_array(file)
    hasil_manipulasi = crop(img, x, y, width, height)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)
    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"
    return Response(content=output_bytes, media_type=media_t)

@router.post("/api/geometric/translate")
async def translate_endpoint(
    file: UploadFile = File(...),
    tx: float = Form(0.0),
    ty: float = Form(0.0)
):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"
    img = await read_image_as_array(file)
    hasil_manipulasi = translate(img, tx, ty)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)
    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"
    return Response(content=output_bytes, media_type=media_t)

@router.post("/api/geometric/resize")
async def resize_endpoint(
    file: UploadFile = File(...),
    width: int = Form(100),
    height: int = Form(100)
):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"
    img = await read_image_as_array(file)
    hasil_manipulasi = resize(img, width, height)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)
    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"
    return Response(content=output_bytes, media_type=media_t)
