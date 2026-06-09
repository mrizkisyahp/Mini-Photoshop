import React from 'react';

export default function HistogramPanel({ data, isRGB, loading }) {
  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
        <span className="text-xs text-zinc-500">Analyzing image...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center text-zinc-600 text-xs text-center p-6">
        No histogram data available.<br/>Click "Generate Histogram" to analyze.
      </div>
    );
  }

  // Find max value for scaling Y axis
  let maxFreq = 0;
  const length = 256;
  if (isRGB) {
    if (data.red) maxFreq = Math.max(maxFreq, ...data.red);
    if (data.green) maxFreq = Math.max(maxFreq, ...data.green);
    if (data.blue) maxFreq = Math.max(maxFreq, ...data.blue);
  } else {
    if (data.gray) maxFreq = Math.max(maxFreq, ...data.gray);
  }

  const renderPath = (channelData, color) => {
    if (!channelData) return null;
    const pts = channelData.map((val, i) => {
      const x = (i / 255) * 100;
      const y = maxFreq > 0 ? 100 - (val / maxFreq) * 100 : 100;
      return `${x},${y}`;
    });
    return (
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        points={pts.join(' ')}
      />
    );
  };

  const renderFill = (channelData, color) => {
    if (!channelData) return null;
    const pts = channelData.map((val, i) => {
      const x = (i / 255) * 100;
      const y = maxFreq > 0 ? 100 - (val / maxFreq) * 100 : 100;
      return `${x},${y}`;
    });
    // Add bottom corners to close path
    pts.unshift(`0,100`);
    pts.push(`100,100`);
    return (
      <polygon
        fill={color}
        opacity="0.3"
        points={pts.join(' ')}
      />
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 rounded-lg p-4 border border-zinc-800">
      <h3 className="text-sm font-semibold text-zinc-200 mb-4">{isRGB ? 'RGB Histogram' : 'Grayscale Histogram'}</h3>
      <div className="flex-1 relative w-full border-b border-l border-zinc-700 pb-1 pl-1">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2,2" />
          
          <line x1="25" y1="0" x2="25" y2="100" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="50" y1="0" x2="50" y2="100" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2,2" />
          <line x1="75" y1="0" x2="75" y2="100" stroke="#3f3f46" strokeWidth="0.5" strokeDasharray="2,2" />

          {isRGB ? (
            <>
              {renderFill(data.red, '#ef4444')}
              {renderPath(data.red, '#ef4444')}
              {renderFill(data.green, '#22c55e')}
              {renderPath(data.green, '#22c55e')}
              {renderFill(data.blue, '#3b82f6')}
              {renderPath(data.blue, '#3b82f6')}
            </>
          ) : (
            <>
              {renderFill(data.gray, '#a1a1aa')}
              {renderPath(data.gray, '#a1a1aa')}
            </>
          )}
        </svg>
      </div>
      <div className="flex justify-between text-[10px] text-zinc-500 mt-1">
        <span>0</span>
        <span>255</span>
      </div>
    </div>
  );
}
