import React from 'react';
import { Upload, FlipHorizontal, Scissors, ZoomIn, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';

export default function VideoControlCard({
  title,
  fps,
  setFps,
  onStepFrame,
  onFileUpload,
  isMirrored,
  setIsMirrored,
  currentTime,
  duration,
  zoom,
  setZoom,
  pan,
  setPan,
  accentColor = 'emerald',
  onOpenWizard,
}) {
  const fpsOptions = [30, 60, 120, 240];

  const border = accentColor === 'emerald' ? 'border-emerald-500/30' : 'border-sky-500/30';
  const badge = accentColor === 'emerald'
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    : 'bg-sky-500/20 text-sky-400 border-sky-500/30';

  return (
    <div className={`bg-zinc-900/90 border ${border} rounded-2xl p-3 flex flex-col gap-2.5 shadow-md`}>
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${badge}`}>{title}</span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenWizard}
            className="px-2.5 py-1 text-xs font-bold rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 hover:bg-amber-500/30 transition"
          >
            ✨ Imposta Setup/Top/Impatto
          </button>
          <label className="cursor-pointer px-2.5 py-1 text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl border border-zinc-700 transition">
            <Upload className="w-3.5 h-3.5 inline mr-1" />
            Carica
            <input type="file" accept="video/*" onChange={onFileUpload} className="hidden" />
          </label>
        </div>
      </div>

      {/* Zoom Slider */}
      <div className="flex items-center gap-2 bg-zinc-950/60 px-2.5 py-1.5 rounded-xl border border-zinc-800">
        <ZoomIn className="w-3.5 h-3.5 text-sky-400 shrink-0" />
        <span className="text-[10px] text-zinc-400 font-bold shrink-0">Zoom:</span>
        <input
          type="range"
          min="1"
          max="3"
          step="0.1"
          value={zoom}
          onChange={(e) => setZoom(parseFloat(e.target.value))}
          className="w-full h-2 bg-zinc-800 rounded cursor-pointer accent-sky-400"
        />
        <span className="text-[10px] font-mono text-zinc-400 w-8 text-right font-bold">{(zoom * 100).toFixed(0)}%</span>
        {zoom > 1 && (
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} className="text-zinc-500 hover:text-white">
            <RotateCcw className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Bottom Controls: FPS + Mirror + Frame Step */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-0.5 bg-zinc-950 p-0.5 rounded-lg border border-zinc-800">
          <span className="text-[10px] text-zinc-500 font-bold px-1">FPS:</span>
          {fpsOptions.map((val) => (
            <button
              key={val}
              onClick={() => setFps(val)}
              className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition ${
                fps === val ? 'bg-emerald-500 text-zinc-950 shadow' : 'text-zinc-500'
              }`}
            >
              {val}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMirrored(!isMirrored)}
            className={`p-1.5 rounded-lg transition ${isMirrored ? 'bg-indigo-600/40 text-indigo-300' : 'text-zinc-500'}`}
            title="Specchia Orizzontalmente"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>
          <button onClick={() => onStepFrame(-1)} className="px-2.5 py-1 text-xs font-bold bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-700">
            <ChevronLeft className="w-3.5 h-3.5 inline" />-1
          </button>
          <button onClick={() => onStepFrame(1)} className="px-2.5 py-1 text-xs font-bold bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-700">
            +1<ChevronRight className="w-3.5 h-3.5 inline" />
          </button>
        </div>
      </div>
    </div>
  );
}
