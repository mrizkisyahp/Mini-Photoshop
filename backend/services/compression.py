import cv2
import numpy as np
import math
from collections import Counter
import io

def jpeg_compression(img: np.ndarray, quality: int, original_size: int) -> tuple[np.ndarray, dict]:
    """Applies JPEG compression and returns the decoded image and stats."""
    # Encode
    encode_param = [int(cv2.IMWRITE_JPEG_QUALITY), quality]
    result, encoded_img = cv2.imencode('.jpg', img, encode_param)
    
    # Decode back to show artifacts
    decoded_img = cv2.imdecode(encoded_img, 1)
    
    # Calculate sizes
    # Size calculation
    compressed_size = len(encoded_img)
    
    stats = {
        "original_size": original_size,
        "compressed_size": compressed_size,
        "ratio": round(original_size / compressed_size, 2) if compressed_size > 0 else 0
    }
    
    return decoded_img, stats

def quantization(img: np.ndarray, bits: int, original_size: int) -> tuple[np.ndarray, dict]:
    """Applies color quantization (reducing bit depth)."""
    # Number of colors per channel = 2^bits
    levels = 2 ** bits
    factor = 256 / levels
    
    quantized = np.floor(img / factor) * factor
    quantized = quantized.astype(np.uint8)
    
    raw_size = img.size * img.itemsize # width * height * 3 bytes
    pixels = img.shape[0] * img.shape[1]
    
    # In indexed color, we can map unique colors to a palette.
    # We quantize each channel to 'bits'. Total unique colors = (2^bits)^3
    total_colors = (2 ** bits) ** 3
    
    # Bits required per pixel to address the palette
    bits_per_pixel = 3 * bits
    
    # Theoretical size = Indexed pixel data + Palette overhead
    indexed_data_bytes = (pixels * bits_per_pixel) / 8
    palette_bytes = total_colors * 3 # 3 bytes per color in the palette
    
    compressed_size = int(indexed_data_bytes + palette_bytes)
    
    stats = {
        "original_size": raw_size,
        "compressed_size": compressed_size,
        "ratio": round(raw_size / compressed_size, 2) if compressed_size > 0 else 0,
        "unique_colors": total_colors
    }
    
    return quantized, stats

def export_indexed_png(img: np.ndarray, quant_bits: int) -> bytes:
    """Exports a quantized image as an indexed 8-bit PNG."""
    from PIL import Image
    import io
    
    # img is BGR from OpenCV. Convert to RGB
    if len(img.shape) == 3 and img.shape[2] == 3:
        img_rgb = img[:, :, ::-1]
    else:
        img_rgb = img
        
    # Create PIL Image
    pil_img = Image.fromarray(img_rgb)
    
    # Quantize to P mode using maximum possible colors based on bit depth
    # Max colors for PNG palette is 256
    total_colors = min(256, (2 ** quant_bits) ** 3)
    
    # Convert to palette mode
    paletted = pil_img.quantize(colors=total_colors, method=Image.Quantize.MEDIANCUT)
    
    # Save to bytes
    buf = io.BytesIO()
    paletted.save(buf, format='PNG', optimize=True)
    return buf.getvalue()

def _calculate_entropy(data: np.ndarray) -> float:
    """Calculate the Shannon entropy of data."""
    counts = np.bincount(data.ravel())
    probs = counts[counts > 0] / data.size
    entropy = -np.sum(probs * np.log2(probs))
    return entropy

def rle_compression(img: np.ndarray, original_size: int) -> dict:
    """Simulates RLE compression size."""
    # Flatten image
    flat = img.ravel()
    
    # Very basic RLE simulation: count changes
    changes = np.count_nonzero(flat[1:] != flat[:-1]) + 1
    # Each run takes 2 values: count (assume 1 byte for count max 255) and value (1 byte)
    # A true RLE handles runs > 255 by splitting them. Let's approximate.
    compressed_size = int(changes * 2)
    # original_size is passed in
    
    raw_size = img.size * img.itemsize
    return {
        "original_size": raw_size,
        "compressed_size": compressed_size,
        "ratio": round(raw_size / compressed_size, 2) if compressed_size > 0 else 0,
        "message": "RLE relies on contiguous identical pixels. It is often larger than original for noisy photos, but good for flat graphics."
    }

def huffman_compression(img: np.ndarray, original_size: int) -> dict:
    """Simulates Huffman compression based on entropy."""
    entropy = _calculate_entropy(img)
    
    # The theoretical limit of Huffman encoding is close to entropy
    # So we multiply total pixels by entropy (bits per pixel) and divide by 8
    # original_size is passed in
    theoretical_bits = img.size * entropy
    # Add a little overhead for the dictionary tree (say 256 * 4 bytes = 1024 bytes)
    compressed_size = int(theoretical_bits / 8) + 1024
    
    raw_size = img.size * img.itemsize
    return {
        "original_size": raw_size,
        "compressed_size": compressed_size,
        "ratio": round(raw_size / compressed_size, 2) if compressed_size > 0 else 0,
        "entropy_bpp": round(entropy, 2),
        "message": f"Huffman coding achieves approx {round(entropy, 2)} bits per channel based on symbol frequency."
    }

def arithmetic_compression(img: np.ndarray, original_size: int) -> dict:
    """Simulates Arithmetic compression based on entropy."""
    entropy = _calculate_entropy(img)
    
    # Arithmetic coding can get slightly closer to true entropy than Huffman
    # original_size is passed in
    theoretical_bits = img.size * entropy
    # Less dictionary overhead, but still some
    compressed_size = int(theoretical_bits / 8) + 256
    
    raw_size = img.size * img.itemsize
    return {
        "original_size": raw_size,
        "compressed_size": compressed_size,
        "ratio": round(raw_size / compressed_size, 2) if compressed_size > 0 else 0,
        "entropy_bpp": round(entropy, 2),
        "message": "Arithmetic coding maps the entire image to a single fractional number interval, approaching theoretical entropy limits."
    }

