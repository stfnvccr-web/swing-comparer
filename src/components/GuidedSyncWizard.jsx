import React, { useState } from 'react';
import { Target, CheckCircle2, ChevronRight, Play, RotateCcw, X, Zap } from 'lucide-react';

export default function GuidedSyncWizard({
  isOpen,
  onClose,
  timeA,
  timeB,
  syncDataA,
  syncDataB,
  setSyncDataA,
  setSyncDataB,
  onApplyGuidedSync,
}) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Address, 2: Top Swing, 3: Impact, 4: Summary

  if (!isOpen) return null;

  const handleSetPoint = (slot, key) => {
    const time = slot === 'A' ? timeA : timeB;
    if (slot === 'A') {
      setSyncDataA((prev) => ({ ...prev, [key]: time }));
    } else {
      setSyncDataB((prev) => ({ ...prev, [key]: time }));
    }
  };

  // Tempo calculations
  const calcTempo = (data) => {
    if (data.address === null || data.top === null || data.impact === null) return null;
    const backswing = Math.max(0.01, data.top - data.address);
    const downswing = Math.max(0.01, data.impact - data.top);
    const total = data.impact - data.address;
    const ratio = (backswing / downswing).toFixed(1);
    return { backswing, downswing, total, ratio };
  };

  const tempoA = calcTempo(syncDataA);
  const tempoB = calcTempo(syncDataB);

  const steps = [
    { id: 1, title: '1. Setup / Indirizzo', key: 'address', desc: 'Posiziona entrambi i video sul primo fotogramma del movimento verso l\'indietro.' },
    { id: 2, title: '2. Top del Backswing', key: 'top', desc: 'Posiziona entrambi i video sul punto di massima inversione in cima al backswing.' },
    { id: 3, title: '3. Impatto con la Palla', key: 'impact', desc: 'Posiziona entrambi i video sull\'esatto fotogramma di contatto con la pallina.' },
  ];

  const activeStepObj = steps.find((s) => s.id === currentStep);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl flex flex-col gap-4">
        {/* Wizard Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Sincronizzazione Guidata</h2>
              <p className="text-xs text-zinc-400">Punti chiave & Analisi Tempo Swing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((stepId) => (
            <div
              key={stepId}
              onClick={() => setCurrentStep(stepId)}
              className={`py-1.5 text-center text-xs font-bold rounded-lg cursor-pointer transition border ${
                currentStep === stepId
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow'
                  : currentStep > stepId
                  ? 'bg-zinc-800 text-emerald-400 border-emerald-500/40'
                  : 'bg-zinc-950 text-zinc-600 border-zinc-800'
              }`}
            >
              {stepId === 4 ? 'Risultato' : `Passo ${stepId}`}
            </div>
          ))}
        </div>

        {/* Active Step Content */}
        {currentStep <= 3 && activeStepObj && (
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
              <Target className="w-4 h-4" />
              {activeStepObj.title}
            </h3>
            <p className="text-xs text-zinc-300 leading-relaxed">{activeStepObj.desc}</p>

            <div className="grid grid-cols-2 gap-3 mt-1">
              {/* Set Point Video A */}
              <div className="bg-zinc-900 p-3 rounded-lg border border-emerald-500/30 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-emerald-400">VIDEO A (UTENTE)</span>
                <span className="text-xs font-mono text-zinc-300">Tempo attuale: {timeA.toFixed(3)}s</span>
                <button
                  onClick={() => handleSetPoint('A', activeStepObj.key)}
                  className="mt-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95 flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Imposta ({syncDataA[activeStepObj.key] !== null ? `${syncDataA[activeStepObj.key].toFixed(2)}s` : 'Non impostato'})
                  </span>
                </button>
              </div>

              {/* Set Point Video B */}
              <div className="bg-zinc-900 p-3 rounded-lg border border-sky-500/30 flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-sky-400">VIDEO B (PRO)</span>
                <span className="text-xs font-mono text-zinc-300">Tempo attuale: {timeB.toFixed(3)}s</span>
                <button
                  onClick={() => handleSetPoint('B', activeStepObj.key)}
                  className="mt-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white transition active:scale-95 flex items-center justify-center gap-1"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Imposta ({syncDataB[activeStepObj.key] !== null ? `${syncDataB[activeStepObj.key].toFixed(2)}s` : 'Non impostato'})
                  </span>
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-2 pt-2 border-t border-zinc-800">
              <button
                disabled={currentStep === 1}
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-3 py-1.5 text-xs font-semibold text-zinc-400 hover:text-white disabled:opacity-30"
              >
                Indietro
              </button>
              <button
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-emerald-500 text-zinc-950 hover:bg-emerald-400 flex items-center gap-1 shadow"
              >
                <span>Avanti</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Summary & Tempo Comparison */}
        {currentStep === 4 && (
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-emerald-400">Riepilogo e Analisi del Tempo</h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Tempo Video A */}
              <div className="bg-zinc-900 p-3 rounded-lg border border-emerald-500/30 flex flex-col gap-1 font-mono">
                <span className="font-sans font-bold text-emerald-400 text-[11px]">SWING UTENTE</span>
                {tempoA ? (
                  <>
                    <span>Backswing: {tempoA.backswing.toFixed(2)}s</span>
                    <span>Downswing: {tempoA.downswing.toFixed(2)}s</span>
                    <span className="font-bold text-amber-400">Rapporto: {tempoA.ratio} : 1</span>
                  </>
                ) : (
                  <span className="text-zinc-500">Punti incompleti</span>
                )}
              </div>

              {/* Tempo Video B */}
              <div className="bg-zinc-900 p-3 rounded-lg border border-sky-500/30 flex flex-col gap-1 font-mono">
                <span className="font-sans font-bold text-sky-400 text-[11px]">SWING PRO</span>
                {tempoB ? (
                  <>
                    <span>Backswing: {tempoB.backswing.toFixed(2)}s</span>
                    <span>Downswing: {tempoB.downswing.toFixed(2)}s</span>
                    <span className="font-bold text-amber-400">Rapporto: {tempoB.ratio} : 1</span>
                  </>
                ) : (
                  <span className="text-zinc-500">Punti incompleti</span>
                )}
              </div>
            </div>

            <p className="text-[11px] text-zinc-400 italic">
              💡 Nota: Il rapporto di tempo ideale nel golf professionistico (Backswing : Downswing) è di circa <strong className="text-white">3.0 : 1</strong>.
            </p>

            <button
              onClick={() => {
                onApplyGuidedSync();
                onClose();
              }}
              className="w-full mt-2 py-2.5 rounded-xl bg-emerald-500 text-zinc-950 font-extrabold text-xs shadow-lg hover:bg-emerald-400 transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>APPLICA SINCRONIZZAZIONE ALL'IMPATTO</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
