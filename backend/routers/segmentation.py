from fastapi import APIRouter, File, UploadFile, Form, Response
import os

from services.segmentation import threshold_based, edge_based, region_based
from utils.image_utils import read_image_as_array, encode_image_to_bytes

router = APIRouter()


@router.post("/api/segmentation/threshold")
async def threshold_based_endpoint(
    file: UploadFile = File(...),
    segThreshold: int = Form(128),
):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"

    img = await read_image_as_array(file)
    hasil_manipulasi = threshold_based(img, segThreshold)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)

    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"

    return Response(content=output_bytes, media_type=media_t)


@router.post("/api/segmentation/edge")
async def edge_based_endpoint(file: UploadFile = File(...)):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"

    img = await read_image_as_array(file)
    hasil_manipulasi = edge_based(img)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)

    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"

    return Response(content=output_bytes, media_type=media_t)


@router.post("/api/segmentation/region")
async def region_based_endpoint(
    file: UploadFile = File(...),
    segRegions: int = Form(3),
):
    _, ext = os.path.splitext(file.filename)
    if not ext:
        ext = ".jpg"

    img = await read_image_as_array(file)
    hasil_manipulasi = region_based(img, segRegions)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)

    media_t = f"image/{ext.replace('.', '')}"
    if media_t == "image/jpg":
        media_t = "image/jpeg"

    return Response(content=output_bytes, media_type=media_t)
