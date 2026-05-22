from fastapi import APIRouter, File, UploadFile, Form, Response
import os

from utils.image_utils import *
from services.restoration import median_filter

router = APIRouter()

@router.post("/api/restoration/gaussian-blur")
async def gaussian_blur_endpoint(
  file: UploadFile = File(...),
  kernel_size: int = Form(5),
  sigma: float = Form(0.0)
):
  _,ext = os.path.splitext(file.filename)
  if not ext:
    ext = ".jpg"
    
  img = await read_image_as_array(file)
  
  hasil_manipulasi = gaussian_blur(img, kernel_size, sigma)
  
  output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)
  
  media_t = f"image/{ext.replace('.', '')}"
  if media_t == "image/jpg":
    media_t = "image/jpeg"
  
  return Response(content=output_bytes, media_type=media_t)


@router.post("/api/restoration/median")
async def median_filter_endpoint(
  file: UploadFile = File(...),
  kernel_size: int = Form(5),
):
  _,ext = os.path.splitext(file.filename)
  if not ext:
    ext = ".jpg"
    
  img = await read_image_as_array(file)
  
  hasil_manipulasi = median_filter(img, kernel_size)
  
  output_bytes = encode_image_to_bytes(hasil_manipulasi, extension=ext)
  
  media_t = f"image/{ext.replace('.', '')}"
  if media_t == "image/jpg":
    media_t = "image/jpeg"
  
  return Response(content=output_bytes, media_type=media_t)