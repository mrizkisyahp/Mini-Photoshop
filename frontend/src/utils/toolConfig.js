import {
  FiImage, FiSliders, FiLayout, FiActivity, FiScissors, FiMove,
  FiSun, FiCrosshair, FiDroplet, FiBarChart2, FiRotateCw, FiColumns, FiMaximize, FiCrop,
  FiMoon, FiAperture, FiBarChart, FiTrendingUp, FiMinimize2, FiMaximize2, FiCpu,
  FiFilter, FiZap, FiGrid, FiTarget, FiPieChart, FiCode, FiBox, FiCircle, FiTriangle, FiWifi,
  FiLayers
} from 'react-icons/fi';

export const toolGroups = [
  {
    id: 'enhancement',
    name: 'Enhancement',
    icon: FiSliders,
    description: 'Improve overall image quality by adjusting luminance, sharpening fine features, or equalizing histograms for better contrast.',
    tools: [
      { id: 'brightness', label: 'Brightness / Contrast', icon: FiSun, description: 'Adjust overall image exposure and fine-tune the intensity difference between dark and light pixels.' },
      { id: 'sharpen', label: 'Sharpen', icon: FiCrosshair, description: 'Enhance high-frequency details and edge definitions to make the image appear crisper.' },
      { id: 'blur', label: 'Smoothing (Blur)', icon: FiDroplet, description: 'Soften the overall image appearance and reduce high-frequency details for an aesthetically smooth effect.' },
      { id: 'clahe', label: 'Histogram Eq', icon: FiBarChart2, description: 'Redistribute pixel intensities to uniformize contrast, particularly effective for low-contrast images.' },
    ],
  },
  {
    id: 'restoration',
    name: 'Restoration',
    icon: FiFilter,
    description: 'Restore degraded images by applying specialized noise reduction filters and spatial convolution techniques.',
    tools: [
      { id: 'restore_blur', label: 'Gaussian Blur (Denoise)', icon: FiDroplet, description: 'Apply spatial Gaussian convolution to suppress noise variance and clean up sensor grain.' },
      { id: 'median', label: 'Median Filter', icon: FiFilter, description: 'Non-linear filter that replaces pixel values with local neighborhood medians, excellent for preserving edges.' },
      { id: 'saltpepper', label: 'Salt & Pepper', icon: FiGrid, description: 'Simulate impulse noise (random white and black pixels) on the image to test restoration filters.' },
    ],
  },
  {
    id: 'geometric',
    name: 'Geometric',
    icon: FiLayout,
    description: 'Modify spatial coordinates and pixel grids using affine transformation matrices and interpolation techniques.',
    tools: [
      { id: 'move', label: 'Move', icon: FiMove, description: 'Translate the image horizontally or vertically across the workspace coordinates.' },
      { id: 'resize', label: 'Resize', icon: FiMaximize, description: 'Scale the image dimensions up or down using spatial interpolations like bilinear or nearest-neighbor.' },
      { id: 'rotate', label: 'Rotate', icon: FiRotateCw, description: 'Pivot the image by a custom angle (0Â° to 360Â°) around its center coordinates.' },
      { id: 'flip', label: 'Flip', icon: FiColumns, description: 'Mirror the image coordinate array horizontally, vertically, or along both axes.' },
      { id: 'crop', label: 'Crop Mode', icon: FiCrop, description: 'Define and extract a customized rectangular sub-region of interest (ROI) from the main coordinate grid.' },
    ],
  },
  {
    id: 'edge',
    name: 'Binary & Edge',
    icon: FiActivity,
    description: 'Detect structural boundaries, extract contours, and manipulate binary structures using localized kernel operations.',
    tools: [
      { id: 'threshold', label: 'Thresholding', icon: FiGrid, description: 'Segment the image into black and white pixels based on a chosen luminance cutoff level.' },
      { id: 'canny', label: 'Canny', icon: FiActivity, description: 'An optimal multi-stage edge detector that suppresses noise, calculates gradients, performs non-maximum suppression, and applies hysteresis thresholding.' },
      { id: 'sobel', label: 'Sobel', icon: FiTrendingUp, description: 'Calculate horizontal and vertical image gradients using Sobel kernels to locate strong, high-contrast edges.' },
      { id: 'prewitt', label: 'Prewitt', icon: FiZap, description: 'Compute edge gradients using the Prewitt operator to emphasize horizontal and vertical lines.' },
      { id: 'roberts', label: 'Roberts', icon: FiTriangle, description: 'Fast, simple 2D spatial gradient measurement to highlight diagonal edges.' },
      { id: 'laplacian', label: 'Laplacian', icon: FiCircle, description: 'Compute the second derivative of the image to detect rapid intensity transitions.' },
      { id: 'log', label: 'Laplacian of Gaussian', icon: FiWifi, description: 'Apply a Gaussian blur before Laplacian edge detection to minimize noise sensitivity.' },
      { id: 'erosion', label: 'Erosion', icon: FiMinimize2, description: 'Shrink foreground objects in a binary image by stripping away outer boundary pixels using structuring elements.' },
      { id: 'dilation', label: 'Dilation', icon: FiMaximize2, description: 'Expand foreground objects in a binary image by adding pixels to boundaries using structuring elements.' },
    ],
  },
  {
    id: 'color',
    name: 'Color',
    icon: FiImage,
    description: 'Transform color spaces, isolate specific color channels, and tweak basic hue/saturation levels.',
    tools: [
      { id: 'grayscale', label: 'Grayscale', icon: FiMoon, description: 'Convert multi-channel RGB colors to single-channel intensity values using weighted luminance values.' },
      { id: 'hsv', label: 'Hue / Saturation', icon: FiAperture, description: 'Adjust pure color shade (Hue) and color intensity/vibrancy (Saturation) in the HSV model.' },
      { id: 'channel_r', label: 'Red Channel', icon: FiImage, description: 'Isolate the 8-bit red component array of the original RGB spectrum.' },
      { id: 'channel_g', label: 'Green Channel', icon: FiImage, description: 'Isolate the 8-bit green component array of the original RGB spectrum.' },
      { id: 'channel_b', label: 'Blue Channel', icon: FiImage, description: 'Isolate the 8-bit blue component array of the original RGB spectrum.' },
    ],
  },
  {
    id: 'segmentation',
    name: 'Segmentation',
    icon: FiBox,
    description: 'Partition the image into distinct regions, contours, or masks to isolate important foreground elements.',
    tools: [
      { id: 'seg_threshold', label: 'Threshold-based', icon: FiGrid, description: 'Extract objects from backgrounds by grouping pixel values above or below a chosen limit.' },
      { id: 'seg_edge', label: 'Edge-based', icon: FiActivity, description: 'Delineate object boundaries by grouping detected edges into continuous contours.' },
      { id: 'seg_region', label: 'Region-based', icon: FiPieChart, description: 'Group neighboring pixels with similar intensity properties into homogeneous regions.' },
    ],
  },
  {
    id: 'histogram',
    name: 'Histogram',
    icon: FiBarChart,
    description: 'Visualize the numerical distribution of pixel intensities to evaluate contrast and color spread.',
    tools: [
      { id: 'histogram', label: 'Grayscale Histogram', icon: FiBarChart, description: 'Plot the distribution of grey level intensities from absolute black (0) to pure white (255).' },
      { id: 'histogram_rgb', label: 'RGB Histogram', icon: FiBarChart2, description: 'Generate overlapping frequency distributions for the Red, Green, and Blue color channels.' },
    ],
  },
  {
    id: 'compression',
    name: 'Compression Analysis',
    icon: FiScissors,
    description: 'Analyze real export sizes, apply quantization preprocessing, or simulate lossless encoding algorithms.',
    tools: [
      { id: 'jpeg', label: 'JPEG Quality', icon: FiImage, description: 'Simulate lossy JPEG compression using block-based discrete cosine transform (DCT) and quantization.', toolType: 'export' },
      { id: 'quantization', label: 'Quantization', icon: FiTarget, description: 'Reduce the total number of colors by mapping pixel intensities into a lower bit-depth.', toolType: 'preprocess' },
      { id: 'rle', label: 'RLE', icon: FiCpu, description: 'Apply Run-Length Encoding to compress contiguous sequences of identical pixel values losslessly.', toolType: 'simulation' },
      { id: 'huffman', label: 'Huffman', icon: FiCode, description: 'Use variable-length entropy coding to compress symbols based on their statistical frequency.', toolType: 'simulation' },
      { id: 'arithmetic', label: 'Arithmetic', icon: FiCode, description: 'Lossless compression that maps a stream of symbols to a single high-precision decimal range.', toolType: 'simulation' },
      { id: 'lzw', label: 'LZW', icon: FiCode, description: 'Compress images losslessly using dictionary-based string matching (Lempel-Ziv-Welch).', toolType: 'simulation' },
    ],
  },
  {
    id: 'cnn',
    name: 'CNN',
    icon: FiTarget,
    description: 'Leverage Convolutional Neural Networks to automatically locate, classify, and identify objects in the image.',
    tools: [
      { id: 'cnn_detect', label: 'Object Recognition', icon: FiTarget, description: 'Run a deep learning model to detect and classify complex visual classes (e.g., humans or animals).' },
    ],
  },
];

