import { useEffect, useState } from 'react';
import { FiClock, FiEye, FiLayers, FiDownload } from 'react-icons/fi';
import { clamp } from '../utils/canvasHelpers';
import { toolGroups } from '../utils/toolConfig';
import HistogramPanel from './HistogramPanel';
import { downloadFileRequest } from '../api/api';

export default function PropertiesPanel({ tool, params, setParams, canvasRef, onApply, loading, histogramData, cnnResult, compressionStats, isEditingNode, originalFile, currentImageSrc }) {
  const field = (label, element) => (
    <div className="flex flex-col gap-2.5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{label}</label>
      </div>
      {element}
    </div>
  );

  const [jpegBlobSize, setJpegBlobSize] = useState(null);

  useEffect(() => {
    if (tool.id === 'jpeg' && currentImageSrc) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            setJpegBlobSize(blob.size);
          }
        }, 'image/jpeg', params.jpegQuality / 100);
      };
      img.src = currentImageSrc;
    } else {
      setJpegBlobSize(null);
    }
  }, [tool.id, params.jpegQuality, currentImageSrc, compressionStats]);

  const inputClass = "w-full bg-zinc-950 border border-zinc-800 rounded-md px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all shadow-inner";
  const rangeClass = "w-full accent-cyan-400 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer";

  const renderControls = () => {
    switch (tool.id) {
      case 'brightness':
        return (
          <>
            {field('Brightness', <input type="range" min="-100" max="100" value={params.brightness} onChange={(e) => setParams(p => ({ ...p, brightness: Number(e.target.value) }))} className={rangeClass} />)}
            {field('Contrast', <input type="range" min="-100" max="100" value={params.contrast} onChange={(e) => setParams(p => ({ ...p, contrast: Number(e.target.value) }))} className={rangeClass} />)}
            {field('Gamma', <input type="number" min="0.1" max="5" step="0.1" value={params.gamma} onChange={(e) => setParams(p => ({ ...p, gamma: Number(e.target.value) }))} className={inputClass} />)}
          </>
        );
      case 'sharpen':
        return (
          <>
            {field('Intensity', <input type="range" min="0.5" max="10" step="0.5" value={params.sharpenAmount} onChange={(e) => setParams(p => ({ ...p, sharpenAmount: Number(e.target.value) }))} className={rangeClass} />)}
            <div className="flex justify-end text-xs text-zinc-400 font-mono">{params.sharpenAmount}x</div>
          </>
        );
      case 'blur':
      case 'restore_blur':
        return (
          <>
            {field('Kernel Size', <input type="range" min="3" max="31" step="2" value={params.blurKsize} onChange={(e) => setParams(p => ({ ...p, blurKsize: Number(e.target.value) }))} className={rangeClass} />)}
            <div className="flex justify-end text-xs text-zinc-400 font-mono">{params.blurKsize}Ã—{params.blurKsize}</div>

            {field('Sigma', <input type="range" min="0.1" max="10.0" step="0.1" value={params.blurSigma} onChange={(e) => setParams(p => ({ ...p, blurSigma: Number(e.target.value) }))} className={rangeClass} />)}
            <div className="flex justify-end text-xs text-zinc-400 font-mono">{params.blurSigma}</div>
          </>
        );
      case 'rotate':
        return (
          <>
            {field('Angle (Â°)', <input type="range" min="0" max="360" value={params.rotate} onChange={(e) => setParams(p => ({ ...p, rotate: Number(e.target.value) }))} className={rangeClass} />)}
            <div className="flex justify-end text-xs text-zinc-400 font-mono">{params.rotate}Â°</div>
          </>
        );
      case 'flip':
        return (
          <>
            {field('Direction', (
              <select value={params.flipMode} onChange={(e) => setParams(p => ({ ...p, flipMode: e.target.value }))} className={inputClass}>
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
                <option value="both">Both</option>
              </select>
            ))}
          </>
        );
      case 'move':
        return (
          <>
            {field('Position X / Y', (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 mb-1">X (px)</span>
                  <input
                    type="number"
                    value={params.moveX}
                    onChange={(e) => setParams(p => ({ ...p, moveX: e.target.value === '' ? '' : Number(e.target.value) }))}
                    onBlur={(e) => {
                      const cw = canvasRef?.current?.clientWidth ?? 9999;
                      const margin = 48;
                      setParams(p => ({ ...p, moveX: clamp(Number(e.target.value) || 0, -(p.resizeWidth - margin), cw - margin) }));
                    }}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 mb-1">Y (px)</span>
                  <input
                    type="number"
                    value={params.moveY}
                    onChange={(e) => setParams(p => ({ ...p, moveY: e.target.value === '' ? '' : Number(e.target.value) }))}
                    onBlur={(e) => {
                      const ch = canvasRef?.current?.clientHeight ?? 9999;
                      const margin = 48;
                      setParams(p => ({ ...p, moveY: clamp(Number(e.target.value) || 0, -(p.resizeHeight - margin), ch - margin) }));
                    }}
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
            <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs p-3 rounded-md">
              Drag the image on the canvas â€” the values above will update automatically!
            </div>
          </>
        );
      case 'resize':
        return (
          <>
            {field('Size W / H', (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 mb-1">Width (px)</span>
                  <input
                    type="number"
                    min="48"
                    value={params.resizeWidth}
                    onChange={(e) => setParams(p => ({ ...p, resizeWidth: e.target.value === '' ? '' : Number(e.target.value) }))}
                    onBlur={(e) => {
                      const cw = canvasRef?.current?.clientWidth ?? 8192;
                      setParams(p => ({ ...p, resizeWidth: clamp(Number(e.target.value) || 48, 48, cw) }));
                    }}
                    className={inputClass}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 mb-1">Height (px)</span>
                  <input
                    type="number"
                    min="48"
                    value={params.resizeHeight}
                    onChange={(e) => setParams(p => ({ ...p, resizeHeight: e.target.value === '' ? '' : Number(e.target.value) }))}
                    onBlur={(e) => {
                      const ch = canvasRef?.current?.clientHeight ?? 8192;
                      setParams(p => ({ ...p, resizeHeight: clamp(Number(e.target.value) || 48, 48, ch) }));
                    }}
                    className={inputClass}
                  />
                </div>
              </div>
            ))}
            <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs p-3 rounded-md">
              Drag the image corners on the canvas â€” the values above will update automatically!
            </div>
          </>
        );
      case 'crop':
        return (
          <>
            {field('Position X/Y', <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="0"
                value={params.cropX}
                onChange={(e) => setParams(p => ({ ...p, cropX: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)) }))}
                onBlur={(e) => setParams(p => ({ ...p, cropX: Math.max(0, Number(e.target.value) || 0) }))}
                className={inputClass}
                placeholder="X"
              />
              <input
                type="number"
                min="0"
                value={params.cropY}
                onChange={(e) => setParams(p => ({ ...p, cropY: e.target.value === '' ? '' : Math.max(0, Number(e.target.value)) }))}
                onBlur={(e) => setParams(p => ({ ...p, cropY: Math.max(0, Number(e.target.value) || 0) }))}
                className={inputClass}
                placeholder="Y"
              />
            </div>)}
            {field('Size W/H', <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                min="16"
                value={params.cropWidth}
                onChange={(e) => setParams(p => ({ ...p, cropWidth: e.target.value === '' ? '' : Number(e.target.value) }))}
                onBlur={(e) => setParams(p => ({ ...p, cropWidth: clamp(Number(e.target.value) || 16, 16, 8192) }))}
                className={inputClass}
                placeholder="W"
              />
              <input
                type="number"
                min="16"
                value={params.cropHeight}
                onChange={(e) => setParams(p => ({ ...p, cropHeight: e.target.value === '' ? '' : Number(e.target.value) }))}
                onBlur={(e) => setParams(p => ({ ...p, cropHeight: clamp(Number(e.target.value) || 16, 16, 8192) }))}
                className={inputClass}
                placeholder="H"
              />
            </div>)}
            <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs p-3 rounded-md italic">
              Draw a box directly on the canvas to crop visually!
            </div>
          </>
        );
      case 'hsv':
        return (
          <>
            {field('Hue', <input type="range" min="-180" max="180" value={params.hsvHue} onChange={(e) => setParams(p => ({ ...p, hsvHue: Number(e.target.value) }))} className={rangeClass} />)}
            {field('Saturation', <input type="range" min="-100" max="100" value={params.hsvSaturation} onChange={(e) => setParams(p => ({ ...p, hsvSaturation: Number(e.target.value) }))} className={rangeClass} />)}
          </>
        );
      case 'jpeg':
        return (
          <>
            {field('Quality', <input type="range" min="10" max="95" value={params.jpegQuality} onChange={(e) => setParams(p => ({ ...p, jpegQuality: Number(e.target.value) }))} className={rangeClass} />)}
            <div className="flex justify-end text-xs text-zinc-400 font-mono">{params.jpegQuality}%</div>

            {jpegBlobSize && (
              <div className="mt-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 flex flex-col gap-1.5 font-mono">
                <div className="flex justify-between">
                  <span>Original uploaded size:</span>
                  <span>{originalFile ? (originalFile.size / 1024).toFixed(1) : '?'} KB</span>
                </div>
                <div className="w-full h-px bg-zinc-800 my-0.5"></div>
                <div className="flex justify-between text-cyan-400 font-bold">
                  <span>Actual JPEG export size:</span>
                  <span>{(jpegBlobSize / 1024).toFixed(1)} KB</span>
                </div>
              </div>
            )}
          </>
        );
      case 'median':
        return (
          <>
            {field('Kernel Size', <input type="range" min="3" max="15" step="2" value={params.medianKsize} onChange={(e) => setParams(p => ({ ...p, medianKsize: Number(e.target.value) }))} className={rangeClass} />)}
            <div className="flex justify-end text-xs text-zinc-400 font-mono">{params.medianKsize}Ã—{params.medianKsize}</div>
          </>
        );
      case 'saltpepper':
        return (
          <>
            {field('Noise Amount', <input type="range" min="0.01" max="0.3" step="0.01" value={params.noiseAmount} onChange={(e) => setParams(p => ({ ...p, noiseAmount: Number(e.target.value) }))} className={rangeClass} />)}
            <div className="flex justify-end text-xs text-zinc-400 font-mono">{(params.noiseAmount * 100).toFixed(0)}%</div>
          </>
        );
      case 'threshold':
        return (
          <>
            {field('Threshold Value', <input type="range" min="0" max="255" value={params.threshold} onChange={(e) => setParams(p => ({ ...p, threshold: Number(e.target.value) }))} className={rangeClass} />)}
            <div className="flex justify-end text-xs text-zinc-400 font-mono">{params.threshold} / 255</div>
          </>
        );
      case 'seg_threshold':
        return (
          <>
            {field('Threshold Value', <input type="range" min="0" max="255" value={params.segThreshold} onChange={(e) => setParams(p => ({ ...p, segThreshold: Number(e.target.value) }))} className={rangeClass} />)}
            <div className="flex justify-end text-xs text-zinc-400 font-mono">{params.segThreshold} / 255</div>
          </>
        );
      case 'seg_region':
        return (
          <>
            {field('Number of Regions', <input type="range" min="2" max="10" value={params.segRegions} onChange={(e) => setParams(p => ({ ...p, segRegions: Number(e.target.value) }))} className={rangeClass} />)}
            <div className="flex justify-end text-xs text-zinc-400 font-mono">{params.segRegions} regions</div>
          </>
        );
      case 'quantization':
        return (
          <>
            {field('Bit Depth per Channel', <input type="range" min="1" max="8" value={params.quantBits} onChange={(e) => setParams(p => ({ ...p, quantBits: Number(e.target.value) }))} className={rangeClass} />)}
            <div className="flex justify-end text-xs text-zinc-400 font-mono">{params.quantBits} bits</div>

            {compressionStats && (
              <div className="mt-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col gap-4 shadow-lg">
                <div className="flex justify-between items-center bg-zinc-950/50 p-2.5 rounded-lg border border-zinc-800/30">
                  <span className="text-xs text-zinc-400">Total Unique Colors</span>
                  <span className="text-sm font-mono font-bold text-cyan-400">{compressionStats.unique_colors?.toLocaleString() || '?'} max</span>
                </div>

                {/* Visual Bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    <span>Uncompressed RGB Memory</span>
                    <span>Indexed Palette Memory</span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800/50">
                    <div 
                      className={`h-full ${compressionStats.compressed_size < compressionStats.original_size ? 'bg-cyan-500' : 'bg-red-500'}`} 
                      style={{ width: `${Math.min(100, (compressionStats.compressed_size / compressionStats.original_size) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 uppercase">24-Bit RGB</span>
                    <span className="text-sm font-mono text-zinc-300">{(compressionStats.original_size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-zinc-500 uppercase">Indexed Memory</span>
                    <span className={`text-sm font-mono font-bold ${compressionStats.compressed_size < compressionStats.original_size ? 'text-cyan-400' : 'text-red-400'}`}>
                      {(compressionStats.compressed_size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <div className="w-full h-px bg-zinc-800 my-0.5"></div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">Memory Saving</span>
                    <span className={`text-xs font-mono font-medium ${compressionStats.compressed_size < compressionStats.original_size ? 'text-green-400' : 'text-red-400'}`}>
                      {compressionStats.compressed_size < compressionStats.original_size 
                        ? '+' + ((1 - (compressionStats.compressed_size / compressionStats.original_size)) * 100).toFixed(1) + '%'
                        : '-' + (((compressionStats.compressed_size / compressionStats.original_size) - 1) * 100).toFixed(1) + '%'}
                    </span>
                  </div>
                </div>

                <div className="mt-2 p-2.5 rounded-lg bg-zinc-950 text-[10px] text-zinc-500 leading-relaxed border border-zinc-800/50">
                  <strong className="text-zinc-400">How to explain this:</strong> By reducing the colors, we no longer need to store 24-bits (RGB) for every pixel. Instead, we store a tiny global palette of colors, and each pixel just stores a small index pointing to that palette.
                  <br/><br/>
                  <span className="italic">Note: If you export this as a BMP or standard 24-bit JPG/PNG, the file size won't shrink because those formats will just save the image in full 24-bit anyway. Real savings happen when exporting as an Indexed PNG (8-bit) or GIF!</span>
                </div>

                <button
                  onClick={async () => {
                    if (!originalFile) return;
                    await downloadFileRequest('/api/compression/quantization/export', originalFile, { quantBits: params.quantBits }, 'mini-photoshop-indexed.png');
                  }}
                  className="mt-2 w-full flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors rounded-lg py-2 text-xs font-semibold uppercase tracking-wider"
                >
                  <FiDownload size={14} />
                  Download True Indexed PNG
                </button>
              </div>
            )}
          </>
        );
      case 'histogram':
      case 'histogram_rgb':
        return (
          <div className="h-64 flex flex-col">
            {histogramData ? (
              <HistogramPanel data={histogramData} isRGB={tool.id === 'histogram_rgb'} loading={loading} />
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-xs text-zinc-500 bg-zinc-900/50 rounded-lg border border-zinc-800/50 p-4">
                Click Generate Histogram below to analyze the current image.
              </div>
            )}
          </div>
        );
      case 'cnn_detect':
        return (
          <div className="flex flex-col gap-4">
            <div className="text-xs text-zinc-400">
              Run object recognition across different datasets using Scratch or Pre-trained models.
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Dataset</label>
              <select
                value={params.cnnDataset}
                onChange={(e) => setParams(p => ({ ...p, cnnDataset: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded p-2 focus:border-cyan-500 outline-none"
              >
                <option value="fruits">Fruits (Apple, Banana, Grape, Mango, Strawberry)</option>
                <option value="intel">Intel Image (Buildings, Sea, Glacier, Mountains, Forest, Streets)</option>
                <option value="animals">Animals (Lion, Cat, Dog, Horse, Elephant)</option>
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">Model Type</label>
              <select
                value={params.cnnModelType}
                onChange={(e) => setParams(p => ({ ...p, cnnModelType: e.target.value }))}
                className="w-full bg-zinc-900 border border-zinc-700 text-zinc-200 text-xs rounded p-2 focus:border-cyan-500 outline-none"
              >
                <option value="scratch">Scratch Model</option>
                <option value="pretrained">Pre-trained Model</option>
              </select>
            </div>

            {cnnResult && (
              <div className="bg-zinc-900 border border-zinc-700 p-4 rounded-lg flex flex-col gap-3">
                {cnnResult.ood_warning && (
                  <div className="bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] p-2.5 rounded text-center leading-relaxed font-semibold">
                    LOW CONFIDENCE: This image may be Out of Distribution (not in the dataset).
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Detected:</span>
                  <span className="text-sm font-bold text-cyan-400 uppercase tracking-widest">{cnnResult.label}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">Confidence:</span>
                  <span className="text-sm font-mono text-zinc-200">{(cnnResult.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-px bg-zinc-800 my-1"></div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-semibold mb-1">ALL SCORES</span>
                  {Object.entries(cnnResult?.scores || {}).sort((a, b) => b[1] - a[1]).map(([label, score]) => (
                    <div key={label} className="flex items-center gap-2 text-xs">
                      <span className="w-16 text-zinc-400 capitalize">{label}</span>
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500/50" style={{ width: `${score * 100}%` }}></div>
                      </div>
                      <span className="w-10 text-right font-mono text-zinc-500 text-[10px]">{(score * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      case 'rle':
      case 'huffman':
      case 'arithmetic':
      case 'lzw':
        return (
          <div className="flex flex-col gap-4">
            {compressionStats && (
              <div className="mt-4 p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex flex-col gap-4 shadow-lg">
                
                {/* Visual Bar */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                    <span>Uncompressed Memory</span>
                    <span>Encoded Stream</span>
                  </div>
                  <div className="h-2.5 w-full bg-zinc-950 rounded-full overflow-hidden flex border border-zinc-800/50">
                    <div 
                      className={`h-full ${compressionStats.compressed_size < compressionStats.original_size ? 'bg-cyan-500' : 'bg-red-500'}`} 
                      style={{ width: `${Math.min(100, (compressionStats.compressed_size / compressionStats.original_size) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-zinc-500 uppercase">Raw Pixels</span>
                    <span className="text-sm font-mono text-zinc-300">{(compressionStats.original_size / 1024).toFixed(1)} KB</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-[10px] text-zinc-500 uppercase">Simulated</span>
                    <span className={`text-sm font-mono font-bold ${compressionStats.compressed_size < compressionStats.original_size ? 'text-cyan-400' : 'text-red-400'}`}>
                      {(compressionStats.compressed_size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                </div>

                <div className="w-full h-px bg-zinc-800 my-0.5"></div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">Compression Ratio</span>
                    <span className="text-xs font-mono font-medium text-zinc-300">{compressionStats.ratio}x</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-zinc-400">Space Saving</span>
                    <span className={`text-xs font-mono font-medium ${compressionStats.compressed_size < compressionStats.original_size ? 'text-green-400' : 'text-red-400'}`}>
                      {compressionStats.compressed_size < compressionStats.original_size 
                        ? '+' + ((1 - (compressionStats.compressed_size / compressionStats.original_size)) * 100).toFixed(1) + '%'
                        : '-' + (((compressionStats.compressed_size / compressionStats.original_size) - 1) * 100).toFixed(1) + '%'}
                    </span>
                  </div>
                </div>

                <div className="mt-2 p-2.5 rounded-lg bg-zinc-950 text-[10px] text-zinc-500 leading-relaxed border border-zinc-800/50">
                  <strong className="text-zinc-400">How to read this:</strong> We compare the theoretical size of the encoded algorithm against the uncompressed raw memory (width Ã— height Ã— 3 channels). 
                  <br/><br/>
                  <span className="italic">Note: The file you originally uploaded was {(originalFile ? (originalFile.size / 1024).toFixed(1) : '?')} KB, but it was already heavily compressed by JPEG/PNG. Lossless algorithms like RLE/Huffman are measured against raw pixels.</span>
                </div>
                
                {tool.id === 'rle' && (
                  <button
                    onClick={async () => {
                      if (!originalFile) return;
                      await downloadFileRequest('/api/compression/rle/export', originalFile, {}, 'mini-photoshop-export.rle');
                    }}
                    className="mt-2 w-full flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors rounded-lg py-2 text-xs font-semibold uppercase tracking-wider"
                  >
                    <FiDownload size={14} />
                    Download Custom .RLE Binary
                  </button>
                )}
                
                {tool.id === 'huffman' && (
                  <button
                    onClick={async () => {
                      if (!originalFile) return;
                      await downloadFileRequest('/api/compression/huffman/export', originalFile, {}, 'mini-photoshop-export.huff');
                    }}
                    className="mt-2 w-full flex items-center justify-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors rounded-lg py-2 text-xs font-semibold uppercase tracking-wider"
                  >
                    <FiDownload size={14} />
                    Download Custom .HUFF Binary
                  </button>
                )}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-md p-4 text-center">
            <span className="text-sm text-zinc-400">No parameters required.</span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto custom-scrollbar">
      <div className="p-5 space-y-6 flex-1">
        <div className="flex flex-col gap-3 pb-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center text-cyan-400">
              {tool.icon && <tool.icon size={16} />}
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-100">{tool.label}</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">
                {tool.toolType === 'export' ? 'Exportable image format' : tool.toolType === 'preprocess' ? 'Preprocessing effect' : tool.toolType === 'simulation' ? 'Simulation only' : 'Active Tool'}
              </p>
            </div>
          </div>
          {tool.description && (
            <p className="text-xs text-zinc-400 leading-relaxed bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/40 font-normal">
              {tool.description}
            </p>
          )}
        </div>

        <div className="space-y-6">
          {renderControls()}
        </div>

        {tool.id !== 'move' && tool.id !== 'resize' && !isEditingNode && (
          <button
            onClick={onApply}
            disabled={loading}
            className="w-full mt-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-semibold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            {loading ? (
              <><div className="w-3 h-3 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" /> Processing...</>
            ) : tool.id.startsWith('histogram') ? (
              'Generate Histogram'
            ) : tool.id.startsWith('cnn') ? (
              'Run Classification'
            ) : toolGroups.find(g => g.id === 'compression')?.tools.find(t => t.id === tool.id) ? (
              'Analyze Size'
            ) : toolGroups.find(g => g.id === 'geometric')?.tools.find(t => t.id === tool.id) ? (
              'Apply Changes'
            ) : (
              'Add Filter'
            )}
          </button>
        )}

        {isEditingNode && (
          <div className="mt-4 p-3 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-400 text-center">
            Editing {tool.label}. Changes are applied automatically.
          </div>
        )}
      </div>
    </div>
  );
}
