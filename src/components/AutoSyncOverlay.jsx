import React, { useState, useRef, useEffect } from 'react';
import { Target, Wand2, Play, Pause, RotateCcw, Check, Sparkles } from 'lucide-react';

export default function AutoSyncOverlay({
  isOpen,
  onClose,
  videoSrcA,
  videoSrcB,
  syncA,
  syncB,
  keypointsA,
  keypointsB,
  onSaveSync,
}) {
  const videoRefA = useRef(null);
  const videoRefB = useRef(null);

  const [activeTab, setActiveTab] = useState('A'); // 'A' | 'B'
  const [timeA, setTimeA] = useState(syncA || 0);
  const [timeB, setTimeB] = useState(syncB || 0);

  const [durA, setDurA] = useState(1);
  const [durB, setDurB] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeA(syncA || 0);
      setTimeB(syncB || 0);
    }
  }, [isOpen, syncA, syncB]);

  if (!isOpen) return null;

  const currentRef = activeTab === 'A' ? videoRefA : videoRefB;
  const currentTime = activeTab === 'A' ? timeA : timeB;
  const currentDur = activeTab === 'A' ? durA : durB;

  const handleSeek = (t) => {
    if (activeTab === 'A') {
      setTimeA(t);
      if (videoRefA.current) videoRefA.current.currentTime = t;
    } else {
      setTimeB(t);
      if (videoRefB.current) videoRefB.current.currentTime = t;
    }
  };

  const handleStep = (dir) => {
    const step = dir * (1 / 60);
    handleSeek(Math.max(0, Math.min(currentDur, currentTime + step)));
  };

  const togglePlay = () => {
    if (currentRef.current) {
      if (isPlaying) {
        currentRef.current.pause();
        setIsPlaying(false);
      } else {
        currentRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleSave = () => {
    onSaveSync(timeA, timeB);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-3 sm:p-5 overflow-y-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Sincronizzazione Rapida Impatto</h2>
        </div>
        <button onClick={onClose} className="px-2.5 py-1 text-xs font-bold bg-zinc-800 text-zinc-400 rounded-lg">
          Chiudi
        </button>
      </div>

      {/* Main Dual Player Preview */}
      <div className="grid grid-cols-2 gap-2 my-2 aspect-[4/3] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 p-1">
        {/* Slot A */}
        <div
          onClick={() => {
            setActiveTab('A');
            setIsPlaying(false);
          }}
          className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition ${
            activeTab === 'A' ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-transparent opacity-80'
          }`}
        >
          <video
            ref={videoRefA}
            src={videoSrcA}
            onTimeUpdate={() => videoRefA.current && setTimeA(videoRefA.current.currentTime)}
            onLoadedMetadata={(e) => setDurA(e.target.duration)}
            playsInline
            muted
            className="w-full h-full object-contain bg-black"
          />
          <div className="absolute top-2 left-2 bg-emerald-500 text-zinc-950 px-2 py-0.5 rounded text-[10px] font-extrabold">
            UTENTE (A)
          </div>
          <div className="absolute bottom-2 left-2 bg-black/80 text-emerald-400 px-2 py-0.5 rounded text-xs font-mono font-bold">
            ⚡ {timeA.toFixed(2)}s
          </div>
        </div>

        {/* Slot B */}
        <div
          onClick={() => {
            setActiveTab('B');
            setIsPlaying(false);
          }}
          className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition ${
            activeTab === 'B' ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-transparent opacity-80'
          }`}
        >
          <video
            ref={videoRefB}
            src={videoSrcB}
            onTimeUpdate={() => videoRefB.current && setTimeB(videoRefB.current.currentTime)}
            onLoadedMetadata={(e) => setDurB(e.target.duration)}
            playsInline
            muted
            className="w-full h-full object-contain bg-black"
          />
          <div className="absolute top-2 left-2 bg-sky-500 text-zinc-950 px-2 py-0.5 rounded text-[10px] font-extrabold">
            PRO (B)
          </div>
          <div className="absolute bottom-2 left-2 bg-black/80 text-sky-400 px-2 py-0.5 rounded text-xs font-mono font-bold">
            ⚡ {timeB.toFixed(2)}s
          </div>
        </div>
      </div>

      {/* Interactive Controls for Active Slot */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-3 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold ${activeTab === 'A' ? 'text-emerald-400' : 'text-sky-400'}`}>
            Selezionato: Video {activeTab} ({activeTab === 'A' ? 'Utente' : 'Pro'})
          </span>
          <span className="text-xs text-zinc-400 font-mono">Trascina per trovare l'Impatto</span>
        </div>

        {/* Big Slider for active video */}
        <input
          type="range"
          min="0"
          max={currentDur}
          step="0.01"
          value={currentTime}
          onChange={(e) => handleSeek(parseFloat(e.target.value))}
          className="w-full h-4 bg-zinc-950 rounded cursor-pointer accent-emerald-400"
        />

        {/* Precise Frame Adjust Buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => handleStep(-5)}
              className="px-2.5 py-1.5 text-xs font-bold bg-zinc-800 text-zinc-300 rounded-xl"
            >
              -5 Fr
            </button>
            <button
              onClick={() => handleStep(-1)}
              className="px-3 py-1.5 text-xs font-bold bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-700"
            >
              -1 Fr
            </button>
            <button
              onClick={() => handleStep(1)}
              className="px-3 py-1.5 text-xs font-bold bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-700"
            >
              +1 Fr
            </button>
            <button
              onClick={() => handleStep(5)}
              className="px-2.5 py-1.5 text-xs font-bold bg-zinc-800 text-zinc-300 rounded-xl"
            >
              +5 Fr
            </button>
          </div>

          <button
            onClick={togglePlay}
            className="px-4 py-1.5 text-xs font-bold bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-700"
          >
            {isPlaying ? 'Pausa' : 'Play Test'}
          </button>
        </div>

        <button
          onClick={handleSave}
          className="w-full py-3 rounded-xl bg-emerald-500 text-zinc-950 font-extrabold text-xs shadow-lg hover:bg-emerald-400 transition flex items-center justify-center gap-1.5 mt-1"
        >
          <Check className="w-4 h-4" />
          <span>CONFERMA IMPATTO E SINCRONIZZA SUBITO</span>
        </button>
      </div>
    </div>
  );
}
