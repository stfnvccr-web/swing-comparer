import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Play, Pause, Sliders } from 'lucide-react';
import CanvasOverlay from './CanvasOverlay';

export default function DualPlayer({
  videoA,
  videoB,
  layoutMode,
  activeSingleSlot,
  setActiveSingleSlot,
  fpsA = 60,
  fpsB = 60,
  syncA,
  syncB,
  mirroredA,
  mirroredB,
  zoomA = 1,
  zoomB = 1,
  panA = { x: 0, y: 0 },
  panB = { x: 0, y: 0 },
  keypointsA,
  keypointsB,
  setKeypointsA,
  setKeypointsB,
  setSyncA,
  setSyncB,
  autoSpeedMatch,
  onUpdateTimes,
  onBindControls,
}) {
  const videoRefA = useRef(null);
  const videoRefB = useRef(null);

  const containerRefA = useRef(null);
  const containerRefB = useRef(null);
  const containerRefOverlay = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);

  const [timeA, setTimeA] = useState(0);
  const [timeB, setTimeB] = useState(0);
  const [durA, setDurA] = useState(0);
  const [durB, setDurB] = useState(0);

  const [dimA, setDimA] = useState({ width: 480, height: 360 });
  const [dimB, setDimB] = useState({ width: 480, height: 360 });
  const [dimOverlay, setDimOverlay] = useState({ width: 640, height: 480 });

  // Stable refs for sync values (avoids stale closure & unnecessary re-renders)
  const impactARef = useRef(syncA ?? 0);
  const impactBRef = useRef(syncB ?? 0);
  const speedRatioBRef = useRef(1);
  const layoutModeRef = useRef(layoutMode);
  const playbackRateRef = useRef(playbackRate);

  useEffect(() => { impactARef.current = syncA ?? 0; }, [syncA]);
  useEffect(() => { impactBRef.current = syncB ?? 0; }, [syncB]);
  useEffect(() => { layoutModeRef.current = layoutMode; }, [layoutMode]);
  useEffect(() => { playbackRateRef.current = playbackRate; }, [playbackRate]);

  // Refs for keypoints (used inside useCallback)
  const keypointsARef = useRef(keypointsA);
  const keypointsBRef = useRef(keypointsB);
  useEffect(() => { keypointsARef.current = keypointsA; }, [keypointsA]);
  useEffect(() => { keypointsBRef.current = keypointsB; }, [keypointsB]);

  // Compute speed ratio and keep in ref
  const speedRatioB = useMemo(() => {
    if (!autoSpeedMatch || !keypointsA?.address || !keypointsA?.impact || !keypointsB?.address || !keypointsB?.impact) return 1;
    const durA = keypointsA.impact - keypointsA.address;
    const durB = keypointsB.impact - keypointsB.address;
    if (durA <= 0.1 || durB <= 0.1) return 1;
    return durB / durA;
  }, [autoSpeedMatch, keypointsA, keypointsB]);

  useEffect(() => { speedRatioBRef.current = speedRatioB; }, [speedRatioB]);

  // ——— SYNC ENGINE (called only from onTimeUpdate of videoA — not RAF loop) ———
  // Video A fires onTimeUpdate; we correct B's position if drifted > 35ms (~2 frames).
  // This is lightweight: browser fires onTimeUpdate at most ~4Hz during normal playback
  // and much more during seeks, which is exactly when correction matters.
  const onTimeUpdateA = useCallback(() => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (!vA) return;

    const tA = vA.currentTime;
    setTimeA(tA);

    if (vB && layoutModeRef.current !== 'single') {
      const deltaT = tA - impactARef.current;
      const targetB = Math.max(0, Math.min(vB.duration || 0, impactBRef.current + deltaT * speedRatioBRef.current));
      if (Math.abs(vB.currentTime - targetB) > 0.035) {
        vB.currentTime = targetB;
      }
    }
    // Auto-stop at finish keypoint or video end
    const finishA = keypointsARef.current?.finish ?? (vA.duration || Infinity);
    const finishB = keypointsBRef.current?.finish ?? (vB?.duration || Infinity);
    if (vA.currentTime >= finishA || (vB && vB.currentTime >= finishB)) {
      vA.pause();
      vB?.pause();
      setIsPlaying(false);
    }
  }, []);

  const onTimeUpdateB = useCallback(() => {
    const vB = videoRefB.current;
    if (vB) setTimeB(vB.currentTime);
  }, []);

  // ——— CONTROLS ———
  useEffect(() => {
    if (onBindControls) {
      onBindControls({
        stepFrameA: (dir) => {
          const vA = videoRefA.current;
          if (!vA) return;
          vA.currentTime = Math.max(0, Math.min(vA.duration || 0, vA.currentTime + dir / fpsA));
          onTimeUpdateA();
        },
        stepFrameB: (dir) => {
          const vB = videoRefB.current;
          if (!vB) return;
          vB.currentTime = Math.max(0, Math.min(vB.duration || 0, vB.currentTime + dir / fpsB));
        },
      });
    }
  }, [fpsA, fpsB, onBindControls, onTimeUpdateA]);

  // ——— PLAY / PAUSE ———
  const togglePlay = async () => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;

    // --- SINGLE MODE ---
    if (layoutMode === 'single') {
      const v = activeSingleSlot === 'A' ? vA : vB;
      if (!v || !v.src) return;
      if (isPlaying) {
        v.pause();
        setIsPlaying(false);
      } else {
        v.playbackRate = playbackRate;
        try { await v.play(); setIsPlaying(true); } catch (e) { console.warn('Play failed:', e); }
      }
      return;
    }

    // --- DUAL / OVERLAY MODE ---
    if (!vA || !vA.src) return;

    if (isPlaying) {
      vA.pause();
      vB?.pause();
      setIsPlaying(false);
    } else {
      // Set playback rates
      vA.playbackRate = playbackRate;
      if (vB?.src) vB.playbackRate = playbackRate * speedRatioBRef.current;

      // Start playing A, then B synced
      try {
        await vA.play();
        if (vB?.src) vB.play().catch(() => {});
        setIsPlaying(true);
      } catch (e) {
        console.warn('Play failed:', e);
      }
    }
  };

  // Update playback rates when speed changes
  useEffect(() => {
    if (videoRefA.current) videoRefA.current.playbackRate = playbackRate;
    if (videoRefB.current) videoRefB.current.playbackRate = playbackRate * speedRatioB;
  }, [playbackRate, speedRatioB]);

  // ——— MASTER SCRUBBER (relative to impact = 0.0s) ———
  const currentDeltaT = timeA - (syncA ?? 0);

  const handleScrubRelative = (e) => {
    const dt = parseFloat(e.target.value);
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    if (vA) { vA.currentTime = Math.max(0, Math.min(vA.duration || 0, impactARef.current + dt)); setTimeA(vA.currentTime); }
    if (vB && layoutMode !== 'single') { vB.currentTime = Math.max(0, Math.min(vB.duration || 0, impactBRef.current + dt * speedRatioBRef.current)); }
  };

  const handleStepBoth = (dir) => {
    const vA = videoRefA.current;
    if (vA) { vA.currentTime = Math.max(0, Math.min(vA.duration || 0, vA.currentTime + dir / fpsA)); onTimeUpdateA(); }
  };

  const handleSnapPhase = (phase) => {
    const vA = videoRefA.current;
    const vB = videoRefB.current;
    const iA = impactARef.current, iB = impactBRef.current;

    let tA = iA, tB = iB;
    if (phase === 'address') {
      tA = keypointsA?.address ?? Math.max(0, iA - 1.2);
      tB = keypointsB?.address ?? Math.max(0, iB - 1.2);
    } else if (phase === 'top') {
      tA = keypointsA?.top ?? Math.max(0, iA - 0.4);
      tB = keypointsB?.top ?? Math.max(0, iB - 0.4);
    } else if (phase === 'finish') {
      tA = keypointsA?.finish ?? Math.min(vA?.duration || iA + 1.5, iA + 1.5);
      tB = keypointsB?.finish ?? Math.min(vB?.duration || iB + 1.5, iB + 1.5);
    }

    if (vA) { vA.currentTime = tA; setTimeA(tA); }
    if (vB && layoutMode !== 'single') vB.currentTime = tB;
  };

  // ——— RESIZE OBSERVERS ———
  useEffect(() => {
    const update = () => {
      if (containerRefA.current) setDimA({ width: containerRefA.current.clientWidth, height: containerRefA.current.clientHeight });
      if (containerRefB.current) setDimB({ width: containerRefB.current.clientWidth, height: containerRefB.current.clientHeight });
      if (containerRefOverlay.current) setDimOverlay({ width: containerRefOverlay.current.clientWidth, height: containerRefOverlay.current.clientHeight });
    };
    update();
    const ro = new ResizeObserver(update);
    [containerRefA, containerRefB, containerRefOverlay].forEach(r => r.current && ro.observe(r.current));
    return () => ro.disconnect();
  }, [layoutMode, activeSingleSlot]);

  // ——— INLINE KEYPOINT BAR ———
  const KeypointBar = ({ slot, keypoints, setKeypoints, currentTime, accentColor }) => {
    const phases = [
      { key: 'address', label: '🏌️ Setup', color: 'amber' },
      { key: 'top', label: '🔝 Top', color: 'sky' },
      { key: 'impact', label: '⚡ Impatto', color: 'emerald' },
      { key: 'finish', label: '🏁 Finish', color: 'rose' },
    ];

    const colorMap = {
      amber: { set: 'bg-amber-500/20 text-amber-400 border-amber-500/40', label: 'text-amber-400' },
      sky: { set: 'bg-sky-500/20 text-sky-400 border-sky-500/40', label: 'text-sky-400' },
      emerald: { set: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40', label: 'text-emerald-400' },
      rose: { set: 'bg-rose-500/20 text-rose-400 border-rose-500/40', label: 'text-rose-400' },
    };

    const handleMark = (phaseKey) => {
      if (!setKeypoints) return;
      const updated = { ...keypoints, [phaseKey]: currentTime };
      setKeypoints(updated);
      // Auto-set syncA/syncB when impact is marked
      if (phaseKey === 'impact') {
        if (slot === 'A') setSyncA?.(currentTime);
        else setSyncB?.(currentTime);
      }
    };

    const handleClear = (phaseKey, e) => {
      e.stopPropagation();
      if (!setKeypoints) return;
      const updated = { ...keypoints, [phaseKey]: null };
      setKeypoints(updated);
      if (phaseKey === 'impact') {
        if (slot === 'A') setSyncA?.(null);
        else setSyncB?.(null);
      }
    };

    return (
      <div className="absolute bottom-0 left-0 right-0 z-10 flex items-center gap-1 px-2 py-1.5 bg-zinc-900/80 backdrop-blur border-t border-zinc-800">
        {phases.map(({ key, label, color }) => {
          const val = keypoints?.[key];
          const isSet = val !== null && val !== undefined;
          return (
            <button
              key={key}
              onClick={() => handleMark(key)}
              className={`flex-1 flex flex-col items-center gap-0.5 px-1 py-1 rounded-lg text-[9px] font-bold transition active:scale-95 border ${
                isSet
                  ? colorMap[color].set
                  : 'bg-zinc-800/50 text-zinc-500 border-zinc-700/50 hover:text-zinc-300'
              }`}
            >
              <span className="leading-none">{label}</span>
              {isSet ? (
                <span className="flex items-center gap-0.5">
                  <span className="font-mono text-[8px]">{val.toFixed(2)}s</span>
                  <span
                    onClick={(e) => handleClear(key, e)}
                    className="text-zinc-500 hover:text-red-400 cursor-pointer ml-0.5"
                  >✕</span>
                </span>
              ) : (
                <span className="text-[8px] text-zinc-600">tap</span>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  // ——— VIDEO SLOT COMPONENT (inline to share refs) ———
  const VideoEl = ({ refEl, src, onTU, onMeta, zoom, pan, mirrored, label, accentClass }) => (
    <div className={`absolute inset-0 flex items-center justify-center`}>
      {src ? (
        <video
          ref={refEl} src={src}
          onTimeUpdate={onTU}
          onLoadedMetadata={onMeta}
          onEnded={() => {
            if (refEl.current) refEl.current.pause();
            setIsPlaying(false);
          }}
          playsInline muted
          style={{ transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)` }}
          className={`w-full h-full object-contain ${mirrored ? 'scale-x-[-1]' : ''}`}
        />
      ) : (
        <div className="text-zinc-600 text-sm font-bold">{label} vuoto</div>
      )}
      {/* Video Label Badge */}
      <div className={`absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-extrabold ${accentClass}`}>
        {label}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-2.5 w-full max-w-5xl mx-auto">
      {/* Single slot switcher */}
      {layoutMode === 'single' && (
        <div className="flex justify-center">
          <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800">
            <button onClick={() => setActiveSingleSlot('A')} className={`px-3 py-1 text-xs font-bold rounded-lg transition ${activeSingleSlot === 'A' ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400'}`}>Video A (Utente)</button>
            <button onClick={() => setActiveSingleSlot('B')} className={`px-3 py-1 text-xs font-bold rounded-lg transition ${activeSingleSlot === 'B' ? 'bg-sky-500 text-zinc-950' : 'text-zinc-400'}`}>Video B (Pro)</button>
          </div>
        </div>
      )}

      {/* ——— VIDEO AREA ——— */}
      <div className="bg-black rounded-3xl overflow-hidden border border-zinc-800 shadow-2xl">

        {/* SINGLE */}
        {layoutMode === 'single' && (
          <div ref={containerRefA} className="relative w-full aspect-[3/4] sm:aspect-[16/9] max-h-[75vh] bg-zinc-950 overflow-hidden">
            {activeSingleSlot === 'A' ? (
              <>
                <VideoEl refEl={videoRefA} src={videoA} onTU={onTimeUpdateA} onMeta={(e) => setDurA(e.target.duration)} zoom={zoomA} pan={panA} mirrored={mirroredA} label="A · UTENTE" accentClass="bg-emerald-500 text-zinc-950" />
                <KeypointBar slot="A" keypoints={keypointsA} setKeypoints={setKeypointsA} currentTime={timeA} accentColor="emerald" />
              </>
            ) : (
              <>
                <VideoEl refEl={videoRefB} src={videoB} onTU={onTimeUpdateB} onMeta={(e) => setDurB(e.target.duration)} zoom={zoomB} pan={panB} mirrored={mirroredB} label="B · PRO" accentClass="bg-sky-500 text-zinc-950" />
                <KeypointBar slot="B" keypoints={keypointsB} setKeypoints={setKeypointsB} currentTime={timeB} accentColor="sky" />
              </>
            )}
            <CanvasOverlay width={dimA.width} height={dimA.height} />
          </div>
        )}

        {/* SIDE-BY-SIDE: each half has its own canvas */}
        {layoutMode === 'side-by-side' && (
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
            <div ref={containerRefA} className="relative aspect-[3/4] sm:aspect-[4/3] bg-zinc-950 overflow-hidden">
              <VideoEl refEl={videoRefA} src={videoA} onTU={onTimeUpdateA} onMeta={(e) => setDurA(e.target.duration)} zoom={zoomA} pan={panA} mirrored={mirroredA} label="A · UTENTE" accentClass="bg-emerald-500 text-zinc-950" />
              <CanvasOverlay width={dimA.width} height={dimA.height} />
              <KeypointBar slot="A" keypoints={keypointsA} setKeypoints={setKeypointsA} currentTime={timeA} accentColor="emerald" />
            </div>
            <div ref={containerRefB} className="relative aspect-[3/4] sm:aspect-[4/3] bg-zinc-950 overflow-hidden">
              <VideoEl refEl={videoRefB} src={videoB} onTU={onTimeUpdateB} onMeta={(e) => setDurB(e.target.duration)} zoom={zoomB} pan={panB} mirrored={mirroredB} label="B · PRO" accentClass="bg-sky-500 text-zinc-950" />
              <CanvasOverlay width={dimB.width} height={dimB.height} />
              <KeypointBar slot="B" keypoints={keypointsB} setKeypoints={setKeypointsB} currentTime={timeB} accentColor="sky" />
            </div>
          </div>
        )}

        {/* OVERLAY */}
        {layoutMode === 'overlay' && (
          <div ref={containerRefOverlay} className="relative w-full aspect-[3/4] sm:aspect-[16/9] max-h-[70vh] bg-zinc-950 overflow-hidden">
            {videoA && (
              <video ref={videoRefA} src={videoA} onTimeUpdate={onTimeUpdateA} onLoadedMetadata={(e) => setDurA(e.target.duration)}
                playsInline muted
                style={{ transform: `scale(${zoomA}) translate(${panA.x}px, ${panA.y}px)` }}
                className={`absolute inset-0 w-full h-full object-contain ${mirroredA ? 'scale-x-[-1]' : ''}`}
              />
            )}
            {videoB && (
              <video ref={videoRefB} src={videoB} onLoadedMetadata={(e) => setDurB(e.target.duration)}
                playsInline muted
                style={{ opacity: overlayOpacity, transform: `scale(${zoomB}) translate(${panB.x}px, ${panB.y}px)` }}
                className={`absolute inset-0 w-full h-full object-contain mix-blend-screen ${mirroredB ? 'scale-x-[-1]' : ''}`}
              />
            )}
            <CanvasOverlay width={dimOverlay.width} height={dimOverlay.height} />
          </div>
        )}
      </div>

      {/* Overlay opacity */}
      {layoutMode === 'overlay' && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-2.5 flex items-center gap-3">
          <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-xs text-zinc-300 shrink-0">Trasparenza B:</span>
          <input type="range" min="0" max="1" step="0.02" value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(parseFloat(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded cursor-pointer accent-amber-400" />
          <span className="text-xs font-mono font-bold text-amber-400 w-8 text-right">{Math.round(overlayOpacity * 100)}%</span>
        </div>
      )}

      {/* ——— HERO SCRUBBER ——— */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-3 sm:p-4 flex flex-col gap-3 shadow-xl">
        {/* Phase snap buttons */}
        <div className="flex items-center justify-between gap-1">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wide">Slider Confronto</span>
          {layoutMode !== 'single' && (
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-2xl border border-zinc-800">
              <button onClick={() => handleSnapPhase('address')} className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-zinc-800 text-amber-300 border border-amber-500/30">🏌️ Setup</button>
              <button onClick={() => handleSnapPhase('top')} className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-zinc-800 text-sky-300 border border-sky-500/30">🔝 Top</button>
              <button onClick={() => handleSnapPhase('impact')} className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">⚡ Impatto</button>
              <button onClick={() => handleSnapPhase('finish')} className="px-2.5 py-1 text-[11px] font-bold rounded-xl bg-zinc-800 text-rose-300 border border-rose-500/30">🏁 Finish</button>
            </div>
          )}
        </div>

        {/* Relative scrubber */}
        <div className="flex flex-col gap-1">
          <input type="range" min="-2.5" max="2.5" step="0.01"
            value={Math.max(-2.5, Math.min(2.5, currentDeltaT))}
            onChange={handleScrubRelative}
            className="w-full h-4 bg-zinc-950 rounded-lg cursor-pointer accent-emerald-400 border border-zinc-800" />
          <div className="flex justify-between text-[10px] font-mono text-zinc-400 px-0.5">
            <span>-2.5s</span>
            <span className="text-emerald-400 font-bold">{currentDeltaT > 0 ? '+' : ''}{currentDeltaT.toFixed(2)}s (0.0 = impatto)</span>
            <span>+2.5s</span>
          </div>
        </div>

        {/* Playback controls */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-800">
          <div className="flex items-center gap-1">
            <button onClick={() => handleStepBoth(-1)} className="px-3 py-1.5 text-xs font-bold rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700">-1 Fr</button>
            <button onClick={() => handleStepBoth(1)} className="px-3 py-1.5 text-xs font-bold rounded-xl bg-zinc-800 text-zinc-200 border border-zinc-700">+1 Fr</button>
          </div>

          <button onClick={togglePlay} className="flex items-center gap-1.5 px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-extrabold text-xs shadow-lg transition active:scale-95">
            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isPlaying ? 'PAUSA' : 'PLAY SYNC'}</span>
          </button>

          <div className="flex items-center gap-0.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            {[1, 0.5, 0.25, 0.1].map((s) => (
              <button key={s} onClick={() => setPlaybackRate(s)}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition ${playbackRate === s ? 'bg-emerald-500 text-zinc-950' : 'text-zinc-400'}`}>
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
