from fastapi import APIRouter, File, UploadFile, HTTPException, Form
from fastapi.responses import JSONResponse

from utils.image_utils import read_image_as_array
from services.cnn import predict_image

router = APIRouter()

@router.post("/api/cnn/detect")
async def detect_endpoint(
    file: UploadFile = File(...),
    cnnDataset: str = Form("fruits"),
    cnnModelType: str = Form("scratch")
):
    try:
        img = await read_image_as_array(file)
        result = predict_image(img, cnnDataset, cnnModelType)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
