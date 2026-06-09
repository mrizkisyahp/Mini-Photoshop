import {
  FiActivity,
  FiCornerUpLeft,
  FiCornerUpRight,
  FiMinus,
  FiPlus,
} from 'react-icons/fi';

export default function Header({
  originalFile,
  originalPreview,
  processedPreview,
  loading,
  showCompare,
  setShowCompare,
  showExportMenu,
  setShowExportMenu,
  onReset,
  onExport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  zoom,
  onZoomOut,
  onZoomIn,
  canZoomOut,
  canZoomIn,
  autoIdentifyEnabled,
  setAutoIdentifyEnabled,
}) {
  const iconButtonClass = "p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:text-zinc-400 disabled:hover:bg-transparent";

  return (
    <header className="h-12 border-b border-zinc-800 bg-zinc-900 flex items-center justify-between px-4 shrink-0 z-30 relative shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded bg-gradient-to-br from-cyan-400 to-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-cyan-500/20">M</div>
        <span className="font-semibold tracking-tight text-xs text-zinc-200">Mini Photoshop</span>
      </div>

      <div className="flex items-center gap-1 bg-zinc-950/50 p-1 rounded-md border border-zinc-800/80">
        <button onClick={onUndo} disabled={!canUndo} className={iconButtonClass} title="Undo"><FiCornerUpLeft size={14} /></button>
        <button onClick={onRedo} disabled={!canRedo} className={iconButtonClass} title="Redo"><FiCornerUpRight size={14} /></button>
        <div className="w-px h-3 bg-zinc-700 mx-1"></div>
        <button onClick={onZoomOut} disabled={!canZoomOut} className={iconButtonClass} title="Zoom Out"><FiMinus size={14} /></button>
        <span className="text-[10px] text-zinc-300 font-medium px-2 w-12 text-center">{zoom}%</span>
        <button onClick={onZoomIn} disabled={!canZoomIn} className={iconButtonClass} title="Zoom In"><FiPlus size={14} /></button>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => setAutoIdentifyEnabled(v => !v)}
          className={`px-3 py-1.5 rounded text-[10px] font-semibold transition-all border uppercase tracking-wider ${
            autoIdentifyEnabled
              ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40'
              : 'bg-zinc-800/50 text-zinc-500 border-zinc-700 hover:text-zinc-300'
          }`}
          title="Toggle Auto-Identify AI on image drop"
        >
          {autoIdentifyEnabled ? 'AI Detect: ON' : 'AI Detect: OFF'}
        </button>
        {originalFile && (
          <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono hidden md:flex">
            {loading && <FiActivity className="animate-spin text-cyan-500" />}
            <span>{loading ? 'Processing...' : 'Ready'}</span>
          </div>
        )}

        {processedPreview && (
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

        {processedPreview && (
          <button
            onClick={onReset}
            className="text-zinc-400 hover:text-red-400 border border-zinc-700 hover:border-red-500/50 px-3 py-1.5 rounded text-xs font-medium transition-colors"
            title="Reset to original image"
          >
            Reset
          </button>
        )}

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(v => !v)}
            disabled={!originalPreview}
            className="bg-zinc-100 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-zinc-900 px-3 py-1.5 rounded text-xs font-semibold transition-colors shadow-sm flex items-center gap-1.5"
          >
            Export As
            <span className="text-zinc-500 text-[10px]">{showExportMenu ? 'â–²' : 'â–¼'}</span>
          </button>

          {showExportMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
              <div className="absolute right-0 top-full mt-2 z-50 bg-zinc-900 border border-zinc-700 rounded-lg shadow-2xl overflow-hidden min-w-[140px]">
                {[
                  { label: 'PNG', sub: 'Lossless', format: 'png' },
                  { label: 'JPG / JPEG', sub: 'Compressed', format: 'jpeg' },
                  { label: 'BMP', sub: 'Uncompressed', format: 'bmp' },
                ].map(({ label, sub, format }) => (
                  <button
                    key={format}
                    onClick={() => onExport(format)}
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
  );
}