export const defaultParams = {
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
  // Enhancement / Blur
  sharpenAmount: 2.0,
  blurKsize: 11,
  blurSigma: 3.0,
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

// !!!!!!!!!!!!!!ENDPOINT!!!!!!!!!!!!!!
export const toolEndpointMap = {
  // Enhancement
  brightness: '/api/enhancement/brightness-contrast',
  sharpen: '/api/enhancement/sharpen',
  blur: '/api/enhancement/blur',
  clahe: '/api/enhancement/histogram-equalization',
  // Restoration
  restore_blur: '/api/restoration/gaussian-blur',
  median: '/api/restoration/median',
  saltpepper: '/api/restoration/denoise',
  // Geometric
  move: '/api/geometric/translate',
  resize: '/api/geometric/resize',
  rotate: '/api/geometric/rotate',
  flip: '/api/geometric/flip',
  crop: '/api/geometric/crop',
  // Color
  grayscale: '/api/color/grayscale',
  hsv: '/api/color/hsv',
  channel_r: '/api/color/channel?channel=r',
  channel_g: '/api/color/channel?channel=g',
  channel_b: '/api/color/channel?channel=b',
  // Binary & Edge
  threshold: '/api/edge/threshold',
  canny: '/api/edge/canny',
  sobel: '/api/edge/sobel',
  prewitt: '/api/edge/prewitt',
  roberts: '/api/edge/roberts',
  laplacian: '/api/edge/laplacian',
  log: '/api/edge/log',
  erosion: '/api/morphology/erosion',
  dilation: '/api/morphology/dilation',
  // Histogram
  histogram: '/api/histogram/grayscale',
  histogram_rgb: '/api/histogram/rgb',
  // Segmentation
  seg_threshold: '/api/segmentation/threshold',
  seg_edge: '/api/segmentation/edge',
  seg_region: '/api/segmentation/region',
  // Compression
  jpeg: '/api/compression/jpeg',
  rle: '/api/compression/rle',
  huffman: '/api/compression/huffman',
  arithmetic: '/api/compression/arithmetic',
  lzw: '/api/compression/lzw',
  quantization: '/api/compression/quantization',
  // CNN
  cnn_detect: '/api/cnn/detect',
};
