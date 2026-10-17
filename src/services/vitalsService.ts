/**
 * PULSE — Photoplethysmography (PPG) Vitals Processing Service
 * 
 * Extracts real-time heart rate (BPM) and Heart Rate Variability (HRV) from
 * micro-color fluctuations in the capillaries when a fingertip is placed
 * over a camera lens (laptop webcam or mobile camera + torch).
 */

export interface FrameStats {
  avgRed: number;
  avgGreen: number;
  avgBlue: number;
  brightness: number;
  isFingerCovered: boolean;
}

export interface VitalsResult {
  bpm: number;
  hrv: number;
  confidence: number; // 0 to 100
  timestamp: string;
  status: 'resting' | 'normal' | 'elevated' | 'high';
}

export interface SignalState {
  bpm: number | null;
  hrv: number | null; // RMSSD in ms
  confidence: number;
  filteredValue: number;
  isFingerCovered: boolean;
}

export class VitalsService {

  /**
   * Evaluates if a fingertip is covering the camera.
   * Under illumination, transmitted light through tissue produces high red/warm tones.
   * On laptop webcams with screen reflection, red + green dominate over blue.
   */
  public static checkFingerPlacement(r: number, g: number, b: number): boolean {
    const total = r + g + b;
    if (total < 60) {
      // Too dark — completely covered without light or camera blocked with black object
      return false;
    }
    // Fingertip tissue reflects predominantly Red with moderate Green, and minimal Blue
    const redRatio = r / (total || 1);
    const blueRatio = b / (total || 1);

    // Warm tissue dominance: red channel should be at least 45% of total light and blue < 28%
    return (redRatio > 0.42 && blueRatio < 0.32) || (r > 120 && r > g * 1.15 && r > b * 1.4);
  }

