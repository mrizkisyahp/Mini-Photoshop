from fastapi import APIRouter, File, UploadFile
from fastapi.responses import JSONResponse

from services.histogram import grayscale_histogram, rgb_histogram
from utils.image_utils import read_image_as_array

router = APIRouter()


@router.post("/api/histogram/grayscale")
async def grayscale_histogram_endpoint(file: UploadFile = File(...)):
    img = await read_image_as_array(file)
    data = grayscale_histogram(img)
    return JSONResponse(content=data)


@router.post("/api/histogram/rgb")
async def rgb_histogram_endpoint(file: UploadFile = File(...)):
    img = await read_image_as_array(file)
    data = rgb_histogram(img)
    return JSONResponse(content=data)
