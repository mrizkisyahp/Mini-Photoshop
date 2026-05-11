from fastapi import FastAPI, File, UploadFile, Form, Response
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np

# Import our helpers from Step 1
from utils.image_utils import read_image_as_array, encode_image_to_bytes

app = FastAPI(title="Mini Photoshop API")

# --- CORS Configuration ---
# This allows your React frontend (localhost:5173) to send requests here
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to ["http://localhost:5173"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Endpoints ---

@app.post("/test-endpoint")
async def test_endpoint(
    file: UploadFile = File(...),
):
    # 1. Decode to Array 
    img = await read_image_as_array(file)
    
    # 2. Encode back to Bytes
    output_bytes = encode_image_to_bytes(img, extension='.jpg')
    
    # Return exactly what we got
    return Response(content=output_bytes, media_type="image/jpeg")

# Basic root endpoint for testing
@app.get("/")
def read_root():
    return {"message": "Mini Photoshop API is running!"}
