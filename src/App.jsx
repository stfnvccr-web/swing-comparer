import React, { useState, useEffect, useRef } from 'react';
import Header from './components/Header';
import DualPlayer from './components/DualPlayer';
import VideoControlCard from './components/VideoControlCard';
import CameraRecorder from './components/CameraRecorder';
import GuidedImportWizard from './components/GuidedImportWizard';
import { saveVideoBlob, getVideoBlob } from './utils/db';
import { createDemoSwingVideo } from './utils/demoGenerator';

export default function App() {
  const [layoutMode, setLayoutMode] = useState('side-by-side');
  const [activeSingleSlot, setActiveSingleSlot] = useState('A');

  const [videoA, setVideoA] = useState(null);
  const [videoB, setVideoB] = useState(null);

  const [fpsA, setFpsA] = useState(60);
  const [fpsB, setFpsB] = useState(60);
  const [syncA, setSyncA] = useState(null);
  const [syncB, setSyncB] = useState(null);
  const [mirroredA, setMirroredA] = useState(false);
  const [mirroredB, setMirroredB] = useState(false);

  const [zoomA, setZoomA] = useState(1);
  const [zoomB, setZoomB] = useState(1);
  const [panA, setPanA] = useState({ x: 0, y: 0 });
  const [panB, setPanB] = useState({ x: 0, y: 0 });

  const [keypointsA, setKeypointsA] = useState({ address: null, top: null, impact: null, finish: null });
  const [keypointsB, setKeypointsB] = useState({ address: null, top: null, impact: null, finish: null });

  const [activeWizardSlot, setActiveWizardSlot] = useState(null);
  const playerControlsRef = useRef(null);

  const [timeA, setTimeA] = useState(0);
  const [timeB, setTimeB] = useState(0);
  const [durA, setDurA] = useState(0);
  const [durB, setDurB] = useState(0);

  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isLoadingDemos, setIsLoadingDemos] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const h = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', h);
    return () => window.removeEventListener('beforeinstallprompt', h);
  }, []);

  const handleInstallPwa = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => setDeferredPrompt(null));
    }
  };

  useEffect(() => {
    (async () => {
      const savedA = await getVideoBlob('video_A');
      if (savedA) { setVideoA(URL.createObjectURL(savedA.blob)); }
      const savedB = await getVideoBlob('video_B');
      if (savedB) { setVideoB(URL.createObjectURL(savedB.blob)); }
    })();
  }, []);

  const handleFileUpload = async (slot, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (slot === 'A') {
      setVideoA(url);
      await saveVideoBlob('video_A', file, file.name);
    } else {
      setVideoB(url);
      await saveVideoBlob('video_B', file, file.name);
    }
    setActiveWizardSlot(slot);
  };

  const handleSaveRecording = async (blob, slot) => {
    const url = URL.createObjectURL(blob);
    const name = `REC ${new Date().toLocaleTimeString()}`;
    if (slot === 'A') {
      setVideoA(url);
      await saveVideoBlob('video_A', blob, name);
    } else {
      setVideoB(url);
      await saveVideoBlob('video_B', blob, name);
    }
    setActiveWizardSlot(slot);
  };

  const handleLoadDemos = async () => {
    setIsLoadingDemos(true);
    try {
      // Force distinct demo videos generation
      const [blobU, blobP] = await Promise.all([
        createDemoSwingVideo('user'),
        createDemoSwingVideo('pro'),
      ]);

      const urlU = URL.createObjectURL(blobU);
      const urlP = URL.createObjectURL(blobP);

      setVideoA(urlU);
      setVideoB(urlP);

      await saveVideoBlob('video_A', blobU, 'Demo Utente');
      await saveVideoBlob('video_B', blobP, 'Demo Pro');

      setSyncA(1.83);
      setSyncB(1.66);
      setKeypointsA({ address: 0.2, top: 1.33, impact: 1.83 });
      setKeypointsB({ address: 0.2, top: 1.16, impact: 1.66 });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingDemos(false);
    }
  };

  const handleCompleteImportWizard = (slot, config) => {
    if (slot === 'A') {
      setKeypointsA(config.keypoints);
      if (config.keypoints.impact !== null) setSyncA(config.keypoints.impact);
    } else {
      setKeypointsB(config.keypoints);
      if (config.keypoints.impact !== null) setSyncB(config.keypoints.impact);
    }
  };

  const handleUpdateTimes = (slot, time, duration) => {
    if (slot === 'A') {
      setTimeA(time);
      if (duration && !durA) setDurA(duration);
    } else {
      setTimeB(time);
      if (duration && !durB) setDurB(duration);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      <Header
        layoutMode={layoutMode}
        setLayoutMode={setLayoutMode}
        onOpenRecorder={() => setIsRecorderOpen(true)}
        onLoadDemos={handleLoadDemos}
        isLoadingDemos={isLoadingDemos}
        deferredPrompt={deferredPrompt}
        onInstallPwa={handleInstallPwa}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto p-2.5 sm:p-4 flex flex-col gap-3">
        {/* Welcome */}
        {!videoA && !videoB && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 text-center flex flex-col items-center gap-2 shadow-lg">
            <h2 className="text-base font-bold text-white">Golf Swing Analyzer PRO</h2>
            <p className="text-xs text-zinc-400 max-w-md">
              Carica il tuo video (A) e un video di riferimento (B). Usa il wizard per impostare Setup, Top e Impatto.
            </p>
            <button
              onClick={handleLoadDemos}
              disabled={isLoadingDemos}
              className="px-4 py-2 text-xs font-extrabold rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition shadow"
            >
              {isLoadingDemos ? 'Caricamento...' : '⚡ Prova Subito con i Video Demo'}
            </button>
          </div>
        )}

        {/* Dual Player Container */}
        <DualPlayer
          videoA={videoA}
          videoB={videoB}
          layoutMode={layoutMode}
          activeSingleSlot={activeSingleSlot}
          setActiveSingleSlot={setActiveSingleSlot}
          fpsA={fpsA}
          fpsB={fpsB}
          syncA={syncA}
          syncB={syncB}
          setSyncA={setSyncA}
          setSyncB={setSyncB}
          mirroredA={mirroredA}
          mirroredB={mirroredB}
          zoomA={zoomA}
          zoomB={zoomB}
          panA={panA}
          panB={panB}
          setPanA={setPanA}
          setPanB={setPanB}
          keypointsA={keypointsA}
          keypointsB={keypointsB}
          setKeypointsA={setKeypointsA}
          setKeypointsB={setKeypointsB}
          autoSpeedMatch={true}
          onUpdateTimes={handleUpdateTimes}
          onBindControls={(c) => { playerControlsRef.current = c; }}
          onOpenWizard={(slot) => setActiveWizardSlot(slot)}
        />

        {/* Video Controls Grid */}
        <div className={`grid gap-3 ${layoutMode === 'single' ? 'grid-cols-1 max-w-xl mx-auto w-full' : 'grid-cols-1 md:grid-cols-2'}`}>
          {(layoutMode !== 'single' || activeSingleSlot === 'A') && (
            <VideoControlCard
              title="VIDEO A (UTENTE)"
              fps={fpsA}
              setFps={setFpsA}
              onStepFrame={(d) => playerControlsRef.current?.stepFrameA(d)}
              onFileUpload={(e) => handleFileUpload('A', e)}
              isMirrored={mirroredA}
              setIsMirrored={setMirroredA}
              currentTime={timeA}
              duration={durA}
              zoom={zoomA}
              setZoom={setZoomA}
              pan={panA}
              setPan={setPanA}
              accentColor="emerald"
              onOpenWizard={() => setActiveWizardSlot('A')}
            />
          )}

          {(layoutMode !== 'single' || activeSingleSlot === 'B') && (
            <VideoControlCard
              title="VIDEO B (PRO)"
              fps={fpsB}
              setFps={setFpsB}
              onStepFrame={(d) => playerControlsRef.current?.stepFrameB(d)}
              onFileUpload={(e) => handleFileUpload('B', e)}
              isMirrored={mirroredB}
              setIsMirrored={setMirroredB}
              currentTime={timeB}
              duration={durB}
              zoom={zoomB}
              setZoom={setZoomB}
              pan={panB}
              setPan={setPanB}
              accentColor="sky"
              onOpenWizard={() => setActiveWizardSlot('B')}
            />
          )}
        </div>
      </main>

      {/* Guided Import Wizard Modal */}
      <GuidedImportWizard
        isOpen={activeWizardSlot !== null}
        onClose={() => setActiveWizardSlot(null)}
        videoSrc={activeWizardSlot === 'A' ? videoA : videoB}
        slot={activeWizardSlot}
        slotName={activeWizardSlot === 'A' ? 'Video A (Utente)' : 'Video B (Pro)'}
        onCompleteWizard={handleCompleteImportWizard}
      />

      {/* Camera Recorder Modal */}
      <CameraRecorder
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        onSaveRecording={handleSaveRecording}
      />
    </div>
  );
}
