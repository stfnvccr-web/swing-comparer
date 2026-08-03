import React from 'react';
import { Target, Zap, RotateCcw, ArrowLeft, ArrowRight, Play, Pause, ChevronLeft, ChevronRight } from 'lucide-react';

export default function TimelineHeroScrubber({
  currentDeltaT,
  onSeekRelative,
  keypointsA,
  keypointsB,
  syncA,
  syncB,
  onJumpToKeypoint,
  isPlaying,
  onTogglePlay,
  onStepFrame,
  playbackRate,
  setPlaybackRate,
}) {
  // Calculate relative offsets for keypoints if set
  const relAddressA = keypointsA?.address && syncA ? keypointsA.address - syncA : -1.2;
  const relTopA = keypointsA?.top && syncA ? keypointsA.top - syncA : -0.4;

  const speeds = [1, 0.5, 0.25, 0.1];

  return (
    <div className="bg-zinc-900 border border-zinc-700/80 rounded-3xl p-3 sm:p-4 flex flex-col gap-3 shadow-2xl z-30">
      {/* Top Header Label & Snap Quick Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-xs font-bold text-white tracking-wide">SLIDER DI CONFRONTO SWING</span>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            {currentDeltaT >= 0 ? `+${currentDeltaT.toFixed(2)}s` : `${currentDeltaT.toFixed(2)}s`}
          </span>
        </div>

        {/* Snap Buttons to Key Swing Phases */}
        <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
          <button
            onClick={() => onJumpToKeypoint('address')}
            className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-amber-300 border border-amber-500/30 transition active:scale-95 flex items-center gap-1"
            title="Vai alla posizione di Indirizzo (Setup)"
          >
            <span>🏌️ Indirizzo</span>
          </button>

          <button
            onClick={() => onJumpToKeypoint('top')}
            className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sky-300 border border-sky-500/30 transition active:scale-95 flex items-center gap-1"
            title="Vai al Top del Backswing"
          >
            <span>🔝 Top Swing</span>
          </button>

          <button
            onClick={() => onJumpToKeypoint('impact')}
            className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 transition active:scale-95 flex items-center gap-1"
            title="Vai all'Impatto con la Palla (0.00s)"
          >
            <Zap className="w-3 h-3 text-emerald-400 fill-current" />
            <span>⚡ Impatto</span>
          </button>
        </div>
      </div>

      {/* Main HERO Timeline Slider */}
      <div className="relative flex flex-col gap-1 py-1">
        {/* Visual Tick Markers for Swing Phases */}
        <div className="relative w-full h-4 text-[10px] font-mono text-zinc-400">
          <span className="absolute left-0 transform -translate-x-1/2">Backswing</span>
          <span className="absolute left-1/2 transform -translate-x-1/2 font-bold text-emerald-400 flex items-center gap-0.5">
            <Zap className="w-3 h-3 text-emerald-400" />
            0.0s (IMPATTO)
          </span>
          <span className="absolute right-0 transform translate-x-1/2">Follow-through</span>
        </div>

        {/* Big Touch-Friendly Slider Track */}
        <input
          type="range"
          min="-2.0"
          max="2.0"
          step="0.01"
          value={Math.max(-2.0, Math.min(2.0, currentDeltaT))}
          onChange={onSeekRelative}
          className="w-full h-4 bg-zinc-950 rounded-lg cursor-pointer accent-emerald-400 border border-zinc-800 shadow-inner"
        />

        {/* Legend */}
        <div className="flex justify-between text-[10px] font-mono text-zinc-500 px-1">
          <span>-2.00s</span>
          <span>-1.00s</span>
          <span className="text-emerald-400 font-bold">0.00s</span>
          <span>+1.00s</span>
          <span>+2.00s</span>
        </div>
      </div>

      {/* Primary Control Bar */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800/80">
        {/* Frame Step Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onStepFrame(-1)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 active:scale-95"
            title="-1 Frame"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>-1 Fr</span>
          </button>
          <button
            onClick={() => onStepFrame(1)}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 active:scale-95"
            title="+1 Frame"
          >
            <span>+1 Fr</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center Main Play/Pause Button */}
        <button
          onClick={onTogglePlay}
          className="flex items-center gap-2 px-7 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition transform active:scale-95"
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isPlaying ? 'PAUSA' : 'PLAY SYNC'}</span>
        </button>

        {/* Speed Selector */}
        <div className="flex items-center gap-0.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => setPlaybackRate(s)}
              className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${
                playbackRate === s ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
