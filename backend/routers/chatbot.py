from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
import base64
import os
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

router = APIRouter()

# Read the API key from the environment
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY")

if OPENROUTER_API_KEY:
    client = OpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=OPENROUTER_API_KEY,
    )
else:
    client = None

SYSTEM_PROMPT = """
You are a helpful AI assistant built directly into the Mini-Photoshop application.
Your goal is to help the user understand their image and suggest how to edit it using the available Mini-Photoshop tools.

Here are the tools available in Mini-Photoshop and their parameters:
1. Enhancement & Filters: Brightness (brightness: -100 to 100), Contrast (contrast: -100 to 100), Gamma (gamma: 0.1 to 5.0), Sharpen (sharpenAmount: 0.5 to 10.0), Gaussian Blur (blurKsize: 3-31 odd, blurSigma: 0.1-10.0), Histogram Equalization/CLAHE.
2. Restoration & Denoising: Remove Gaussian Blur (restore_blur), Median Filter (medianKsize: 3, 5, 7, 9), Remove Salt & Pepper (noiseAmount: 0.01 to 0.1).
3. Geometric Operations: Translate (moveX, moveY), Resize (resizeWidth, resizeHeight), Rotate (rotate: 0-360), Flip (horizontal, vertical), Crop.
4. Color Spaces: Grayscale, HSV (hsvHue, hsvSaturation), RGB Extraction.
5. Binary & Edge: Thresholding (threshold: 0-255), Edge Detection (Canny, Sobel, Prewitt, Roberts, Laplacian, LoG), Morphology (Erosion, Dilation).
6. Segmentation: Threshold Segmentation, Region-based (K-Means).
7. Histograms: Grayscale and RGB Histogram Analysis.
8. Compression: JPEG Simulation, Quantization (Color Reduction), Lossless Encoding (RLE, Huffman, Arithmetic, LZW).
9. Deep Learning (CNN): Object Recognition (Fruit, Animal, Intel Image).

When the user asks you a question:
1. Briefly analyze the provided image.
2. If they ask how to make the image better, identify issues (e.g. "It looks a bit dark and noisy") and explicitly name the Mini-Photoshop tools they should use (e.g. "Try increasing the Brightness to 20, and then apply a Median Filter with Kernel Size 5 to remove the noise").
3. Keep your answers concise, helpful, and directly related to the provided image and tools.
"""

@router.post("/api/chatbot/ask")
async def ask_chatbot(
    file: UploadFile = File(None),
    message: str = Form(...)
):
    if not client:
        return JSONResponse(
            status_code=200,
            content={"reply": "My OpenRouter API Key is missing! Please add OPENROUTER_API_KEY to the backend/.env file."}
        )

    try:
        content_parts = []
        
        # Add the system prompt explicitly in the user message for weaker free models
        content_parts.append({
            "type": "text",
            "text": f"INSTRUCTIONS FOR AI:\n{SYSTEM_PROMPT}\n\nUSER'S MESSAGE:\n{message}"
        })
        
        if file:
            image_bytes = await file.read()
            base64_image = base64.b64encode(image_bytes).decode('utf-8')
            mime_type = file.content_type or "image/jpeg"
            
            # Add the image part (OpenAI/Groq vision syntax)
            content_parts.append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:{mime_type};base64,{base64_image}"
                }
            })

        response = client.chat.completions.create(
            model="nvidia/nemotron-nano-12b-v2-vl:free",
            messages=[
                {
                    "role": "user",
                    "content": content_parts
                }
            ],
            max_tokens=1024,
            temperature=0.7
        )
        
        return JSONResponse(content={"reply": response.choices[0].message.content})

    except Exception as e:
        print("Chatbot Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/api/chatbot/identify")
async def identify_chatbot(file: UploadFile = File(...)):
    if not client:
        return JSONResponse(status_code=200, content={"reply": ""})

    try:
        image_bytes = await file.read()
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        mime_type = file.content_type or "image/jpeg"
        
        response = client.chat.completions.create(
            model="nvidia/nemotron-nano-12b-v2-vl:free",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Describe the main subject of this image in 1 to 3 words. Do not use punctuation. Capitalize the first letter."
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{mime_type};base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=20,
            temperature=0.3
        )
        
        reply = response.choices[0].message.content.strip().strip('"').strip("'")
        return JSONResponse(content={"reply": reply})

    except Exception as e:
        print("Identify Error:", str(e))
        return JSONResponse(status_code=200, content={"reply": ""}) # Fail silently

@router.get("/api/chatbot/limits")
async def get_limits():
    if not OPENROUTER_API_KEY:
        return JSONResponse(status_code=200, content={"error": "API Key missing"})
    
    import requests
    try:
        response = requests.get(
            url="https://openrouter.ai/api/v1/key",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}"
            }
        )
        return JSONResponse(content=response.json())
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})