def lzw_compression(img: np.ndarray, original_size: int) -> dict:
    """Simulates LZW compression size."""
    # LZW builds a dictionary of recurring patterns.
    # For a real photo, LZW is often poor (like TIFF with LZW on continuous tones).
    # We will approximate this using zlib deflate which is DEFLATE (LZ77 + Huffman), similar class.
    # We will compress the raw bytes to get an actual exact size for LZW-like dictionary encoding.
    import zlib
    
    # original_size is passed in
    compressed_data = zlib.compress(img.tobytes(), level=6)
    compressed_size = len(compressed_data)
    
    raw_size = img.size * img.itemsize
    return {
        "original_size": raw_size,
        "compressed_size": compressed_size,
        "ratio": round(raw_size / compressed_size, 2) if compressed_size > 0 else 0,
        "message": "Using DEFLATE (LZ77+Huffman) as a proxy for LZW dictionary-based compression size on this image."
    }

def encode_rle(img: np.ndarray) -> bytes:
    import struct
    
    height, width = img.shape[:2]
    channels = img.shape[2] if len(img.shape) == 3 else 1
    
    flat = img.ravel()
    
    encoded_data = bytearray()
    
    n = len(flat)
    if n == 0:
        return b""
        
    current_val = flat[0]
    run_length = 1
    
    for i in range(1, n):
        if flat[i] == current_val and run_length < 255:
            run_length += 1
        else:
            encoded_data.append(run_length)
            encoded_data.append(current_val)
            current_val = flat[i]
            run_length = 1
            
    encoded_data.append(run_length)
    encoded_data.append(current_val)
    
    header = struct.pack('>7s H H B', b'MINIRLE', width, height, channels)
    return header + bytes(encoded_data)

def decode_rle(data: bytes) -> np.ndarray:
    import struct
    
    if len(data) < 12:
        raise ValueError("Invalid RLE file")
        
    header = data[:12]
    magic, width, height, channels = struct.unpack('>7s H H B', header)
    
    if magic != b'MINIRLE':
        raise ValueError("Not a valid MINIRLE file")
        
    decoded = bytearray()
    payload = data[12:]
    for i in range(0, len(payload), 2):
        run_length = payload[i]
        val = payload[i+1]
        decoded.extend([val] * run_length)
        
    arr = np.array(decoded, dtype=np.uint8)
    if channels == 1:
        arr = arr.reshape((height, width))
    else:
        arr = arr.reshape((height, width, channels))
        
    return arr

def encode_huffman(img: np.ndarray) -> bytes:
    import struct
    import json
    import heapq
    from collections import Counter
    
    height, width = img.shape[:2]
    channels = img.shape[2] if len(img.shape) == 3 else 1
    
    flat = img.ravel().tolist()
    freq = Counter(flat)
    
    heap = [[weight, [symbol, ""]] for symbol, weight in freq.items()]
    heapq.heapify(heap)
    
    if len(heap) == 1:
        symbol = heap[0][1][0]
        huff_dict = {str(symbol): "0"}
    else:
        while len(heap) > 1:
            lo = heapq.heappop(heap)
            hi = heapq.heappop(heap)
            for pair in lo[1:]:
                pair[1] = '0' + pair[1]
            for pair in hi[1:]:
                pair[1] = '1' + pair[1]
            heapq.heappush(heap, [lo[0] + hi[0]] + lo[1:] + hi[1:])
            
        huff_dict = {str(pair[0]): pair[1] for pair in heap[0][1:]}
        
    bitstring = "".join(huff_dict[str(val)] for val in flat)
    
    padding_length = (8 - len(bitstring) % 8) % 8
    bitstring += "0" * padding_length
    
    byte_array = bytearray()
    for i in range(0, len(bitstring), 8):
        byte_array.append(int(bitstring[i:i+8], 2))
        
    dict_json = json.dumps(huff_dict).encode('utf-8')
    dict_len = len(dict_json)
    
    header = struct.pack('>8s H H B B I', b'MINIHUFF', width, height, channels, padding_length, dict_len)
    return header + dict_json + bytes(byte_array)

def decode_huffman(data: bytes) -> np.ndarray:
    import struct
    import json
    
    header_size = struct.calcsize('>8s H H B B I')
    if len(data) < header_size:
        raise ValueError("Invalid HUFF file")
        
    magic, width, height, channels, padding_length, dict_len = struct.unpack('>8s H H B B I', data[:header_size])
    
    if magic != b'MINIHUFF':
        raise ValueError("Not a valid MINIHUFF file")
        
    dict_json_bytes = data[header_size : header_size + dict_len]
    huff_dict_str = json.loads(dict_json_bytes.decode('utf-8'))
    reverse_dict = {bits: int(symbol) for symbol, bits in huff_dict_str.items()}
    
    byte_data = data[header_size + dict_len:]
    bitstring = "".join(f"{b:08b}" for b in byte_data)
    
    if padding_length > 0:
        bitstring = bitstring[:-padding_length]
        
    decoded = []
    current_bits = ""
    for bit in bitstring:
        current_bits += bit
        if current_bits in reverse_dict:
            decoded.append(reverse_dict[current_bits])
            current_bits = ""
            
    arr = np.array(decoded, dtype=np.uint8)
    if channels == 1:
        arr = arr.reshape((height, width))
    else:
        arr = arr.reshape((height, width, channels))
        
    return arr
