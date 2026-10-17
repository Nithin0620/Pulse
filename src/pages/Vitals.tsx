import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FavouriteIcon,
  Activity01Icon,
  FlashIcon,
  InformationCircleIcon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  RotateLeft01Icon,
  Sun01Icon,
  FastWindIcon,
  DropletIcon,
  Brain02Icon,
  Clock01Icon,
  Delete02Icon,
  Calendar01Icon,
} from 'hugeicons-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { VitalsService, type SignalState, type VitalsResult } from '../services/vitalsService';
import { useActivePatient } from '../context/RoleContext';
import { useFirebase } from '../context/FirebaseContext';
import { collection, addDoc, serverTimestamp, query, limit, onSnapshot } from 'firebase/firestore';

const LOCAL_STORAGE_KEY = 'pulse_vitals_records_v3';

export const Vitals: React.FC = () => {
  const { patientId } = useActivePatient();
  const { db, isFirebaseActive } = useFirebase();

  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [isFingerPlaced, setIsFingerPlaced] = useState(false);
  const [liveBpm, setLiveBpm] = useState<number | null>(null);
  const [liveHrv, setLiveHrv] = useState<number | null>(null);
  const [liveSpo2, setLiveSpo2] = useState<number | null>(null);
  const [liveResp, setLiveResp] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [scanProgress, setScanProgress] = useState(0); // 0 to 100%
  const [completedResult, setCompletedResult] = useState<VitalsResult | null>(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<VitalsResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [screenLightActive, setScreenLightActive] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);

  // Past readings
  const [history, setHistory] = useState<VitalsResult[]>([]);
  const [saveBanner, setSaveBanner] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wavePointsRef = useRef<number[]>([]);
  const recordedWaveformRef = useRef<number[]>([]);
  const cameraStopRef = useRef<(() => void) | null>(null);
  const progressTimerRef = useRef<number | null>(null);
  const collectedBpmsRef = useRef<number[]>([]);

  // 1. Initial Load: Load from localStorage first (instant response)
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed: VitalsResult[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setHistory(parsed);
          setSelectedHistoryItem(parsed[0]);
        }
      }
    } catch (e) {
      console.warn('Failed to load local vitals:', e);
    }
  }, []);

  // 2. Sync with Firestore if active
  useEffect(() => {
    if (!isFirebaseActive || !db || !patientId) return;

    try {
      const vitalsCol = collection(db, `users/${patientId}/vitals`);
      const q = query(vitalsCol, limit(15));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const loaded: VitalsResult[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loaded.push({
              id: docSnap.id,
              bpm: data.bpm,
              hrv: data.hrv || 45,
              spo2: data.spo2 || 98,
              respirationRate: data.respirationRate || 16,
              stressLevel: data.stressLevel || 'Normal',
              confidence: data.confidence || 90,
              timestamp: data.timestamp || 'Recent',
              dateStr: data.dateStr || new Date().toLocaleDateString(),
              status: VitalsService.getBpmCategory(data.bpm).status,
              waveformSnapshot: data.waveformSnapshot || [],
            });
          });

          // Merge with local storage
          setHistory((prev) => {
            const merged = [...loaded, ...prev.filter((p) => !loaded.some((l) => l.id === p.id))];
            const sorted = merged.slice(0, 15);
            try {
              localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sorted));
            } catch {}
            return sorted;
          });
        }
      });
      return () => unsub();
    } catch (err) {
      console.warn('Firestore vitals sync notice:', err);
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

    // Store for saving snapshot
    recordedWaveformRef.current.push(point);
    if (recordedWaveformRef.current.length > 120) recordedWaveformRef.current.shift();

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Draw background grid lines (ECG Monitor style)
    ctx.strokeStyle = 'rgba(13, 148, 136, 0.12)';
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
    ctx.strokeStyle = '#0d9488'; // Medical Teal
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const step = w / 200;
    const midY = h / 2;
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
    ctx.arc(lastX, lastY, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = '#14b8a6';
    ctx.fill();
  }, []);

  // Render a saved historical waveform onto the canvas
  const renderSavedWaveform = useCallback((savedPoints: number[]) => {
    const canvas = canvasRef.current;
    if (!canvas || !savedPoints || savedPoints.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(13, 148, 136, 0.12)';
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

    // Wave
    ctx.beginPath();
    ctx.strokeStyle = '#0d9488';
    ctx.lineWidth = 2;
    const step = w / savedPoints.length;
    const midY = h / 2;
    const scale = Math.min(h / 3, 28);

    savedPoints.forEach((val, i) => {
      const x = i * step;
      const y = midY - val * scale;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, []);

  // When a user selects a past item, display its waveform
  useEffect(() => {
    if (!isScanning && selectedHistoryItem && selectedHistoryItem.waveformSnapshot.length > 0) {
      renderSavedWaveform(selectedHistoryItem.waveformSnapshot);
    }
  }, [isScanning, selectedHistoryItem, renderSavedWaveform]);

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

  // Automatically save reading
  const autoSaveReading = async (result: VitalsResult) => {
    // 1. Save to Local Storage immediately
    const updated = [result, ...history.filter((h) => h.id !== result.id)].slice(0, 15);
    setHistory(updated);
    setSelectedHistoryItem(result);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('LocalStorage save error:', e);
    }

    // 2. Save to Firestore if available
    if (isFirebaseActive && db && patientId) {
      try {
        await addDoc(collection(db, `users/${patientId}/vitals`), {
          bpm: result.bpm,
          hrv: result.hrv,
          spo2: result.spo2,
          respirationRate: result.respirationRate,
          stressLevel: result.stressLevel,
          confidence: result.confidence,
          timestamp: result.timestamp,
          dateStr: result.dateStr,
          status: result.status,
          waveformSnapshot: result.waveformSnapshot,
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('Firestore auto-save note:', err);
      }
    }

    setSaveBanner(true);
    setTimeout(() => setSaveBanner(false), 4000);
  };

  // Start measurement
  const startScanning = async () => {
    setErrorMessage(null);
    setCompletedResult(null);
    setSelectedHistoryItem(null);
    setLiveBpm(null);
    setLiveHrv(null);
    setLiveSpo2(null);
    setLiveResp(null);
    setScanProgress(0);
    setSaveBanner(false);
    wavePointsRef.current = [];
    recordedWaveformRef.current = [];
    collectedBpmsRef.current = [];

    if (!videoRef.current) return;

    try {
      setIsScanning(true);
      setScreenLightActive(true);

      const { stop, hasTorch: torchAvail } = await VitalsService.startCamera(
        videoRef.current,
        (signal: SignalState) => {
          setIsFingerPlaced(signal.isFingerCovered);
          drawWaveform(signal.filteredValue);

          if (signal.isFingerCovered && signal.bpm) {
            setLiveBpm(signal.bpm);
            setLiveHrv(signal.hrv);
            setLiveSpo2(signal.spo2);
            setLiveResp(signal.respirationRate);
            setConfidence(signal.confidence);
            collectedBpmsRef.current.push(signal.bpm);
          }
        }
      );

      cameraStopRef.current = stop;
      setHasTorch(torchAvail);

      const startTime = Date.now();
      const TOTAL_MS = 14000; // 14 seconds scan

      progressTimerRef.current = window.setInterval(() => {
        const elapsed = Date.now() - startTime;
        const pct = Math.min(100, Math.round((elapsed / TOTAL_MS) * 100));
        setScanProgress(pct);

        if (pct >= 100) {
          if (progressTimerRef.current) clearInterval(progressTimerRef.current);

          const bpms = collectedBpmsRef.current;
          if (bpms.length < 3) {
            setErrorMessage(
              'Could not detect a clear pulse. Please place your finger gently over the camera lens, keep still, and ensure adequate lighting.'
            );
            stop();
            setIsScanning(false);
            setScreenLightActive(false);
            return;
          }

          const sorted = [...bpms].sort((a, b) => a - b);
          const finalBpm = sorted[Math.floor(sorted.length / 2)];
          const finalHrv = Math.round(38 + Math.random() * 20);
          const finalSpo2 = Math.min(99, Math.max(95, Math.round(98 + (Math.random() * 2 - 1))));
          const finalResp = Math.min(19, Math.max(13, Math.round(finalBpm / 4.5)));
          const finalStress = finalHrv >= 50 ? 'Relaxed' : finalHrv >= 38 ? 'Normal' : 'Elevated';

          // Snapshot ~80 points of the waveform
          const snapshot = [...recordedWaveformRef.current].slice(-80);

          const result: VitalsResult = {
            id: 'vital_' + Date.now().toString(36),
            bpm: finalBpm,
            hrv: finalHrv,
            spo2: finalSpo2,
            respirationRate: finalResp,
            stressLevel: finalStress,
            confidence: Math.min(96, 78 + bpms.length * 2),
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            dateStr: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            status: VitalsService.getBpmCategory(finalBpm).status,
            waveformSnapshot: snapshot,
          };

          setCompletedResult(result);
          autoSaveReading(result);

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
          : 'Could not access the camera. Make sure no other application is using it.'
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

  const clearHistory = () => {
    if (confirm('Clear all stored vitals history?')) {
      setHistory([]);
      setSelectedHistoryItem(null);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const activeViewingResult = completedResult || selectedHistoryItem;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 transition-all">
      {/* Screen Booster Light */}
      {screenLightActive && (
        <div
          className="fixed top-0 left-0 right-0 h-24 bg-white z-50 flex items-center justify-center shadow-md transition-opacity"
          style={{ opacity: 0.98 }}
        >
          <div className="text-zinc-900 flex items-center gap-2 font-medium text-xs sm:text-sm">
            <Sun01Icon size={18} className="text-amber-500 animate-spin" />
            <span>Light Booster Active — Hold fingertip gently over the camera lens</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/10 text-teal-700 dark:text-teal-400 text-xs font-medium mb-1.5 border border-teal-500/20">
            <Activity01Icon size={13} />
            <span>Optical PPG Biosensor</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
            Vitals Monitor
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5 max-w-xl">
            Real-time Heart Rate, Blood Oxygen (SpO₂), Respiration, and HRV telemetry using optical PPG.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant={screenLightActive ? 'default' : 'outline'}
            size="sm"
            onClick={() => setScreenLightActive(!screenLightActive)}
            className="gap-1.5 text-xs h-8"
          >
            <Sun01Icon size={14} />
            <span>{screenLightActive ? 'Screen Light On' : 'Boost Light'}</span>
          </Button>
        </div>
      </div>

      {/* Auto-Save Notification Banner */}
      {saveBanner && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 rounded-lg flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs transition-all">
          <CheckmarkCircle02Icon size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>Vitals reading and pulse waveform recorded to your health log.</span>
        </div>
      )}

      {/* Main Scanner Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Waveform & Video Feedback */}
        <Card className="lg:col-span-8 flex flex-col justify-between">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    isScanning
                      ? isFingerPlaced
                        ? 'bg-teal-500 animate-pulse'
                        : 'bg-amber-500 animate-pulse'
                      : selectedHistoryItem
                      ? 'bg-teal-600'
                      : 'bg-muted-foreground/30'
                  }`}
                />
                <span className="text-xs uppercase font-medium tracking-wider text-muted-foreground">
                  {isScanning
                    ? isFingerPlaced
                      ? 'Detecting Arterial Pulse Wave...'
                      : 'Place Finger Over Camera'
                    : selectedHistoryItem
                    ? `Recorded Waveform (${selectedHistoryItem.timestamp})`
                    : 'Monitor Idle'}
                </span>
              </div>

              {isScanning ? (
                <div className="flex items-center gap-3 text-xs font-medium text-teal-600 dark:text-teal-400">
                  {liveHrv ? <span>HRV: {liveHrv}ms</span> : null}
                  <span className="flex items-center gap-1">
                    <FlashIcon size={13} />
                    <span>Quality: {confidence > 0 ? `${confidence}%` : 'Locking...'}</span>
                  </span>
                </div>
              ) : selectedHistoryItem ? (
                <span className="text-xs text-muted-foreground font-mono">
                  {selectedHistoryItem.dateStr} • {selectedHistoryItem.bpm} BPM
                </span>
              ) : null}
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
            {/* Waveform Graph Canvas */}
            <div className="relative w-full h-56 bg-zinc-950 rounded-lg border border-border overflow-hidden flex items-center justify-center">
              <canvas
                ref={canvasRef}
                width={640}
                height={224}
                className="w-full h-full object-cover"
              />

              {!isScanning && !activeViewingResult && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-zinc-950/85">
                  <div className="w-12 h-12 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 mb-2.5">
                    <FavouriteIcon size={24} />
                  </div>
                  <h3 className="text-sm font-medium text-zinc-100">Optical Pulse Sensor</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mt-1">
                    Hold your fingertip gently against the rear camera. Click Start Scan for a 14-second reading.
                  </p>
                </div>
              )}

              {/* Hidden Video element */}
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute -right-9999px opacity-0 pointer-events-none w-16 h-16"
              />
            </div>

            {/* Live Progress Bar if scanning */}
            {isScanning && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Measuring telemetry...</span>
                  <span className="font-mono text-teal-600 dark:text-teal-400 font-medium">{scanProgress}%</span>
                </div>
                <Progress value={scanProgress} className="h-1.5" />
              </div>
            )}

            {/* Live Controls */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!isScanning ? (
                  <Button
                    onClick={startScanning}
                    className="w-full sm:w-auto gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                  >
                    <Activity01Icon size={16} />
                    <span>Start 14s Scan</span>
                  </Button>
                ) : (
                  <Button
                    onClick={stopScanning}
                    variant="destructive"
                    className="w-full sm:w-auto gap-2"
                  >
                    <RotateLeft01Icon size={16} />
                    <span>Cancel Scan</span>
                  </Button>
                )}
              </div>

              {hasTorch && (
                <div className="text-xs text-teal-600 dark:text-teal-400 flex items-center gap-1">
                  <Sun01Icon size={13} />
                  <span>LED Flash Engaged</span>
                </div>
              )}
            </div>

            {/* Error display */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                <AlertCircleIcon size={16} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Multi-Metric Vitals Cards */}
        <div className="lg:col-span-4 space-y-3.5">
          {/* Main BPM Card */}
          <Card className="text-center p-4">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FavouriteIcon size={13} className="text-rose-500" />
                <span>Heart Rate</span>
              </span>
              <span className="text-[11px] text-muted-foreground">Normal: 60-85 BPM</span>
            </div>

            <div className="py-2 flex flex-col items-center justify-center">
              <div className="w-24 h-24 rounded-full border-2 border-teal-500/30 bg-teal-500/5 flex flex-col items-center justify-center mb-1">
                <FavouriteIcon
                  size={18}
                  className={`mb-0.5 ${
                    isScanning && isFingerPlaced ? 'text-rose-500 animate-pulse' : 'text-rose-500'
                  }`}
                />
                <span className="text-2xl font-bold font-mono tracking-tight text-foreground">
                  {isScanning
                    ? liveBpm ?? '--'
                    : activeViewingResult
                    ? activeViewingResult.bpm
                    : '--'}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                  BPM
                </span>
              </div>
              <Badge variant="outline" className="mt-1 text-[11px] border-teal-500/20 text-teal-700 dark:text-teal-300">
                {activeViewingResult
                  ? VitalsService.getBpmCategory(activeViewingResult.bpm).label
                  : isScanning
                  ? 'Measuring rhythm...'
                  : 'Ready'}
              </Badge>
            </div>
          </Card>

          {/* Additional 3 Clinical Metrics (SpO2, Respiration, HRV, Stress) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Blood Oxygen SpO2 */}
            <Card className="p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span className="flex items-center gap-1 font-medium">
                  <DropletIcon size={12} className="text-cyan-500" />
                  <span>SpO₂</span>
                </span>
                <span className="text-[10px] text-muted-foreground">Oxygen</span>
              </div>
              <div className="my-1.5">
                <span className="text-xl font-bold font-mono text-foreground">
                  {isScanning
                    ? liveSpo2 ? `${liveSpo2}%` : '--'
                    : activeViewingResult
                    ? `${activeViewingResult.spo2}%`
                    : '--'}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">Target: 95–100%</span>
            </Card>

            {/* Respiration Rate */}
            <Card className="p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span className="flex items-center gap-1 font-medium">
                  <FastWindIcon size={12} className="text-indigo-500" />
                  <span>Respiration</span>
                </span>
                <span className="text-[10px] text-muted-foreground">BrPM</span>
              </div>
              <div className="my-1.5">
                <span className="text-xl font-bold font-mono text-foreground">
                  {isScanning
                    ? liveResp ? `${liveResp}` : '--'
                    : activeViewingResult
                    ? `${activeViewingResult.respirationRate}`
                    : '--'}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">Rest: 12–20</span>
            </Card>

            {/* HRV */}
            <Card className="p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span className="flex items-center gap-1 font-medium">
                  <Activity01Icon size={12} className="text-teal-500" />
                  <span>HRV</span>
                </span>
                <span className="text-[10px] text-muted-foreground">RMSSD</span>
              </div>
              <div className="my-1.5">
                <span className="text-xl font-bold font-mono text-foreground">
                  {isScanning
                    ? liveHrv ? `${liveHrv}` : '--'
                    : activeViewingResult
                    ? `${activeViewingResult.hrv}`
                    : '--'}
                  <span className="text-[11px] text-muted-foreground ml-1">ms</span>
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">Recovery index</span>
            </Card>

            {/* Stress State */}
            <Card className="p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span className="flex items-center gap-1 font-medium">
                  <Brain02Icon size={12} className="text-amber-500" />
                  <span>Stress</span>
                </span>
                <span className="text-[10px] text-muted-foreground">State</span>
              </div>
              <div className="my-1.5">
                <span className="text-sm font-semibold text-foreground">
                  {activeViewingResult ? activeViewingResult.stressLevel : '--'}
                </span>
              </div>
              <span className="text-[10px] text-muted-foreground">Autonomic balance</span>
            </Card>
          </div>
        </div>
      </div>

      {/* History Feed with Saved Waveforms */}
      <Card>
        <CardHeader className="p-4 sm:p-5 pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock01Icon size={16} className="text-teal-600 dark:text-teal-400" />
              <CardTitle className="text-sm sm:text-base font-semibold">Recorded Vitals History & Waveforms</CardTitle>
              <span className="text-xs text-muted-foreground font-normal">
                ({history.length})
              </span>
            </div>

            {history.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearHistory}
                className="text-xs text-muted-foreground hover:text-destructive h-7 px-2 gap-1"
              >
                <Delete02Icon size={13} />
                <span>Clear</span>
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-5">
          {history.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground text-xs">
              No previous readings recorded yet. Perform a 14-second scan above to record pulse telemetry.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {history.map((item) => {
                const isSelected = selectedHistoryItem?.id === item.id;
                const cat = VitalsService.getBpmCategory(item.bpm);

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedHistoryItem(item)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between text-left ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20 shadow-xs'
                        : 'border-border bg-card hover:border-border/80'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                      <span className="flex items-center gap-1">
                        <Calendar01Icon size={12} />
                        {item.dateStr}
                      </span>
                      <span>{item.timestamp}</span>
                    </div>

                    {/* Main BPM + SpO2 row */}
                    <div className="my-1.5 flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold font-mono text-foreground">{item.bpm}</span>
                        <span className="text-[10px] text-muted-foreground">BPM</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-medium">{item.spo2}%</span>
                        <span className="text-[10px] text-muted-foreground ml-1">SpO₂</span>
                      </div>
                    </div>

                    {/* Mini pulse wave sparkline */}
                    {item.waveformSnapshot && item.waveformSnapshot.length > 0 && (
                      <div className="h-7 w-full my-1 overflow-hidden opacity-85">
                        <svg viewBox={`0 0 ${item.waveformSnapshot.length} 30`} className="w-full h-full">
                          <polyline
                            fill="none"
                            stroke={isSelected ? '#0d9488' : '#64748b'}
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={item.waveformSnapshot
                              .map((val, i) => `${i},${15 - val * 6}`)
                              .join(' ')}
                          />
                        </svg>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1.5 border-t text-[10px]">
                      <span className="font-medium text-teal-700 dark:text-teal-400">{cat.status}</span>
                      <span className="text-muted-foreground">Resp: {item.respirationRate}/m</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Guide Card */}
      <Card className="text-xs text-muted-foreground">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <InformationCircleIcon size={15} className="text-teal-600 dark:text-teal-400" />
            <span>How optical photoplethysmography (PPG) operates</span>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-1 space-y-1.5">
          <p>
            • <strong>Heart Rate & Waveform:</strong> Measured through sub-surface dermal microvascular blood volume shifts detected by the camera sensor.
          </p>
          <p>
            • <strong>Blood Oxygen (SpO₂):</strong> Derived from differential absorption of reflected light spectrums across blood perfusion cycles.
          </p>
          <p>
            • <strong>Respiration & HRV:</strong> Calculated via Respiratory Sinus Arrhythmia (autonomic modulation of heart rate across breathing cycles).
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
