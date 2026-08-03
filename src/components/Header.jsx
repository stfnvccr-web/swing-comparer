import React from 'react';
import { Target, Camera, Sparkles, Download, Layers, LayoutGrid, User } from 'lucide-react';

export default function Header({
  layoutMode,
  setLayoutMode,
  onOpenRecorder,
  onLoadDemos,
  isLoadingDemos,
  deferredPrompt,
  onInstallPwa,
}) {
  return (
    <header className="bg-zinc-900 border-b border-zinc-800 sticky top-0 z-40 px-3 py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center gap-1.5">
          <Target className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-bold text-white tracking-tight">Golf SwingAnalyzer</span>
        </div>

        {/* Layout Mode Selector */}
        <div className="flex items-center gap-0.5 bg-zinc-950 p-0.5 rounded-xl border border-zinc-800">
          {[
            { id: 'single', icon: User, label: '1 Video' },
            { id: 'side-by-side', icon: LayoutGrid, label: 'Doppio' },
            { id: 'overlay', icon: Layers, label: 'Overlay' },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setLayoutMode(id)}
              className={`px-2.5 py-1 text-xs font-bold rounded-lg transition flex items-center gap-1 ${
                layoutMode === id ? 'bg-emerald-500 text-zinc-950 shadow' : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={onLoadDemos}
            disabled={isLoadingDemos}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 inline mr-1 ${isLoadingDemos ? 'animate-spin' : ''}`} />
            Demo
          </button>

          <button
            onClick={onOpenRecorder}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600/30 text-rose-300 border border-rose-500/40"
          >
            <Camera className="w-3.5 h-3.5 inline mr-1" />
            REC
          </button>

          {deferredPrompt && (
            <button
              onClick={onInstallPwa}
              className="p-1.5 rounded-lg bg-emerald-600 text-white"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
