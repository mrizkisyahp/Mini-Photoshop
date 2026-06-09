from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from services.cnn import predict_animal
from utils.image_utils import read_image_as_array

router = APIRouter()

@router.post("/api/cnn/detect")
async def detect_endpoint(file: UploadFile = File(...)):
    try:
        img = await read_image_as_array(file)
        result = predict_animal(img)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
