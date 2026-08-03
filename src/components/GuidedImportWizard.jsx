import React, { useState, useRef, useEffect } from 'react';
import { Wand2, Check, ChevronRight, Play, Pause, RotateCcw } from 'lucide-react';

export default function GuidedImportWizard({
  isOpen,
  onClose,
  videoSrc,
  slot,
  slotName,
  onCompleteWizard,
}) {
  const videoRef = useRef(null);

  const [step, setStep] = useState(1); // 1: Setup, 2: Top, 3: Impatto
  const [addressTime, setAddressTime] = useState(null);
  const [topTime, setTopTime] = useState(null);
  const [impactTime, setImpactTime] = useState(null);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setAddressTime(null);
      setTopTime(null);
      setImpactTime(null);
      setCurrentTime(0);
    }
  }, [isOpen, videoSrc]);

  if (!isOpen || !videoSrc) return null;

  const dur = duration || 1;

  const seekTo = (t) => {
    if (videoRef.current) {
      videoRef.current.currentTime = t;
      setCurrentTime(t);
    }
  };

  const handleSetCurrentStepKeypoint = () => {
    if (step === 1) {
      setAddressTime(currentTime);
      setStep(2);
    } else if (step === 2) {
      setTopTime(currentTime);
      setStep(3);
    } else if (step === 3) {
      setImpactTime(currentTime);
      // Finish
      onCompleteWizard(slot, {
        keypoints: {
          address: addressTime,
          top: topTime,
          impact: currentTime,
        },
      });
      onClose();
    }
  };

  const stepInfo = {
    1: { label: '1. SETUP (INDIRIZZO)', desc: 'Porta lo slider sul primo fotogramma del movimento all\'indietro e premi Segna Setup', color: 'emerald' },
    2: { label: '2. TOP SWING', desc: 'Porta lo slider sul punto più alto del backswing prima della discesa e premi Segna Top', color: 'amber' },
    3: { label: '3. IMPATTO PALLA', desc: 'Porta lo slider sul fotogramma esatto del contatto con la pallina e premi Completa', color: 'rose' },
  };

  const currentInfo = stepInfo[step];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4 sm:p-6 overflow-y-auto animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Wand2 className="w-5 h-5 text-emerald-400" />
          <h2 className="text-sm font-bold text-white">Configurazione Swing {slotName}</h2>
        </div>
        <button onClick={onClose} className="px-2.5 py-1 text-xs font-bold bg-zinc-800 text-zinc-400 rounded-lg">
          Salta
        </button>
      </div>

      {/* 3 Step Progress Bar */}
      <div className="grid grid-cols-3 gap-1.5 my-3">
        {[
          { id: 1, name: '1. Setup', val: addressTime },
          { id: 2, name: '2. Top', val: topTime },
          { id: 3, name: '3. Impatto', val: impactTime },
        ].map((s) => (
          <div
            key={s.id}
            onClick={() => setStep(s.id)}
            className={`py-2 text-center text-xs font-bold rounded-xl cursor-pointer transition border ${
              step === s.id
                ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-lg'
                : s.val !== null
                ? 'bg-zinc-800 text-emerald-400 border-emerald-500/30'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800'
            }`}
          >
            {s.name} {s.val !== null && `(${s.val.toFixed(2)}s)`}
          </div>
        ))}
      </div>

      {/* Video Screen */}
      <div className="relative aspect-[3/4] sm:aspect-[4/3] max-h-[50vh] bg-zinc-950 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">
        <video
          ref={videoRef}
          src={videoSrc}
          onTimeUpdate={() => videoRef.current && setCurrentTime(videoRef.current.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.target.duration)}
          playsInline
          muted
          className="w-full h-full object-contain"
        />
        <div className="absolute top-2 left-2 bg-black/80 text-emerald-400 px-2.5 py-1 rounded-lg text-xs font-mono font-bold">
          {currentTime.toFixed(2)}s / {dur.toFixed(1)}s
        </div>
      </div>

      {/* Control Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col gap-3 mt-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-bold text-emerald-400">{currentInfo.label}</span>
          <p className="text-xs text-zinc-300">{currentInfo.desc}</p>
        </div>

        {/* Master Position Slider */}
        <input
          type="range"
          min="0"
          max={dur}
          step="0.01"
          value={currentTime}
          onChange={(e) => seekTo(parseFloat(e.target.value))}
          className="w-full h-4 bg-zinc-950 rounded cursor-pointer accent-emerald-400 border border-zinc-800"
        />

        {/* Micro adjustment buttons */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            <button
              onClick={() => seekTo(Math.max(0, currentTime - 1 / 60))}
              className="px-3 py-2 text-xs font-bold bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-700 active:scale-95"
            >
              -1 Frame
            </button>
            <button
              onClick={() => seekTo(Math.min(dur, currentTime + 1 / 60))}
              className="px-3 py-2 text-xs font-bold bg-zinc-800 text-zinc-200 rounded-xl border border-zinc-700 active:scale-95"
            >
              +1 Frame
            </button>
          </div>

          <span className="text-xs font-mono font-bold text-amber-400">
            Imposta a {currentTime.toFixed(2)}s
          </span>
        </div>

        <button
          onClick={handleSetCurrentStepKeypoint}
          className="w-full py-3 rounded-xl bg-emerald-500 text-zinc-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg hover:bg-emerald-400 transition"
        >
          <Check className="w-4 h-4" />
          <span>
            {step === 1 && 'CONFERMA SETUP (VAI AL TOP)'}
            {step === 2 && 'CONFERMA TOP (VAI ALL\'IMPATTO)'}
            {step === 3 && 'CONFERMA IMPATTO E CALCOLA VELOCITÀ'}
          </span>
        </button>
      </div>
    </div>
  );
}
