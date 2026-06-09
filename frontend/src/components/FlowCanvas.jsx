import React from 'react';
import { FiArrowRight, FiImage, FiSettings, FiTrash2 } from 'react-icons/fi';

export default function FlowCanvas({ pipeline, selectedNodeId, onSelectNode, onRemoveNode, height, onReorder }) {
  const [draggedIndex, setDraggedIndex] = React.useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // Firefox requires setting data
    e.dataTransfer.setData('text/plain', index);
    
    // Optional: Make drag image look better (transparent)
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) return;
    onReorder(draggedIndex, targetIndex);
  };

  return (
    <div 
      className="overflow-x-auto overflow-y-auto custom-scrollbar bg-zinc-950/50 p-4 shrink-0"
      style={{ height: `${height}px` }}
    >
      <div className="flex items-center gap-4 min-w-max h-full pb-2">
        {/* Origin Node */}
        <div 
          onClick={() => onSelectNode('origin')}
          className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all w-32 shrink-0 h-full max-h-32
            ${selectedNodeId === 'origin' ? 'border-cyan-500 bg-cyan-500/10' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'}
          `}
        >
          <FiImage size={24} className={selectedNodeId === 'origin' ? 'text-cyan-400' : 'text-zinc-500'} />
          <span className="text-xs font-semibold mt-2 text-zinc-300 text-center">Original Image</span>
        </div>

        {pipeline.map((node, index) => (
          <React.Fragment key={node.id}>
            <FiArrowRight className="text-zinc-600 shrink-0" size={16} />
            <div 
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => onSelectNode(node.id)}
              className={`relative flex flex-col items-center justify-center p-3 rounded-lg border-2 cursor-pointer transition-all w-36 shrink-0 group h-full max-h-32
                ${selectedNodeId === node.id ? 'border-cyan-500 bg-cyan-500/10' : 'border-zinc-700 bg-zinc-900 hover:border-zinc-500'}
                ${draggedIndex === index ? 'opacity-50' : ''}
              `}
            >
              {/* Delete button (only show on hover, and maybe only for the last node or allow any to be deleted) */}
              <button 
                onClick={(e) => { e.stopPropagation(); onRemoveNode(node.id); }}
                className="absolute -top-2 -right-2 w-6 h-6 bg-zinc-800 rounded-full flex items-center justify-center border border-zinc-700 text-zinc-400 hover:text-red-400 hover:border-red-500/50 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-md"
              >
                <FiTrash2 size={12} />
              </button>
              
              <FiSettings size={20} className={selectedNodeId === node.id ? 'text-cyan-400' : 'text-zinc-500'} />
              <span className="text-xs font-semibold mt-2 text-zinc-300 text-center leading-tight truncate w-full px-1">{node.label}</span>
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">Step {index + 1}</span>
            </div>
          </React.Fragment>
        ))}

        {pipeline.length > 0 && (
          <>
            <FiArrowRight className="text-zinc-600 shrink-0" size={16} />
            <div className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed border-cyan-500/30 bg-cyan-500/5 w-32 h-24 shrink-0 opacity-80">
              <span className="text-xs font-semibold text-cyan-400/80 text-center">Final Output</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