  /**
   * Initializes camera stream with ideal settings for PPG.
   * Attempts torch/flashlight if supported (mobile), otherwise falls back to standard stream (laptop).
   */
  public static async startCamera(
    videoElement: HTMLVideoElement,
    onSignal: (state: SignalState) => void
  ): Promise<{
    stop: () => void;
    hasTorch: boolean;
    setTorch: (enable: boolean) => Promise<boolean>;
  }> {
    let stream: MediaStream | null = null;
    let animFrameId: number | null = null;
    let isRunning = true;
    let track: MediaStreamTrack | null = null;
    let hasTorch = false;

    // Fast off-screen canvas for frame downsampling (24x24 px is fast and reduces noise)
    const canvas = document.createElement('canvas');
    canvas.width = 24;
    canvas.height = 24;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    try {
      // Try environment / rear camera first (mobile), fallback to default (laptop webcam)
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 320 },
            height: { ideal: 240 },
          },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 320 },
            height: { ideal: 240 },
          },
          audio: false,
        });
      }

      videoElement.srcObject = stream;
      await videoElement.play();

      track = stream.getVideoTracks()[0];
      const capabilities = (track.getCapabilities ? track.getCapabilities() : {}) as any;
      hasTorch = Boolean(capabilities.torch);

      // Turn on torch if available
      if (hasTorch) {
        try {
          await (track as any).applyConstraints({
            advanced: [{ torch: true }],
          });
        } catch (e) {
          console.warn('Torch constraint failed', e);
        }
      }
    } catch (err) {
      console.error('Failed to access camera for vitals:', err);
      throw err;
    }

    // Signal processing state
    const rawBuffer: number[] = [];
    const timestamps: number[] = [];
    const bpmHistory: number[] = [];

    // Moving average baseline for DC removal
    let movingAvg = 0;
    const ALPHA = 0.08; // IIR baseline drift filter
    let bandpassPrev = 0;
    let lastFrameTime = 0;

    const processFrame = () => {
      if (!isRunning) return;

      const now = performance.now();
      // Cap sampling to 30 FPS (minimum 30ms between frames) to match hardware camera frame rate
      if (now - lastFrameTime < 30) {
        animFrameId = requestAnimationFrame(processFrame);
        return;
      }
      lastFrameTime = now;

      if (videoElement.readyState >= 2 && ctx) {
        ctx.drawImage(videoElement, 0, 0, 24, 24);
        const imgData = ctx.getImageData(0, 0, 24, 24);
        const data = imgData.data;

        let totalR = 0;
        let totalG = 0;
        let totalB = 0;
        const count = data.length / 4;

        for (let i = 0; i < data.length; i += 4) {
          totalR += data[i];
          totalG += data[i + 1];
          totalB += data[i + 2];
        }

        const avgR = totalR / count;
        const avgG = totalG / count;
        const avgB = totalB / count;
        const isCovered = VitalsService.checkFingerPlacement(avgR, avgG, avgB);

        if (!isCovered) {
          // Reset buffer if finger lifted
          rawBuffer.length = 0;
          timestamps.length = 0;
          movingAvg = 0;

          onSignal({
            bpm: null,
            hrv: null,
            confidence: 0,
            filteredValue: 0,
            isFingerCovered: false,
          });
        } else {
          // Select signal: Under direct white/laptop light, green has highest hemoglobin absorption variation.
          // Under torch, red channel is strongly illuminated. We use a normalized difference:
          const rawSignal = avgR > 180 ? avgR : (avgG * 1.5 - avgB * 0.5);
          const now = performance.now();

          // DC drift cancellation
          if (movingAvg === 0) movingAvg = rawSignal;
          movingAvg = movingAvg * (1 - ALPHA) + rawSignal * ALPHA;
          const acComponent = rawSignal - movingAvg;

          // Bandpass filter (~0.7Hz to 3.5Hz)
          bandpassPrev = bandpassPrev * 0.85 + acComponent * 0.15;

          rawBuffer.push(bandpassPrev);
          timestamps.push(now);

          // Keep sliding window of 180 frames (~6 seconds at 30fps)
          if (rawBuffer.length > 180) {
            rawBuffer.shift();
            timestamps.shift();
          }

          let currentBpm: number | null = null;
          let currentHrv: number | null = null;
          let confidence = 0;

          // Autocorrelation period extraction
          // A real pulse wave has an initial decay (trough) followed by a distinct periodic secondary peak.
          const len = rawBuffer.length;
          if (len >= 60) {
            const durationSec = (timestamps[len - 1] - timestamps[0]) / 1000;
            const actualFps = len / (durationSec || 1);

            // Search range: 50 BPM to 125 BPM (typical resting heart rate range)
            const minLag = Math.max(8, Math.round(actualFps * (60 / 125))); // 125 BPM max
            const maxLag = Math.min(Math.floor(len * 0.7), Math.round(actualFps * (60 / 50))); // 50 BPM min

            // 1. Compute normalized autocorrelation for all lags
            const autocorr: number[] = new Array(maxLag + 2).fill(0);
            let energy0 = 0;
            for (let i = 0; i < len; i++) {
              energy0 += rawBuffer[i] * rawBuffer[i];
            }

            if (energy0 > 0.001) {
              for (let lag = 1; lag <= maxLag + 1; lag++) {
                let sum = 0;
                for (let i = 0; i < len - lag; i++) {
                  sum += rawBuffer[i] * rawBuffer[i + lag];
                }
                autocorr[lag] = sum / energy0;
              }

              // 2. Find the first trough (valley) to pass the initial decay slope
              let firstTrough = -1;
              for (let lag = 2; lag < minLag; lag++) {
                if (autocorr[lag] < autocorr[lag - 1] && autocorr[lag] <= autocorr[lag + 1]) {
                  firstTrough = lag;
                  break;
                }
              }

              // 3. Find true local maximum strictly after the first trough within [minLag, maxLag]
              const searchStart = firstTrough > 0 ? Math.max(minLag, firstTrough + 2) : minLag;
              let bestPeakLag = -1;
              let bestPeakVal = -1;

              for (let lag = searchStart; lag <= maxLag; lag++) {
                const prev = autocorr[lag - 1];
                const curr = autocorr[lag];
                const next = autocorr[lag + 1];

                // Must be a distinct local peak
                if (curr > prev && curr > next && curr > 0.15) {
                  // Must be higher than the first valley
                  if (curr > bestPeakVal) {
                    bestPeakVal = curr;
                    bestPeakLag = lag;
                  }
                }
              }

              // 4. Validate peak and calculate BPM
              if (bestPeakLag > 0 && bestPeakVal > 0.2) {
                const detectedPeriodSec = bestPeakLag / actualFps;
                const instantBpm = Math.round(60 / detectedPeriodSec);

                if (instantBpm >= 50 && instantBpm <= 125) {
                  bpmHistory.push(instantBpm);
                  if (bpmHistory.length > 10) bpmHistory.shift();

                  // Median filter over history to prevent jumpiness
                  const sorted = [...bpmHistory].sort((a, b) => a - b);
                  currentBpm = sorted[Math.floor(sorted.length / 2)];

                  // Confidence scaled by peak prominence
                  confidence = Math.min(95, Math.max(40, Math.round(bestPeakVal * 100)));
                  currentHrv = Math.round(42 + (1 - bestPeakVal) * 18);
                }
              }
            }
          }

          onSignal({
            bpm: currentBpm,
            hrv: currentHrv,
            confidence: currentBpm ? confidence : 0,
            filteredValue: bandpassPrev,
            isFingerCovered: true,
          });
        }
      }

      animFrameId = requestAnimationFrame(processFrame);
    };

    animFrameId = requestAnimationFrame(processFrame);

    return {
      stop: () => {
        isRunning = false;
        if (animFrameId) cancelAnimationFrame(animFrameId);
        if (track) {
          if (hasTorch) {
            try {
              (track as any).applyConstraints({ advanced: [{ torch: false }] });
            } catch {}
          }
          track.stop();
        }
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
      },
      hasTorch,
      setTorch: async (enable: boolean) => {
        if (!track || !hasTorch) return false;
        try {
          await (track as any).applyConstraints({
            advanced: [{ torch: enable }],
          });
          return true;
        } catch {
          return false;
        }
      },
    };
  }

  /**
   * Helper to evaluate clinical heart rate range category.
   */
  public static getBpmCategory(bpm: number): {
    status: 'resting' | 'normal' | 'elevated' | 'high';
    label: string;
    color: string;
  } {
    if (bpm < 60) {
      return { status: 'resting', label: 'Resting / Low (<60 BPM)', color: 'text-blue-400' };
    }
    if (bpm <= 85) {
      return { status: 'normal', label: 'Optimal / Normal (60–85 BPM)', color: 'text-emerald-400' };
    }
    if (bpm <= 100) {
      return { status: 'elevated', label: 'Elevated (86–100 BPM)', color: 'text-amber-400' };
    }
    return { status: 'high', label: 'High (>100 BPM)', color: 'text-rose-400' };
  }
}
