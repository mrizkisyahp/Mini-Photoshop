import { FiClock, FiEye, FiLayers } from 'react-icons/fi';
import { clamp } from '../utils/canvasHelpers';

export default function PropertiesPanel({ tool, params, setParams, canvasRef, onApply, loading }) {
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
        <div className="flex flex-col gap-3 pb-4 border-b border-zinc-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-zinc-800 flex items-center justify-center text-cyan-400">
              {tool.icon && <tool.icon size={16} />}
            </div>
            <div>
              <h3 className="text-sm font-medium text-zinc-100">{tool.label}</h3>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">Active Tool</p>
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

        {tool.id !== 'move' && tool.id !== 'resize' && (
          <button
            onClick={onApply}
            disabled={loading}
            className="w-full mt-2 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-950 font-semibold text-xs py-2.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20"
          >
            {loading ? (
              <><div className="w-3 h-3 border-2 border-zinc-950/30 border-t-zinc-950 rounded-full animate-spin" /> Processingâ€¦</>
            ) : (
              'Apply Filter'
            )}
          </button>
        )}
      </div>

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
