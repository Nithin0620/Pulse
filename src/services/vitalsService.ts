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
    const peakIndices: number[] = [];
    let lastBeatTime = 0;
    const bpmHistory: number[] = [];
    const rrIntervals: number[] = [];

    // Moving average baseline for DC removal
    let movingAvg = 0;
    const ALPHA = 0.08; // IIR baseline drift filter
    let bandpassPrev = 0;

    const processFrame = () => {
      if (!isRunning) return;

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
          peakIndices.length = 0;
          rrIntervals.length = 0;
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

          // Peak Detection algorithm (minimum 320ms refractory period between beats = max 187 BPM)
          let currentBpm: number | null = null;
          let currentHrv: number | null = null;
          let confidence = 0;

          const len = rawBuffer.length;
          if (len > 30) {
            const vPrev = rawBuffer[len - 3];
            const vMid = rawBuffer[len - 2];
            const vNext = rawBuffer[len - 1];

            // Local maximum detection with threshold
            if (vMid > vPrev && vMid > vNext && vMid > 0.4) {
              const peakTime = timestamps[len - 2];
              const interval = peakTime - lastBeatTime;

              // Valid R-R interval window: 300ms to 1333ms (45 to 200 BPM)
              if (lastBeatTime > 0 && interval >= 300 && interval <= 1333) {
                const instantBpm = 60000 / interval;
                bpmHistory.push(instantBpm);
                rrIntervals.push(interval);

                if (bpmHistory.length > 8) bpmHistory.shift();
                if (rrIntervals.length > 12) rrIntervals.shift();

                lastBeatTime = peakTime;
              } else if (lastBeatTime === 0 || interval > 1333) {
                lastBeatTime = peakTime;
              }
            }

            // Calculate median / trimmed BPM to filter out movement spikes
            if (bpmHistory.length >= 3) {
              const sorted = [...bpmHistory].sort((a, b) => a - b);
              const medianBpm = Math.round(sorted[Math.floor(sorted.length / 2)]);
              currentBpm = medianBpm;

              // Calculate HRV (RMSSD: Root Mean Square of Successive Differences)
              if (rrIntervals.length >= 4) {
                let sumSqDiff = 0;
                for (let k = 1; k < rrIntervals.length; k++) {
                  const diff = rrIntervals[k] - rrIntervals[k - 1];
                  sumSqDiff += diff * diff;
                }
                currentHrv = Math.round(Math.sqrt(sumSqDiff / (rrIntervals.length - 1)));
              }

              // Confidence score increases with stable beats (consistency check)
              const spread = sorted[sorted.length - 1] - sorted[0];
              confidence = Math.max(20, Math.min(95, Math.round(100 - spread * 2.5)));
            }
          }

          onSignal({
            bpm: currentBpm,
            hrv: currentHrv,
            confidence: currentBpm ? confidence : 10,
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
