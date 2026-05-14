import React from 'react';

export function ImagePanel({ title, src }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-4 shadow-lg shadow-slate-950/10">
      <div className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</div>
      <div className="min-h-[320px] overflow-hidden rounded-3xl bg-slate-950/90 p-3">
        {src ? (
          <img className="mx-auto max-h-[320px] object-contain" src={src} alt={title} />
        ) : (
          <div className="flex h-[320px] items-center justify-center text-center text-slate-500">Upload foto untuk melihat hasil sebelum / sesudah.</div>
        )}
      </div>
    </div>
  );
}
