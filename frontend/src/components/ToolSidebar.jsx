export default function ToolSidebar({ activeCategory, selectedTool, onSelectTool, width }) {
  return (
    <aside className="border-r border-zinc-800 bg-[#121214] shrink-0 flex flex-col z-10 relative" style={{ width }}>
      <div className="px-4 py-3 border-b border-zinc-800/50 space-y-1 bg-zinc-950/20">
        <h2 className="text-xs font-semibold text-zinc-300">{activeCategory?.name}</h2>
        {activeCategory?.description && (
          <p className="text-[10px] text-zinc-500 leading-relaxed font-normal">
            {activeCategory.description}
          </p>
        )}
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar">
        {activeCategory?.tools.map((tool) => {
          const ToolIcon = tool.icon;
          const isActive = selectedTool === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => onSelectTool(tool.id)}
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
  );
}
