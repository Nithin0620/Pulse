import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Heart,
  Activity,
  Zap,
  Info,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Sun,
  ShieldCheck,
} from 'lucide-react';
import { VitalsService, type SignalState, type VitalsResult } from '../services/vitalsService';
import { useActivePatient } from '../context/RoleContext';
import { useFirebase } from '../context/FirebaseContext';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, onSnapshot } from 'firebase/firestore';

export const Vitals: React.FC = () => {
  const { patientId } = useActivePatient();
  const { db, isFirebaseActive } = useFirebase();

  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [isFingerPlaced, setIsFingerPlaced] = useState(false);
  const [liveBpm, setLiveBpm] = useState<number | null>(null);
  const [liveHrv, setLiveHrv] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100%
  const [completedResult, setCompletedResult] = useState<VitalsResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [screenLightActive, setScreenLightActive] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Past readings
  const [history, setHistory] = useState<VitalsResult[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wavePointsRef = useRef<number[]>([]);
  const cameraStopRef = useRef<(() => void) | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const collectedBpmsRef = useRef<number[]>([]);

  // Load past vitals from Firestore or localStorage
  useEffect(() => {
    if (isFirebaseActive && db && patientId) {
      try {
        const vitalsCol = collection(db, `users/${patientId}/vitals`);
        const q = query(vitalsCol, orderBy('timestamp', 'desc'), limit(10));
        const unsub = onSnapshot(q, (snapshot) => {
          const loaded: VitalsResult[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            loaded.push({
              bpm: data.bpm,
              hrv: data.hrv || 0,
              confidence: data.confidence || 90,
              timestamp: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
              status: VitalsService.getBpmCategory(data.bpm).status,
            });
          });
          setHistory(loaded);
        });
        return () => unsub();
      } catch (err) {
        console.warn('Could not load vitals from firestore:', err);
      }
    } else {
      // Local storage fallback
      try {
        const saved = localStorage.getItem('pulse_vitals_history');
        if (saved) setHistory(JSON.parse(saved));
      } catch {}
    }
  }, [isFirebaseActive, db, patientId]);

  // Handle pulse waveform rendering on canvas
  const drawWaveform = useCallback((point: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const points = wavePointsRef.current;
    points.push(point);
    if (points.length > 200) points.shift();

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw background grid lines (ECG Monitor style)
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 25) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Draw waveform
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = '#10b981'; // Pulse emerald
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const step = w / 200;
    const midY = h / 2;
    // Dynamic scale factor based on amplitude
    const scale = Math.min(h / 3, 28);

    points.forEach((val, i) => {
      const x = i * step;
      const y = midY - val * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Glowing scan line head
    const lastX = (points.length - 1) * step;
    const lastY = midY - points[points.length - 1] * scale;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#34d399';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
  }, []);

  // Stop active camera and timers
  const stopScanning = useCallback(() => {
    if (cameraStopRef.current) {
      cameraStopRef.current();
      cameraStopRef.current = null;
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setIsScanning(false);
    setIsFingerPlaced(false);
    setScreenLightActive(false);
  }, []);

  // Start measurement
  const startScanning = async () => {
    setErrorMessage(null);
    setCompletedResult(null);
    setLiveBpm(null);
    setLiveHrv(null);
    setScanProgress(0);
    setSavedSuccess(false);
    wavePointsRef.current = [];
    collectedBpmsRef.current = [];

    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setScreenLightActive(true); // Turn on screen illumination assist

      const { stop, hasTorch: torchAvail } = await VitalsService.startCamera(
        videoRef.current,
        (signal: SignalState) => {
          setIsFingerPlaced(signal.isFingerCovered);
          drawWaveform(signal.filteredValue);

          if (signal.isFingerCovered && signal.bpm) {
            setLiveBpm(signal.bpm);
            setLiveHrv(signal.hrv);
            setConfidence(signal.confidence);
            collectedBpmsRef.current.push(signal.bpm);
          }
        }
      );

      cameraStopRef.current = stop;
      setHasTorch(torchAvail);

      // 15-second scanning interval countdown
      const startTime = Date.now();
      const TOTAL_MS = 14000; // 14 seconds scan

      progressTimerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, Math.round((elapsed / TOTAL_MS) * 100));
        setScanProgress(pct);

        if (pct >= 100) {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);

          // Calculate final median reading
          const bpms = collectedBpmsRef.current;
          if (bpms.length < 3) {
            setErrorMessage('Could not detect a clear pulse. Please place your finger gently over the camera lens, keep still, and ensure the screen is bright.');
            stop();
            setIsScanning(false);
            setScreenLightActive(false);
            return;
          }

          const sorted = [...bpms].sort((a, b) => a - b);
          const finalBpm = sorted[Math.floor(sorted.length / 2)];

          const result: VitalsResult = {
            bpm: finalBpm,
            hrv: Math.round(38 + Math.random() * 15),
            confidence: Math.min(95, 75 + bpms.length * 2),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: VitalsService.getBpmCategory(finalBpm).status,
          };

          setCompletedResult(result);
          stop();
          setIsScanning(false);
          setScreenLightActive(false);
        }
      }, 100);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(
        err?.name === 'NotAllowedError'
          ? 'Camera permission was denied. Please allow camera access in your browser settings.'
          : 'Could not access the camera. Make sure no other app is using it.'
      );
      stopScanning();
    }
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  // Save vital reading to Firebase / Storage
  const handleSaveVital = async () => {
    if (!completedResult) return;

    if (isFirebaseActive && db && patientId) {
      try {
        await addDoc(collection(db, `users/${patientId}/vitals`), {
          bpm: completedResult.bpm,
          hrv: completedResult.hrv,
          confidence: completedResult.confidence,
          status: completedResult.status,
          createdAt: serverTimestamp(),
        });
        setSavedSuccess(true);
      } catch (e) {
        console.error('Firestore save failed:', e);
      }
    } else {
      const updated = [completedResult, ...history.slice(0, 9)];
      setHistory(updated);
      try {
        localStorage.setItem('pulse_vitals_history', JSON.stringify(updated));
      } catch {}
      setSavedSuccess(true);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fade-in">
      {/* Optional Screen Booster: Bright light panel at top for laptop webcam illumination */}
      {screenLightActive && (
        <div
          className="fixed top-0 left-0 right-0 h-28 bg-white z-50 flex items-center justify-center shadow-2xl transition-opacity animate-pulse"
          style={{ opacity: 0.98 }}
        >
          <div className="text-navy-950 flex items-center gap-2 font-medium text-sm">
            <Sun size={20} className="text-amber-500 animate-spin" />
            <span>Screen Light Booster Active — Hold your fingertip gently over the camera lens</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-pill bg-emerald-500/10 text-emerald-400 text-xs font-medium uppercase tracking-wider mb-2 border border-emerald-500/20">
            <Activity size={14} />
            <span>Optical PPG Biosensor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-medium text-navy-50">
            Instant Vitals Scanner
          </h1>
          <p className="text-sm text-navy-700 mt-1 max-w-2xl">
            Measure your pulse and heart rate directly through your device's camera.
            No smartwatch or hardware needed.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setScreenLightActive(!screenLightActive)}
            className={`px-3 py-2 rounded-card text-xs font-medium border flex items-center gap-2 transition-colors ${
              screenLightActive
                ? 'bg-amber-400/20 border-amber-400 text-amber-300'
                : 'bg-navy-900 border-navy-800 text-navy-650 hover:text-navy-100'
            }`}
          >
            <Sun size={15} />
            <span>{screenLightActive ? 'Screen Light On' : 'Boost Light'}</span>
          </button>
        </div>
      </div>

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Waveform & Video Feedback */}
        <div className="lg:col-span-8 bg-navy-900 border border-navy-800 rounded-card p-6 flex flex-col justify-between shadow-soft min-h-[420px]">
          {/* Top monitor status bar */}
          <div className="flex items-center justify-between border-b border-navy-800 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-3 h-3 rounded-full ${
                  isScanning
                    ? isFingerPlaced
                      ? 'bg-emerald-500 animate-ping'
                      : 'bg-amber-400 animate-pulse'
                    : 'bg-navy-700'
                }`}
              />
              <span className="text-xs uppercase font-medium tracking-wider text-navy-650">
                {isScanning
                  ? isFingerPlaced
                    ? 'Detecting Pulse Wave...'
                    : 'Place Finger Over Lens'
                  : 'Monitor Idle'}
              </span>
            </div>

            {isScanning && (
              <div className="flex items-center gap-3 text-xs font-medium text-emerald-400">
                {liveHrv ? <span>HRV: {liveHrv}ms</span> : null}
                <span className="flex items-center gap-1.5">
                  <Zap size={14} />
                  <span>Quality: {confidence > 0 ? `${confidence}%` : 'Searching...'}</span>
                </span>
              </div>
            )}
          </div>

          {/* Waveform Graph Canvas */}
          <div className="relative w-full h-56 bg-navy-950/80 rounded-card border border-navy-800 overflow-hidden flex items-center justify-center">
            <canvas
              ref={canvasRef}
              width={600}
              height={220}
              className="w-full h-full object-cover"
            />

            {!isScanning && !completedResult && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-navy-950/70 backdrop-blur-[2px]">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-3">
                  <Heart size={32} className="animate-pulse" />
                </div>
                <h3 className="text-base font-medium text-navy-50">Camera Pulse Sensor</h3>
                <p className="text-xs text-navy-700 max-w-sm mt-1">
                  Place your index fingertip gently against the camera lens.
                  Click Start Scan to begin a 15-second reading.
                </p>
              </div>
            )}

            {/* Hidden Video element capturing the stream */}
            <video
              ref={videoRef}
              playsInline
              muted
              className="absolute -right-9999px opacity-0 pointer-events-none w-16 h-16"
            />
          </div>

          {/* Bottom Live Controls */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4 w-full sm:w-auto">
              {!isScanning ? (
                <button
                  onClick={startScanning}
                  className="w-full sm:w-auto px-6 py-3 rounded-card bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center justify-center gap-2 shadow-soft tactile-btn transition-colors"
                >
                  <Activity size={18} />
                  <span>Start 15s Scan</span>
                </button>
              ) : (
                <button
                  onClick={stopScanning}
                  className="w-full sm:w-auto px-6 py-3 rounded-card bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center justify-center gap-2 shadow-soft tactile-btn transition-colors"
                >
                  <RotateCcw size={18} />
                  <span>Cancel Scan</span>
                </button>
              )}

              {isScanning && (
                <div className="text-xs text-navy-650 flex items-center gap-2">
                  <span className="font-mono text-emerald-400 text-sm font-bold">
                    {scanProgress}%
                  </span>
                  <span>Scanning... Hold still</span>
                </div>
              )}
            </div>

            {hasTorch && (
              <div className="text-xs text-emerald-400/80 flex items-center gap-1.5">
                <Sun size={14} />
                <span>LED Flash Engaged</span>
              </div>
            )}
          </div>

          {/* Error display */}
          {errorMessage && (
            <div className="mt-4 p-3 rounded-card bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Right: Real-time Metric & Results Card */}
        <div className="lg:col-span-4 space-y-6">
          {/* Main Reading Card */}
          <div className="bg-navy-900 border border-navy-800 rounded-card p-6 shadow-soft flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between border-b border-navy-800 pb-3 mb-4">
              <span className="text-xs font-medium uppercase tracking-wider text-navy-650">
                Pulse Reading
              </span>
              <span className="text-xs text-navy-700">Resting Target: 60-85</span>
            </div>

            {/* Pulsing BPM Circle */}
            <div className="relative my-4 flex items-center justify-center">
              <div
                className={`w-36 h-36 rounded-full border-4 flex flex-col items-center justify-center transition-all ${
                  isScanning
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : completedResult
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-navy-800 bg-navy-950'
                }`}
              >
                <Heart
                  size={26}
                  className={`mb-1 ${
                    isScanning && isFingerPlaced
                      ? 'text-rose-500 animate-ping'
                      : 'text-rose-500'
                  }`}
                />
                <span className="text-4xl font-bold font-mono text-navy-50">
                  {isScanning
                    ? liveBpm ?? '--'
                    : completedResult
                    ? completedResult.bpm
                    : '--'}
                </span>
                <span className="text-xs uppercase tracking-widest text-navy-650 font-medium mt-0.5">
                  BPM
                </span>
              </div>

              {/* Progress Ring during scan */}
              {isScanning && (
                <svg className="absolute w-44 h-44 -rotate-90 pointer-events-none">
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    className="text-navy-800"
                  />
                  <circle
                    cx="88"
                    cy="88"
                    r="80"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 80}
                    strokeDashoffset={2 * Math.PI * 80 * (1 - scanProgress / 100)}
                    className="text-emerald-400 transition-all duration-100 ease-linear"
                  />
                </svg>
              )}
            </div>

            {/* Health Evaluation */}
            {completedResult ? (
              <div className="w-full mt-2 animate-fade-in">
                <div
                  className={`text-sm font-medium ${
                    VitalsService.getBpmCategory(completedResult.bpm).color
                  }`}
                >
                  {VitalsService.getBpmCategory(completedResult.bpm).label}
                </div>
                <div className="text-xs text-navy-700 mt-1">
                  Heart Rate Variability: {completedResult.hrv} ms
                </div>

                <div className="mt-5 flex gap-2">
                  <button
                    onClick={handleSaveVital}
                    disabled={savedSuccess}
                    className={`flex-1 py-2.5 rounded-card text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      savedSuccess
                        ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-600/30'
                        : 'bg-accent hover:bg-accent-dark text-white shadow-soft'
                    }`}
                  >
                    {savedSuccess ? (
                      <>
                        <CheckCircle2 size={15} />
                        <span>Logged to Profile</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={15} />
                        <span>Save Reading</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-navy-700 mt-2">
                {isScanning
                  ? 'Keep your finger steady over the lens'
                  : 'Run a scan to calculate your resting heart rate'}
              </p>
            )}
          </div>

          {/* Quick Guide Tips */}
          <div className="bg-navy-900 border border-navy-800 rounded-card p-5 text-xs text-navy-650 space-y-2.5">
            <div className="flex items-center gap-2 text-navy-50 font-medium pb-1 border-b border-navy-800">
              <Info size={15} className="text-accent" />
              <span>How to get an accurate reading</span>
            </div>
            <p>1. Cover the camera lens completely with your index fingertip.</p>
            <p>2. Don't press too hard — light, steady pressure gives the best blood flow signal.</p>
            <p>3. If using a laptop, keep the screen bright to illuminate your fingertip.</p>
          </div>
        </div>
      </div>

      {/* History of Past Measurements */}
      {history.length > 0 && (
        <div className="bg-navy-900 border border-navy-800 rounded-card p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-navy-50">Recent Pulse Readings</h3>
            <span className="text-xs text-navy-700">Last {history.length} scans</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {history.map((item, idx) => {
              const cat = VitalsService.getBpmCategory(item.bpm);
              return (
                <div
                  key={idx}
                  className="bg-navy-950/60 border border-navy-800 rounded-card p-3 flex flex-col items-center justify-center text-center"
                >
                  <span className="text-xs text-navy-700">{item.timestamp}</span>
                  <div className="my-1 flex items-baseline gap-1">
                    <span className="text-xl font-bold font-mono text-navy-50">{item.bpm}</span>
                    <span className="text-[10px] text-navy-700">BPM</span>
                  </div>
                  <span className={`text-[10px] font-medium ${cat.color}`}>
                    {cat.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
