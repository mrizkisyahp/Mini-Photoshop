import React from 'react';

export function Toolbar({ toolGroups, selectedTool, onSelect }) {
  return (
    <div className="space-y-4">
      {toolGroups.map((group) => (
        <div key={group.name} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl shadow-slate-950/20">
          <div className="mb-3 text-sm uppercase tracking-[0.2em] text-slate-400">{group.name}</div>
          <div className="grid gap-2 sm:grid-cols-2">
            {group.tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelect(tool.id)}
                className={`rounded-2xl px-4 py-3 text-left transition ${selectedTool === tool.id ? 'border border-cyan-400 bg-cyan-500/10 text-cyan-100' : 'border border-slate-800 bg-slate-950 text-slate-200 hover:border-slate-600 hover:bg-slate-900'}`}
              >
                <div className="font-semibold">{tool.label}</div>
                <div className="mt-1 text-xs text-slate-500">{tool.subtitle}</div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
