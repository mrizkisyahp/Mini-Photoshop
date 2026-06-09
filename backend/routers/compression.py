from fastapi import APIRouter, File, Form, UploadFile, Response
from fastapi.responses import JSONResponse
import json

from services.compression import (
    jpeg_compression,
    quantization,
    rle_compression,
    huffman_compression,
    arithmetic_compression,
    lzw_compression
)
from utils.image_utils import read_image_as_array, read_image_and_size, encode_image_to_bytes

router = APIRouter()

@router.post("/api/compression/jpeg")
async def jpeg_endpoint(file: UploadFile = File(...), jpegQuality: int = Form(80)):
    img, size = await read_image_and_size(file)
    result_img, stats = jpeg_compression(img, jpegQuality, size)
    output_bytes = encode_image_to_bytes(result_img, extension=".jpg")
    
    # We want to return both the image and the stats. 
    # Since we can't return both easily in one binary response without multipart,
    # we can pass the stats in the headers.
    headers = {
        "X-Compression-Stats": json.dumps(stats)
    }
    return Response(content=output_bytes, media_type="image/jpeg", headers=headers)

@router.post("/api/compression/quantization")
async def quantization_endpoint(file: UploadFile = File(...), quantBits: int = Form(4)):
    img, size = await read_image_and_size(file)
    result_img, stats = quantization(img, quantBits, size)
    # Output as PNG so we don't introduce JPEG artifacts on top of quantization
    output_bytes = encode_image_to_bytes(result_img, extension=".png")
    
    headers = {
        "X-Compression-Stats": json.dumps(stats)
    }
    return Response(content=output_bytes, media_type="image/png", headers=headers)

@router.post("/api/compression/quantization/export")
async def quantization_export_endpoint(file: UploadFile = File(...), quantBits: int = Form(4)):
    from services.compression import export_indexed_png
    img, size = await read_image_and_size(file)
    result_img, stats = quantization(img, quantBits, size)
    
    # Export as true Indexed PNG
    output_bytes = export_indexed_png(result_img, quantBits)
    
    return Response(
        content=output_bytes, 
        media_type="image/png",
        headers={"Content-Disposition": "attachment; filename=mini-photoshop-indexed.png"}
    )

@router.post("/api/compression/rle")
async def rle_endpoint(file: UploadFile = File(...)):
    img, size = await read_image_and_size(file)
    stats = rle_compression(img, size)
    output_bytes = encode_image_to_bytes(img, extension=".png")
    headers = {"X-Compression-Stats": json.dumps(stats)}
    return Response(content=output_bytes, media_type="image/png", headers=headers)

@router.post("/api/compression/rle/export")
async def rle_export_endpoint(file: UploadFile = File(...)):
    from services.compression import encode_rle
    img, size = await read_image_and_size(file)
    output_bytes = encode_rle(img)
    return Response(
        content=output_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": "attachment; filename=mini-photoshop-export.rle"}
    )

@router.post("/api/compression/huffman")
async def huffman_endpoint(file: UploadFile = File(...)):
    img, size = await read_image_and_size(file)
    stats = huffman_compression(img, size)
    output_bytes = encode_image_to_bytes(img, extension=".png")
    headers = {"X-Compression-Stats": json.dumps(stats)}
    return Response(content=output_bytes, media_type="image/png", headers=headers)

@router.post("/api/compression/huffman/export")
async def huffman_export_endpoint(file: UploadFile = File(...)):
    from services.compression import encode_huffman
    img, size = await read_image_and_size(file)
    output_bytes = encode_huffman(img)
    return Response(
        content=output_bytes,
        media_type="application/octet-stream",
        headers={"Content-Disposition": "attachment; filename=mini-photoshop-export.huff"}
    )

@router.post("/api/compression/decode")
async def decode_custom_format_endpoint(file: UploadFile = File(...)):
    from services.compression import decode_rle, decode_huffman
    import io
    
    data = await file.read()
    if len(data) < 8:
        return JSONResponse({"error": "File too small to be a valid format"}, status_code=400)
        
    try:
        if data.startswith(b'MINIRLE'):
            img = decode_rle(data)
        elif data.startswith(b'MINIHUFF'):
            img = decode_huffman(data)
        else:
            return JSONResponse({"error": "Unknown custom file format"}, status_code=400)
            
        output_bytes = encode_image_to_bytes(img, extension=".png")
        return Response(content=output_bytes, media_type="image/png")
    except Exception as e:
        return JSONResponse({"error": f"Failed to decode file: {str(e)}"}, status_code=400)

@router.post("/api/compression/arithmetic")
async def arithmetic_endpoint(file: UploadFile = File(...)):
    img, size = await read_image_and_size(file)
    stats = arithmetic_compression(img, size)
    output_bytes = encode_image_to_bytes(img, extension=".png")
    headers = {"X-Compression-Stats": json.dumps(stats)}
    return Response(content=output_bytes, media_type="image/png", headers=headers)

@router.post("/api/compression/lzw")
async def lzw_endpoint(file: UploadFile = File(...)):
    img, size = await read_image_and_size(file)
    stats = lzw_compression(img, size)
    output_bytes = encode_image_to_bytes(img, extension=".png")
    headers = {"X-Compression-Stats": json.dumps(stats)}
    return Response(content=output_bytes, media_type="image/png", headers=headers)

