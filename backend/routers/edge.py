from fastapi import APIRouter, File, UploadFile, Form, Response
import os

from utils.image_utils import read_image_as_array, encode_image_to_bytes
from services.edge import (
    threshold as apply_threshold,
    canny as apply_canny,
    sobel as apply_sobel,
    prewitt as apply_prewitt,
    roberts as apply_roberts,
    laplacian as apply_laplacian,
)

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


@router.post("/api/edge/canny")
async def canny_endpoint(
    file: UploadFile = File(...),
    low_threshold: float = Form(50.0),
    high_threshold: float = Form(150.0),
):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"

    img = await read_image_as_array(file)

    hasil_manipulasi = apply_canny(img, low_threshold, high_threshold)

    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)

    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"

    return Response(content=output_bytes, media_type=media_t)


@router.post("/api/edge/sobel")
async def sobel_endpoint(
    file: UploadFile = File(...),
):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"

    img = await read_image_as_array(file)

    hasil_manipulasi = apply_sobel(img)

    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)

    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"

    return Response(content=output_bytes, media_type=media_t)


@router.post("/api/edge/prewitt")
async def prewitt_endpoint(file: UploadFile = File(...)):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"

    img = await read_image_as_array(file)

    hasil_manipulasi = apply_prewitt(img)

    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)

    media_t = f"image/{ext.replace('.', '')}"

    if media_t == "image/jpg":
        media_t = "image/jpeg"
    return Response(content=output_bytes, media_type=media_t)


@router.post("/api/edge/roberts")
async def roberts_endpoint(file: UploadFile = File(...)):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"

    img = await read_image_as_array(file)
    hasil_manipulasi = apply_roberts(img)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)

    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"

    return Response(content=output_bytes, media_type=media_t)


@router.post("/api/edge/laplacian")
async def roberts_endpoint(file: UploadFile = File(...)):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"

    img = await read_image_as_array(file)
    hasil_manipulasi = apply_laplacian(img)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)

    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"

    return Response(content=output_bytes, media_type=media_t)
