import { useMemo, useState, useEffect, useRef } from 'react';
import { sendImageRequest } from './api/api';
import { useDropzone } from 'react-dropzone';
import { 
  FiUploadCloud, FiImage, FiSliders, FiLayout, FiActivity, FiScissors, FiMove,
  FiSun, FiCrosshair, FiDroplet, FiBarChart2, FiRotateCw, FiColumns, FiMaximize, FiCrop,
  FiMoon, FiAperture, FiBarChart, FiTrendingUp, FiMinimize2, FiMaximize2, FiCpu, FiTrash2,
  FiCornerUpLeft, FiCornerUpRight, FiPlus, FiMinus, FiLayers, FiClock, FiEye, FiSettings,
  FiFilter, FiZap, FiGrid, FiTarget, FiPieChart, FiCode, FiBox, FiCircle, FiTriangle, FiWifi
} from 'react-icons/fi';

import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Rnd } from 'react-rnd';

// ----------------------------------------------------------------------
// DATA & CONFIG
// ----------------------------------------------------------------------

const toolGroups = [
  {
    id: 'enhancement',
    name: 'Enhancement',
    icon: FiSliders,
    tools: [
      { id: 'brightness', label: 'Brightness / Contrast', icon: FiSun },
      { id: 'sharpen', label: 'Sharpen', icon: FiCrosshair },
      { id: 'blur', label: 'Gaussian Blur', icon: FiDroplet },
      { id: 'clahe', label: 'Histogram Eq', icon: FiBarChart2 },
    ],
  },
  {
    id: 'restoration',
    name: 'Restoration',
    icon: FiFilter,
    tools: [
      { id: 'blur', label: 'Gaussian Blur', icon: FiDroplet },
      { id: 'median', label: 'Median Filter', icon: FiFilter },
      { id: 'saltpepper', label: 'Salt & Pepper', icon: FiGrid },
    ],
  },
  {
    id: 'geometric',
    name: 'Geometric',
    icon: FiLayout,
    tools: [
      { id: 'move', label: 'Move', icon: FiMove },
      { id: 'resize', label: 'Resize', icon: FiMaximize },
      { id: 'rotate', label: 'Rotate', icon: FiRotateCw },
      { id: 'flip', label: 'Flip', icon: FiColumns },
      { id: 'crop', label: 'Crop Mode', icon: FiCrop },
    ],
  },
  {
    id: 'edge',
    name: 'Binary & Edge',
    icon: FiActivity,
    tools: [
      { id: 'threshold', label: 'Thresholding', icon: FiGrid },
      { id: 'canny', label: 'Canny', icon: FiActivity },
      { id: 'sobel', label: 'Sobel', icon: FiTrendingUp },
      { id: 'prewitt', label: 'Prewitt', icon: FiZap },
      { id: 'roberts', label: 'Roberts', icon: FiTriangle },
      { id: 'laplacian', label: 'Laplacian', icon: FiCircle },
      { id: 'log', label: 'Laplacian of Gaussian', icon: FiWifi },
      { id: 'erosion', label: 'Erosion', icon: FiMinimize2 },
      { id: 'dilation', label: 'Dilation', icon: FiMaximize2 },
    ],
  },
  {
    id: 'color',
    name: 'Color',
    icon: FiImage,
    tools: [
      { id: 'grayscale', label: 'Grayscale', icon: FiMoon },
      { id: 'hsv', label: 'Hue / Saturation', icon: FiAperture },
      { id: 'channel_r', label: 'Red Channel', icon: FiImage },
      { id: 'channel_g', label: 'Green Channel', icon: FiImage },
      { id: 'channel_b', label: 'Blue Channel', icon: FiImage },
    ],
  },
  {
    id: 'segmentation',
    name: 'Segmentation',
    icon: FiBox,
    tools: [
      { id: 'seg_threshold', label: 'Threshold-based', icon: FiGrid },
      { id: 'seg_edge', label: 'Edge-based', icon: FiActivity },
      { id: 'seg_region', label: 'Region-based', icon: FiPieChart },
    ],
  },
  {
    id: 'histogram',
    name: 'Histogram',
    icon: FiBarChart,
    tools: [
      { id: 'histogram', label: 'Grayscale Histogram', icon: FiBarChart },
      { id: 'histogram_rgb', label: 'RGB Histogram', icon: FiBarChart2 },
    ],
  },
  {
    id: 'compression',
    name: 'Compression',
    icon: FiScissors,
    tools: [
      { id: 'jpeg', label: 'JPEG Quality', icon: FiImage },
      { id: 'rle', label: 'RLE', icon: FiCpu },
      { id: 'huffman', label: 'Huffman', icon: FiCode },
      { id: 'arithmetic', label: 'Arithmetic', icon: FiCode },
      { id: 'lzw', label: 'LZW', icon: FiCode },
      { id: 'quantization', label: 'Quantization', icon: FiTarget },
    ],
  },
  {
    id: 'cnn',
    name: 'CNN',
    icon: FiTarget,
    tools: [
      { id: 'cnn_detect', label: 'Object Recognition', icon: FiTarget },
    ],
  },
];

