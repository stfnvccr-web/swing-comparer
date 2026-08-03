import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Video, Play, Check, AlertCircle } from 'lucide-react';

export default function CameraRecorder({ isOpen, onClose, onSaveRecording }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [facingMode, setFacingMode] = useState('environment'); // 'user' (front) or 'environment' (back)
  const [stream, setStream] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recDuration, setRecDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [timerPreset, setTimerPreset] = useState(3); // 3s or 5s
  const [errorMsg, setErrorMsg] = useState(null);

  // Sound beep using Web Audio API
  const playBeep = (freq = 880, duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.log('Audio beep unavailable', e);
    }
  };

  // Start Camera Stream when modal is opened or camera flipped
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    async function initCamera() {
      setErrorMsg(null);
      stopCamera();
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error('Camera access error:', err);
        setErrorMsg('Impossibile accedere alla fotocamera. Verifica i permessi del browser.');
      }
    }

    initCamera();

    return () => stopCamera();
  }, [isOpen, facingMode]);

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  // Recording Timer effect
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setRecDuration(0);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Start Countdown then Start Recording
  const handleStartCountdown = () => {
    if (!stream) return;
    setRecordedBlob(null);
    let count = timerPreset;
    setCountdown(count);
    playBeep(600, 0.1);

    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        playBeep(600, 0.1);
      } else {
        clearInterval(timer);
        setCountdown(null);
        playBeep(1200, 0.3); // High beep for REC START
        startRecording();
      }
    }, 1000);
  };

  const startRecording = () => {
    if (!stream) return;
    chunksRef.current = [];

    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm';
    if (!MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/mp4';

    const recorder = new MediaRecorder(stream, { mimeType });
    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      setRecordedBlob(blob);
      setIsRecording(false);
    };

    recorder.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      playBeep(400, 0.2);
    }
  };

  const handleUseVideo = (slot) => {
    if (recordedBlob && onSaveRecording) {
      onSaveRecording(recordedBlob, slot);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4 sm:p-6 overflow-hidden animate-fadeIn">
      {/* Header Modal Bar */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-rose-500 animate-pulse" />
          <h2 className="text-base font-bold text-white">Registra Swing Localmente</h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Camera Viewfinder */}
      <div className="relative flex-1 my-3 bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden flex items-center justify-center">
        {errorMsg ? (
          <div className="p-6 text-center text-rose-400 flex flex-col items-center gap-2">
            <AlertCircle className="w-8 h-8" />
            <p className="text-sm font-semibold">{errorMsg}</p>
          </div>
        ) : recordedBlob ? (
          /* Preview recorded video */
          <video
            src={URL.createObjectURL(recordedBlob)}
            controls
            autoPlay
            loop
            className="w-full h-full object-contain"
          />
        ) : (
          /* Live camera stream */
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
          />
        )}

        {/* Countdown Overlay Display */}
        {countdown !== null && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <span className="text-8xl font-black text-amber-400 animate-ping font-mono">{countdown}</span>
            <p className="text-sm font-bold text-zinc-300 mt-4">PREPARATI AL SWING...</p>
          </div>
        )}

        {/* REC Status Badge */}
        {isRecording && (
          <div className="absolute top-4 left-4 flex items-center gap-2 bg-rose-600/90 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg animate-pulse z-10">
            <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>REC {recDuration}s</span>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar */}
      <div className="z-10 flex flex-col gap-3">
        {recordedBlob ? (
          /* Decision Bar after recording */
          <div className="flex flex-wrap items-center justify-center gap-2 bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
            <span className="text-xs font-semibold text-zinc-300 w-full text-center">
              Registrazione Completata! Dove vuoi usarla?
            </span>
            <button
              onClick={() => handleUseVideo('A')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 text-white hover:bg-emerald-500 transition active:scale-95 shadow"
            >
              <Check className="w-4 h-4" />
              <span>Imposta su Video A (Utente)</span>
            </button>
            <button
              onClick={() => handleUseVideo('B')}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 text-white hover:bg-sky-500 transition active:scale-95 shadow"
            >
              <Check className="w-4 h-4" />
              <span>Imposta su Video B (Pro)</span>
            </button>
            <button
              onClick={() => setRecordedBlob(null)}
              className="px-3 py-2 text-xs font-medium rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition"
            >
              Ricomincia
            </button>
          </div>
        ) : (
          /* Camera Controls Bar */
          <div className="flex items-center justify-between gap-2 bg-zinc-900 p-3 rounded-2xl border border-zinc-800">
            {/* Timer preset selection */}
            <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
              <span className="text-[10px] text-zinc-500 font-bold px-1">TIMER:</span>
              {[3, 5].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimerPreset(t)}
                  className={`px-2 py-1 text-xs font-bold rounded-lg transition ${timerPreset === t ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400 hover:text-zinc-200'}`}
                >
                  {t}s
                </button>
              ))}
            </div>

            {/* Main Record / Stop Button */}
            {isRecording ? (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition transform active:scale-95 animate-pulse"
              >
                <div className="w-3 h-3 bg-white rounded-sm" />
                <span>FERMA REGISTRAZIONE</span>
              </button>
            ) : (
              <button
                onClick={handleStartCountdown}
                disabled={!stream || countdown !== null}
                className="flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/30 transition transform active:scale-95 disabled:opacity-50"
              >
                <Video className="w-4 h-4" />
                <span>AVVIA REC ({timerPreset}s TIMER)</span>
              </button>
            )}

            {/* Flip Camera */}
            <button
              onClick={() => setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'))}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition active:scale-95"
              title="Inverti Fotocamera (Frontale / Posteriore)"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
