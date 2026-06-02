from fastapi import APIRouter, File, UploadFile, Response

from services.histogram import grayscale_histogram, rgb_histogram
from utils.image_utils import read_image_as_array, encode_image_to_bytes

router = APIRouter()


@router.post("/api/histogram/grayscale")
async def grayscale_histogram_endpoint(file: UploadFile = File(...)):
    img = await read_image_as_array(file)
    hasil_manipulasi = grayscale_histogram(img)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=".jpg")

    return Response(content=output_bytes, media_type="image/jpeg")


@router.post("/api/histogram/rgb")
async def rgb_histogram_endpoint(file: UploadFile = File(...)):
    img = await read_image_as_array(file)
    hasil_manipulasi = rgb_histogram(img)
    output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=".jpg")

    return Response(content=output_bytes, media_type="image/jpeg")