const defaultParams = {
  brightness: 0,
  contrast: 0,
  gamma: 1,
  rotate: 0,
  flipMode: 'horizontal',
  resizeWidth: 400,
  resizeHeight: 400,
  cropX: 50,
  cropY: 50,
  cropWidth: 200,
  cropHeight: 200,
  moveX: 0,
  moveY: 0,
  hsvHue: 0,
  hsvSaturation: 0,
  jpegQuality: 80,
  // Restoration
  medianKsize: 3,
  noiseAmount: 0.05,
  // Binary & Edge
  threshold: 128,
  // Segmentation
  segThreshold: 128,
  segRegions: 3,
  // Compression
  quantBits: 4,
};

const toolEndpointMap = {
  // Enhancement
  brightness: '/api/enhancement/brightness-contrast',
  sharpen: '/enhancement/sharpen',
  clahe: '/enhancement/histogram-equalization',
  // Restoration
  blur: '/enhancement/blur',
  median: '/restoration/median',
  saltpepper: '/restoration/denoise',
  // Geometric
  move: '/geometric/translate',
  resize: '/geometric/resize',
  rotate: '/geometric/rotate',
  flip: '/geometric/flip',
  crop: '/geometric/crop',
  // Color
  grayscale: '/color/grayscale',
  hsv: '/color/hsv',
  channel_r: '/color/channel?channel=r',
  channel_g: '/color/channel?channel=g',
  channel_b: '/color/channel?channel=b',
  // Binary & Edge
  threshold: '/edge/threshold',
  canny: '/edge/canny',
  sobel: '/edge/sobel',
  prewitt: '/edge/prewitt',
  roberts: '/edge/roberts',
  laplacian: '/edge/laplacian',
  log: '/edge/log',
  erosion: '/morphology/erosion',
  dilation: '/morphology/dilation',
  // Histogram
  histogram: '/histogram/grayscale',
  histogram_rgb: '/histogram/rgb',
  // Segmentation
  seg_threshold: '/segmentation/threshold',
  seg_edge: '/segmentation/edge',
  seg_region: '/segmentation/region',
  // Compression
  jpeg: '/compression/jpeg',
  rle: '/compression/rle',
  huffman: '/compression/huffman',
  arithmetic: '/compression/arithmetic',
  lzw: '/compression/lzw',
  quantization: '/compression/quantization',
  // CNN
  cnn_detect: '/cnn/detect',
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Maps frontend slider params to what each backend endpoint expects
function buildBackendParams(toolId, params) {
  switch (toolId) {
    case 'brightness':
      return {
        brightness: params.brightness,
        // Backend uses multiplier (1.0 = no change); slider is -100..100 (0 = no change)
        contrast: Number(((params.contrast + 100) / 100).toFixed(3)),
      };
    default:
      return params;
  }
}

// ----------------------------------------------------------------------
// CUSTOM HOOKS
// ----------------------------------------------------------------------

function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(prev => JSON.stringify(prev) === JSON.stringify(value) ? prev : value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// ----------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------

function PropertiesPanel({ tool, params, setParams, canvasRef, onApply, loading }) {
  const field = (label, element) => (
    <div className="flex flex-col gap-2.5">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{label}</label>
      </div>
      {element}
    </div>
  );

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
      case 'rotate':
        return (
          <>
            {field('Angle (°)', <input type="range" min="0" max="360" value={params.rotate} onChange={(e) => setParams(p => ({ ...p, rotate: Number(e.target.value) }))} className={rangeClass} />)}
            <div className="flex justify-end text-xs text-zinc-400 font-mono">{params.rotate}°</div>
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
                  <input type="number" value={params.moveX} onChange={(e) => {
                    const cw = canvasRef?.current?.clientWidth ?? 9999;
                    const margin = 48;
                    setParams(p => ({ ...p, moveX: clamp(Number(e.target.value), -(p.resizeWidth - margin), cw - margin) }));
                  }} className={inputClass} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 mb-1">Y (px)</span>
                  <input type="number" value={params.moveY} onChange={(e) => {
                    const ch = canvasRef?.current?.clientHeight ?? 9999;
                    const margin = 48;
                    setParams(p => ({ ...p, moveY: clamp(Number(e.target.value), -(p.resizeHeight - margin), ch - margin) }));
                  }} className={inputClass} />
                </div>
              </div>
            ))}
            <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs p-3 rounded-md">
              Drag the image on the canvas — the values above will update automatically!
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
                  <input type="number" min="48" value={params.resizeWidth} onChange={(e) => {
                    const cw = canvasRef?.current?.clientWidth ?? 8192;
                    setParams(p => ({ ...p, resizeWidth: clamp(Number(e.target.value), 48, cw) }));
                  }} className={inputClass} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-zinc-500 mb-1">Height (px)</span>
                  <input type="number" min="48" value={params.resizeHeight} onChange={(e) => {
                    const ch = canvasRef?.current?.clientHeight ?? 8192;
                    setParams(p => ({ ...p, resizeHeight: clamp(Number(e.target.value), 48, ch) }));
                  }} className={inputClass} />
                </div>
              </div>
            ))}
            <div className="bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs p-3 rounded-md">
              Drag the image corners on the canvas — the values above will update automatically!
            </div>
          </>
        );
      case 'crop':
        return (
          <>
            {field('Position X/Y', <div className="grid grid-cols-2 gap-3">
              <input type="number" min="0" value={params.cropX} onChange={(e) => setParams(p => ({ ...p, cropX: Number(e.target.value) }))} className={inputClass} placeholder="X" />
              <input type="number" min="0" value={params.cropY} onChange={(e) => setParams(p => ({ ...p, cropY: Number(e.target.value) }))} className={inputClass} placeholder="Y" />
            </div>)}
            {field('Size W/H', <div className="grid grid-cols-2 gap-3">
              <input type="number" min="16" value={params.cropWidth} onChange={(e) => setParams(p => ({ ...p, cropWidth: clamp(Number(e.target.value), 16, 8192) }))} className={inputClass} placeholder="W" />
              <input type="number" min="16" value={params.cropHeight} onChange={(e) => setParams(p => ({ ...p, cropHeight: clamp(Number(e.target.value), 16, 8192) }))} className={inputClass} placeholder="H" />
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
          </>
        );
      case 'median':
        return (
          <>
            {field('Kernel Size', <input type="range" min="3" max="15" step="2" value={params.medianKsize} onChange={(e) => setParams(p => ({ ...p, medianKsize: Number(e.target.value) }))} className={rangeClass} />)}
            <div className="flex justify-end text-xs text-zinc-400 font-mono">{params.medianKsize}×{params.medianKsize}</div>
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
            {field('Bit Depth', <input type="range" min="1" max="8" value={params.quantBits} onChange={(e) => setParams(p => ({ ...p, quantBits: Number(e.target.value) }))} className={rangeClass} />)}
            <div className="flex justify-end text-xs text-zinc-400 font-mono">{params.quantBits} bits</div>
          </>
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
        {/* Active Tool Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-zinc-800/50">
          <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center text-cyan-400">
            {tool.icon && <tool.icon size={16} />}
          </div>
          <div>
            <h3 className="text-sm font-medium text-zinc-100">{tool.label}</h3>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Active Tool</p>
          </div>
        </div>

        {/* Sliders / Inputs */}
        <div className="space-y-6">
          {renderControls()}
        </div>

        {/* Apply Filter Button */}
        <button
          onClick={onApply}
          disabled={loading}
          className="w-full mt-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-semibold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
        >
          {loading ? (
            <><div className="w-3 h-3 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" /> Processing…</>
          ) : (
            'Apply Filter'
          )}
        </button>
      </div>

      {/* Placeholders for Professional UX */}
      <div className="p-5 space-y-6 bg-zinc-950/30 border-t border-zinc-800/50">
        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <FiLayers /> Layers
          </h3>
          <div className="bg-zinc-900 rounded-md p-2 border border-zinc-800 flex items-center gap-3 hover:bg-zinc-800 transition-colors cursor-pointer group">
            <div className="w-8 h-8 bg-zinc-800 rounded border border-zinc-700 overflow-hidden flex-shrink-0">
              <div className="w-full h-full bg-cyan-500/20"></div>
            </div>
            <span className="text-xs text-zinc-300 font-medium group-hover:text-white">Background</span>
            <FiEye className="text-zinc-500 ml-auto group-hover:text-zinc-300" size={14} />
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <FiClock /> History
          </h3>
          <div className="space-y-1">
            <div className="text-xs text-zinc-300 flex items-center gap-2 px-2 py-1.5 rounded bg-cyan-500/10 border border-cyan-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400"></div> 
              Current State
            </div>
            <div className="text-xs text-zinc-500 flex items-center gap-2 px-2 py-1.5 hover:bg-zinc-900 rounded cursor-pointer transition-colors">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-600"></div> 
              Image Uploaded
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// MAIN APP
// ----------------------------------------------------------------------

function App() {
  const [originalFile, setOriginalFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState('');
  const [processedPreview, setProcessedPreview] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState(toolGroups[0].id);
  const [selectedTool, setSelectedTool] = useState(toolGroups[0].tools[0].id);
  
  const [params, setParams] = useState(defaultParams);

  const [loading, setLoading] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCompare, setShowCompare] = useState(false);
  const canvasRef = useRef(null);

  // Histogram compare state
  const [processedBlob, setProcessedBlob] = useState(null);
  const [originalHistogramUrl, setOriginalHistogramUrl] = useState('');
  const [processedHistogramUrl, setProcessedHistogramUrl] = useState('');
  const [histogramLoading, setHistogramLoading] = useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'image/*': [] },
    maxFiles: 1,
    noClick: !!originalPreview,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setOriginalFile(file);
      setOriginalPreview(URL.createObjectURL(file));
      setProcessedPreview('');
      setParams(defaultParams);
    },
  });

  // Category change logic
  useEffect(() => {
    const category = toolGroups.find(g => g.id === selectedCategory);
    if (category && !category.tools.find(t => t.id === selectedTool)) {
      setSelectedTool(category.tools[0].id);
    }
  }, [selectedCategory]);

  const activeCategory = toolGroups.find(g => g.id === selectedCategory);
  const activeTool = activeCategory?.tools.find(t => t.id === selectedTool);

  const handleRemoveImage = (e) => {
    e.stopPropagation();
    setOriginalFile(null);
    setOriginalPreview('');
    setProcessedPreview('');
    setProcessedBlob(null);
    setOriginalHistogramUrl('');
    setProcessedHistogramUrl('');
    setShowCompare(false);
  };

  const handleReset = () => {
    setProcessedPreview('');
    setProcessedBlob(null);
    setOriginalHistogramUrl('');
    setProcessedHistogramUrl('');
    setShowCompare(false);
    setParams(defaultParams);
  };

  const handleExport = (format) => {
    const src = processedPreview || originalPreview;
    if (!src) return;
    setShowExportMenu(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');

      // BMP/JPG need white background (no alpha)
      if (format === 'bmp' || format === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(img, 0, 0);

      const mimeMap = { png: 'image/png', jpeg: 'image/jpeg', bmp: 'image/bmp' };
      const extMap  = { png: 'png', jpeg: 'jpg', bmp: 'bmp' };
      const dataUrl = canvas.toDataURL(mimeMap[format], format === 'jpeg' ? 0.92 : undefined);

      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `mini-photoshop-export.${extMap[format]}`;
      a.click();
    };
    img.src = src;
  };

  // MANUAL APPLY LOGIC
  const handleApply = async () => {
    if (!originalFile || !activeTool) return;
    const endpoint = toolEndpointMap[activeTool.id];
    if (!endpoint) return;

    setLoading(true);
    try {
      const backendParams = buildBackendParams(activeTool.id, params);
      const blob = await sendImageRequest(endpoint, originalFile, backendParams);
      setProcessedBlob(blob);
      setProcessedPreview(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Filter apply error:', error);
    } finally {
      setLoading(false);
    }
  };


  // Canvas Mode detection
  const isCropMode = selectedTool === 'crop';
  const isHistogramMode = selectedCategory === 'histogram';

  // Auto-fetch histograms when switching to Histogram category
  useEffect(() => {
    if (!isHistogramMode || !originalFile) return;
    let isMounted = true;
    setOriginalHistogramUrl('');
    setProcessedHistogramUrl('');

    const fetchHistograms = async () => {
      setHistogramLoading(true);
      const endpoint = toolEndpointMap[selectedTool];
      if (!endpoint) { setHistogramLoading(false); return; }

      try {
        // Before: histogram of original
        const origBlob = await sendImageRequest(endpoint, originalFile, params);
        if (isMounted) setOriginalHistogramUrl(URL.createObjectURL(origBlob));

        // After: histogram of processed image (if one exists)
        if (processedBlob) {
          const procFile = new File([processedBlob], 'processed.jpg', { type: 'image/jpeg' });
          const procHistBlob = await sendImageRequest(endpoint, procFile, params);
          if (isMounted) setProcessedHistogramUrl(URL.createObjectURL(procHistBlob));
        }
      } catch (err) {
        console.error('Histogram fetch error:', err);
      } finally {
        if (isMounted) setHistogramLoading(false);
      }
    };

    fetchHistograms();
    return () => { isMounted = false; };
  }, [isHistogramMode, selectedTool, originalFile, processedBlob]);

  const cropState = {
    unit: 'px',
    x: params.cropX,
    y: params.cropY,
    width: params.cropWidth,
    height: params.cropHeight
  };

  // The base image we are looking at (processed if available, else original)
  const currentImageSrc = processedPreview || originalPreview;

  return (
    <div className="h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans flex flex-col selection:bg-cyan-500/30">
      
      {/* --------------------------------------------------- */}
      {/* TOP BAR */}
      {/* --------------------------------------------------- */}
      <header className="h-12 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 shrink-0 z-30 relative shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-cyan-500/20">M</div>
          <span className="font-semibold tracking-tight text-xs text-zinc-200">Mini Photoshop</span>
        </div>
        
        <div className="flex items-center gap-1 bg-zinc-950/50 p-1 rounded-md border border-zinc-800/80">
          <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors" title="Undo"><FiCornerUpLeft size={14} /></button>
          <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors" title="Redo"><FiCornerUpRight size={14} /></button>
          <div className="w-px h-3 bg-zinc-700 mx-1"></div>
          <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors" title="Zoom Out"><FiMinus size={14} /></button>
          <span className="text-[10px] text-zinc-300 font-medium px-2 w-12 text-center">100%</span>
          <button className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors" title="Zoom In"><FiPlus size={14} /></button>
        </div>

        <div className="flex items-center gap-3">
          {originalFile && (
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono hidden md:flex">
              {loading && <FiActivity className="animate-spin text-cyan-500" />}
              <span>{loading ? 'Processing...' : 'Ready'}</span>
            </div>
          )}

          {/* Compare toggle — only when a processed result exists */}
          {processedPreview && !isHistogramMode && (
            <button
              onClick={() => setShowCompare(v => !v)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all border ${
                showCompare
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40'
                  : 'text-zinc-400 hover:text-zinc-200 border-zinc-700 hover:border-zinc-600'
              }`}
              title="Toggle before/after compare"
            >
              {showCompare ? 'Exit Compare' : 'Compare'}
            </button>
          )}

          {/* Reset button — only when a processed result exists */}
          {processedPreview && (
            <button
              onClick={handleReset}
              className="text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500/50 px-3 py-1.5 rounded text-xs font-medium transition-colors"
              title="Reset to original image"
            >
              Reset
            </button>
          )}
          
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(v => !v)}
              disabled={!originalPreview}
              className="bg-zinc-100 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-zinc-900 px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
            >
              Export As
              <span className="text-zinc-500 text-[10px]">{showExportMenu ? '▲' : '▼'}</span>
            </button>

            {showExportMenu && (
              <>
                {/* Backdrop to close */}
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-full mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden min-w-[140px]">
                  {[
                    { label: 'PNG', sub: 'Lossless', format: 'png' },
                    { label: 'JPG / JPEG', sub: 'Compressed', format: 'jpeg' },
                    { label: 'BMP', sub: 'Uncompressed', format: 'bmp' },
                  ].map(({ label, sub, format }) => (
                    <button
                      key={format}
                      onClick={() => handleExport(format)}
                      className="w-full flex flex-col items-start px-4 py-3 hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-0"
                    >
                      <span className="text-xs font-semibold text-zinc-100">{label}</span>
                      <span className="text-[10px] text-zinc-500">{sub}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* --------------------------------------------------- */}
      {/* MAIN WORKSPACE (3-PANE LAYOUT) */}
      {/* --------------------------------------------------- */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* --- LEFT SIDEBAR (TOOLS) --- */}
        <aside className="w-16 border-r border-zinc-800 bg-zinc-900 shrink-0 flex flex-col py-3 gap-1 z-20 shadow-xl">
          {toolGroups.map((group) => {
            const Icon = group.icon;
            const isActive = selectedCategory === group.id;
            return (
              <button
                key={group.id}
                onClick={() => setSelectedCategory(group.id)}
                className={`relative group flex flex-col items-center justify-center h-14 mx-2 rounded-xl transition-all ${
                  isActive ? 'bg-zinc-800 text-cyan-400 shadow-inner' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                }`}
                title={group.name}
              >
                <Icon size={20} className={isActive ? 'drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]' : ''} />
                
                {/* Tooltip */}
                <div className="absolute left-full ml-3 px-2 py-1 bg-zinc-800 border border-zinc-700 text-zinc-200 text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                  {group.name}
                </div>
              </button>
            );
          })}
        </aside>

        {/* --- INNER SIDEBAR (SUBTOOLS) --- */}
        <aside className="w-56 border-r border-zinc-800 bg-[#121214] shrink-0 flex flex-col z-10">
          <div className="px-4 py-3 border-b border-zinc-800/50">
            <h2 className="text-xs font-semibold text-zinc-300">{activeCategory?.name}</h2>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
            {activeCategory?.tools.map((tool) => {
              const ToolIcon = tool.icon;
              const isActive = selectedTool === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${
                    isActive 
                      ? 'bg-cyan-500/10 text-cyan-400 font-medium' 
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                  }`}
                >
                  {ToolIcon && <ToolIcon size={14} className={isActive ? "text-cyan-400" : "text-zinc-500"} />}
                  <span className="text-xs">{tool.label}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* --- CENTER CANVAS --- */}
        <main className="flex-1 relative flex flex-col min-w-0 bg-[#09090b] checkerboard">

          {/* -------- HISTOGRAM COMPARE MODE -------- */}
          {isHistogramMode && originalFile ? (
            <div className="flex-1 flex gap-0 p-6 overflow-hidden">

              {/* Before Panel */}
              <div className="flex-1 flex flex-col gap-3 animate-slide-in-left overflow-hidden">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full"></div>
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Before</span>
                </div>
                <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden shadow-xl">
                  {histogramLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                      <span className="text-xs text-zinc-500">Generating histogram…</span>
                    </div>
                  ) : originalHistogramUrl ? (
                    <img src={originalHistogramUrl} alt="Before Histogram" className="max-w-full max-h-full object-contain p-4" />
                  ) : (
                    <span className="text-xs text-zinc-600">No histogram available</span>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="w-px mx-6 bg-zinc-800 self-stretch my-2 shrink-0"></div>

              {/* After Panel */}
              <div className="flex-1 flex flex-col gap-3 animate-slide-in-right overflow-hidden">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">After</span>
                </div>
                <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden shadow-xl">
                  {histogramLoading ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                      <span className="text-xs text-zinc-500">Generating histogram…</span>
                    </div>
                  ) : processedHistogramUrl ? (
                    <img src={processedHistogramUrl} alt="After Histogram" className="max-w-full max-h-full object-contain p-4" />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-center px-10">
                      <FiBarChart2 size={28} className="text-zinc-700" />
                      <span className="text-xs text-zinc-600 leading-relaxed">Apply any filter first — the processed histogram will appear here automatically.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

          ) : showCompare && processedPreview ? (
            // -------- IMAGE COMPARE MODE (Before / After) --------
            <div className="flex-1 flex gap-0 p-6 overflow-hidden">

              {/* Before Panel */}
              <div className="flex-1 flex flex-col gap-3 animate-slide-in-left overflow-hidden">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-2 h-2 bg-zinc-400 rounded-full"></div>
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Before</span>
                </div>
                <div className="flex-1 bg-zinc-900/60 rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden shadow-xl">
                  <img src={originalPreview} alt="Before" className="max-w-full max-h-full object-contain p-4 drop-shadow-xl" />
                </div>
              </div>

              {/* Divider */}
              <div className="w-px mx-6 bg-zinc-800 self-stretch my-2 shrink-0"></div>

              {/* After Panel */}
              <div className="flex-1 flex flex-col gap-3 animate-slide-in-right overflow-hidden">
                <div className="flex items-center gap-2 px-1">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                  <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">After</span>
                </div>
                <div className="flex-1 bg-zinc-900/60 rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden shadow-xl">
                  <img src={processedPreview} alt="After" className="max-w-full max-h-full object-contain p-4 drop-shadow-xl" />
                </div>
              </div>
            </div>

          ) : (
          <div className="flex-1 flex p-8 overflow-hidden items-center justify-center relative">
            
            {loading && (
              <div className="absolute top-4 right-4 z-50 bg-zinc-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800 flex items-center gap-2 shadow-xl">
                <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] text-zinc-300 font-medium tracking-wide uppercase">Processing</span>
              </div>
            )}

            <div 
              {...getRootProps()} 
              className={`relative w-full h-full rounded-none flex flex-col items-center justify-center transition-all overflow-hidden
                ${!originalPreview && 'border-2 border-dashed border-zinc-700/50 hover:border-zinc-500 bg-zinc-900/20 backdrop-blur-sm m-8 rounded-2xl'}
                ${isDragActive ? 'border-cyan-500 bg-cyan-500/5 scale-[1.01]' : ''}
              `}
            >
              <input {...getInputProps()} />
              
              {originalPreview ? (
                <div ref={canvasRef} className="w-full h-full flex items-center justify-center overflow-hidden relative">
                  
                  {isCropMode ? (
                    <ReactCrop 
                      crop={cropState} 
                      onChange={(c) => setParams(p => ({
                        ...p, 
                        cropX: Math.round(c.x), 
                        cropY: Math.round(c.y), 
                        cropWidth: Math.round(c.width), 
                        cropHeight: Math.round(c.height)
                      }))}
                      className="max-h-full max-w-full shadow-2xl"
                    >
                      <img src={currentImageSrc} alt="Canvas" className="max-h-full max-w-full object-contain pointer-events-none" />
                    </ReactCrop>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      {/* Universal Interactive Canvas Mode */}
                      <Rnd
                        size={{ width: params.resizeWidth, height: params.resizeHeight }}
                        position={{ x: params.moveX, y: params.moveY }}
                        onDragStop={(e, d) => {
                          if (!canvasRef.current) return;
                          const { clientWidth: cw, clientHeight: ch } = canvasRef.current;
                          const margin = 48; // px — minimum edge that must stay visible
                          const clampedX = clamp(d.x, -(params.resizeWidth - margin), cw - margin);
                          const clampedY = clamp(d.y, -(params.resizeHeight - margin), ch - margin);
                          setParams(p => ({ ...p, moveX: clampedX, moveY: clampedY }));
                        }}
                        onResizeStop={(e, direction, ref, delta, position) => {
                          if (!canvasRef.current) return;
                          const { clientWidth: cw, clientHeight: ch } = canvasRef.current;
                          const newW = clamp(parseInt(ref.style.width, 10), 48, cw);
                          const newH = clamp(parseInt(ref.style.height, 10), 48, ch);
                          const clampedX = clamp(position.x, 0, cw - newW);
                          const clampedY = clamp(position.y, 0, ch - newH);
                          setParams(p => ({
                            ...p,
                            resizeWidth: newW,
                            resizeHeight: newH,
                            moveX: clampedX,
                            moveY: clampedY,
                          }));
                        }}
                        bounds="parent"
                        className="pointer-events-auto border border-transparent hover:border-cyan-500/40 focus-within:border-cyan-500 transition-colors group shadow-2xl"
                      >
                        <img src={currentImageSrc} alt="Workspace" className="w-full h-full object-fill pointer-events-none" />
                        
                        {/* Custom Resize Handles (visible on hover) */}
                        <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-cyan-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-cyan-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-cyan-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-cyan-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      </Rnd>
                    </div>
                  )}
                  
                  <button 
                    onClick={handleRemoveImage}
                    className="absolute top-4 right-4 z-50 bg-zinc-900/80 hover:bg-red-500/90 backdrop-blur-md p-2 rounded-md text-zinc-400 hover:text-white transition-all border border-zinc-800 shadow-lg"
                    title="Clear Workspace"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              ) : (
                <div className="text-center pointer-events-none">
                  <div className="w-20 h-20 rounded-2xl bg-zinc-900 flex items-center justify-center mx-auto mb-5 border border-zinc-800/50 shadow-2xl drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                    <FiImage size={32} className="text-zinc-500" />
                  </div>
                  <h3 className="text-base font-semibold text-zinc-200 mb-2">Drop an image here</h3>
                  <p className="text-xs text-zinc-500 max-w-[220px] mx-auto leading-relaxed">
                    Paste from clipboard, drag a file, or click to browse.
                  </p>
                </div>
              )}
            </div>

          </div>
          )} {/* end histogram ternary */}
        </main>

        {/* --- RIGHT SIDEBAR (PROPERTIES PANEL) --- */}
        <aside className="w-64 border-l border-zinc-800 bg-[#121214] shrink-0 flex flex-col z-20 shadow-2xl relative">
          <div className="h-12 border-b border-zinc-800/50 flex items-center px-4 shrink-0 bg-zinc-900/30">
            <h2 className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
              <FiSettings size={14} className="text-zinc-500" /> Properties
            </h2>
          </div>
          
          {activeTool ? (
            <PropertiesPanel 
              tool={activeTool} 
              params={params} 
              setParams={setParams}
              canvasRef={canvasRef}
              onApply={handleApply}
              loading={loading}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs italic">
              Select a tool to edit properties
            </div>
          )}
        </aside>

      </div>

      <style dangerouslySetInnerHTML={{__html: `
        /* Custom Scrollbar for sidebars */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3f3f46; 
        }

        /* Checkerboard Canvas Background */
        .checkerboard {
          background-color: #09090b;
          background-image: 
            linear-gradient(45deg, #121214 25%, transparent 25%), 
            linear-gradient(-45deg, #121214 25%, transparent 25%), 
            linear-gradient(45deg, transparent 75%, #121214 75%), 
            linear-gradient(-45deg, transparent 75%, #121214 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }

        /* Histogram panel slide-in animations */
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-left  { animation: slide-in-left  0.4s cubic-bezier(0.22,1,0.36,1) both; }
        .animate-slide-in-right { animation: slide-in-right 0.4s cubic-bezier(0.22,1,0.36,1) both; }

        /* Override ReactCrop styles to match dark theme */
        .react-crop__crop-selection {
          border: 1px solid #22d3ee !important;
          background-color: rgba(34, 211, 238, 0.05) !important;
        }
        .react-crop__drag-handle {
          background-color: #fff !important;
          border: 1px solid #22d3ee !important;
          width: 8px !important;
          height: 8px !important;
        }
      `}} />
    </div>
  );
}

export default App;
