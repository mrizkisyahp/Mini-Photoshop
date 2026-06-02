import { FiBarChart2, FiImage, FiTrash2 } from 'react-icons/fi';
import ReactCrop from 'react-image-crop';
import { Rnd } from 'react-rnd';
import { clamp } from '../utils/canvasHelpers';

export default function CanvasArea({
  isHistogramMode,
  originalFile,
  histogramLoading,
  originalHistogramUrl,
  processedHistogramUrl,
  showCompare,
  processedPreview,
  originalPreview,
  loading,
  getRootProps,
  getInputProps,
  isDragActive,
  canvasRef,
  isCropMode,
  cropState,
  setParams,
  currentImageSrc,
  params,
  onRemoveImage,
  zoom,
}) {
  const zoomScale = zoom / 100;
  const scaledResizeWidth = params.resizeWidth * zoomScale;
  const scaledResizeHeight = params.resizeHeight * zoomScale;
  const scaledMoveX = params.moveX * zoomScale;
  const scaledMoveY = params.moveY * zoomScale;

  return (
    <main className="flex-1 relative flex flex-col min-w-0 bg-[#09090b] checkerboard">
      {isHistogramMode && originalFile ? (
        <div className="flex-1 flex gap-0 p-6 overflow-hidden">
          <div className="flex-1 flex flex-col gap-3 animate-slide-in-left overflow-hidden">
            <div className="flex items-center gap-2 px-1">
              <div className="w-2 h-2 bg-zinc-400 rounded-full"></div>
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Before</span>
            </div>
            <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden shadow-xl">
              {histogramLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                  <span className="text-xs text-zinc-500">Generating histogramâ€¦</span>
                </div>
              ) : originalHistogramUrl ? (
                <img src={originalHistogramUrl} alt="Before Histogram" className="max-w-full max-h-full object-contain p-4 transition-transform" style={{ transform: `scale(${zoomScale})` }} />
              ) : (
                <span className="text-xs text-zinc-600">No histogram available</span>
              )}
            </div>
          </div>

          <div className="w-px mx-6 bg-zinc-800 self-stretch my-2 shrink-0"></div>

          <div className="flex-1 flex flex-col gap-3 animate-slide-in-right overflow-hidden">
            <div className="flex items-center gap-2 px-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">After</span>
            </div>
            <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden shadow-xl">
              {histogramLoading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
                  <span className="text-xs text-zinc-500">Generating histogramâ€¦</span>
                </div>
              ) : processedHistogramUrl ? (
                <img src={processedHistogramUrl} alt="After Histogram" className="max-w-full max-h-full object-contain p-4 transition-transform" style={{ transform: `scale(${zoomScale})` }} />
              ) : (
                <div className="flex flex-col items-center gap-3 text-center px-10">
                  <FiBarChart2 size={28} className="text-zinc-700" />
                  <span className="text-xs text-zinc-600 leading-relaxed">Apply any filter first â€” the processed histogram will appear here automatically.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : showCompare && processedPreview ? (
        <div className="flex-1 flex gap-0 p-6 overflow-hidden">
          <div className="flex-1 flex flex-col gap-3 animate-slide-in-left overflow-hidden">
            <div className="flex items-center gap-2 px-1">
              <div className="w-2 h-2 bg-zinc-400 rounded-full"></div>
              <span className="text-xs font-semibold text-zinc-300 uppercase tracking-widest">Before</span>
            </div>
            <div className="flex-1 bg-zinc-900/60 rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden shadow-xl">
              <img src={originalPreview} alt="Before" className="max-w-full max-h-full object-contain p-4 drop-shadow-xl transition-transform" style={{ transform: `scale(${zoomScale})` }} />
            </div>
          </div>

          <div className="w-px mx-6 bg-zinc-800 self-stretch my-2 shrink-0"></div>

          <div className="flex-1 flex flex-col gap-3 animate-slide-in-right overflow-hidden">
            <div className="flex items-center gap-2 px-1">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">After</span>
            </div>
            <div className="flex-1 bg-zinc-900/60 rounded-2xl border border-zinc-800 flex items-center justify-center overflow-hidden shadow-xl">
              <img src={processedPreview} alt="After" className="max-w-full max-h-full object-contain p-4 drop-shadow-xl transition-transform" style={{ transform: `scale(${zoomScale})` }} />
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
                    style={{ transform: `scale(${zoomScale})`, transformOrigin: 'center center' }}
                  >
                    <img src={currentImageSrc} alt="Canvas" className="max-h-full max-w-full object-contain pointer-events-none" />
                  </ReactCrop>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Rnd
                      size={{ width: scaledResizeWidth, height: scaledResizeHeight }}
                      position={{ x: scaledMoveX, y: scaledMoveY }}
                      onDragStop={(e, d) => {
                        if (!canvasRef.current) return;
                        const { clientWidth: cw, clientHeight: ch } = canvasRef.current;
                        const margin = 48; // px â€” minimum edge that must stay visible
                        const clampedX = clamp(d.x, -(scaledResizeWidth - margin), cw - margin);
                        const clampedY = clamp(d.y, -(scaledResizeHeight - margin), ch - margin);
                        setParams(p => ({ ...p, moveX: clampedX / zoomScale, moveY: clampedY / zoomScale }));
                      }}
                      onResizeStop={(e, direction, ref, delta, position) => {
                        if (!canvasRef.current) return;
                        const { clientWidth: cw, clientHeight: ch } = canvasRef.current;
                        const newW = clamp(parseInt(ref.style.width, 10), 48, cw) / zoomScale;
                        const newH = clamp(parseInt(ref.style.height, 10), 48, ch) / zoomScale;
                        const clampedX = clamp(position.x, 0, cw - (newW * zoomScale));
                        const clampedY = clamp(position.y, 0, ch - (newH * zoomScale));
                        setParams(p => ({
                          ...p,
                          resizeWidth: newW,
                          resizeHeight: newH,
                          moveX: clampedX / zoomScale,
                          moveY: clampedY / zoomScale,
                        }));
                      }}
                      bounds="parent"
                      className="pointer-events-auto border border-transparent hover:border-cyan-500/40 focus-within:border-cyan-500 transition-colors group shadow-2xl"
                    >
                      <img src={currentImageSrc} alt="Workspace" className="w-full h-full object-fill pointer-events-none" />

                      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-cyan-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-cyan-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-cyan-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-cyan-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    </Rnd>
                  </div>
                )}

                <button
                  onClick={onRemoveImage}
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
      )}
    </main>
  );
}
