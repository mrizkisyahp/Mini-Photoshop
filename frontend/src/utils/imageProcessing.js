// Maps frontend slider params to what each backend endpoint expects
export function buildBackendParams(toolId, params) {
  switch (toolId) {
    case 'brightness':
      return {
        brightness: params.brightness,
        // Backend uses multiplier (1.0 = no change); slider is -100..100 (0 = no change)
        contrast: Number(((params.contrast + 100) / 100).toFixed(3)),
      };
    case 'sharpen':
      return { amount: params.sharpenAmount };
    case 'blur':
      return { ksize: params.blurKsize, sigma: params.blurSigma };
    case 'restore_blur':
      return { kernel_size: params.blurKsize, sigma: params.blurSigma };
    case 'median':
      return { kernel_size: params.medianKsize };
    case 'saltpepper':
      return { noise_amount: params.noiseAmount };
    case 'rotate':
      return { angle: params.rotate };
    case 'flip':
      return { mode: params.flipMode };
    case 'move':
      return { tx: params.moveX, ty: params.moveY };
    case 'resize':
      return { width: params.resizeWidth, height: params.resizeHeight };
    case 'crop':
      return { x: params.cropX, y: params.cropY, width: params.cropWidth, height: params.cropHeight };
    default:
      return params;
  }
}
