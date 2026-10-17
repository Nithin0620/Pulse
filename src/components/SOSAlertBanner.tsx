// PULSE — modified
import React, { useEffect, useState } from 'react';
import {
  Alert02Icon,
  CheckmarkCircle02Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  Loading03Icon,
  VolumeHighIcon,
} from 'hugeicons-react';
import { useRole } from '../context/RoleContext';
import { useSettings } from '../context/SettingsContext';
import { useSOS } from '../context/SOSContext';
import type { SosEvent, UrgencyScore } from '../context/SOSContext';

const URGENCY_PILL: Record<UrgencyScore, string> = {
  HIGH: 'bg-red-600 text-white',
  MED: 'bg-amber-500 text-white',
  LOW: 'bg-gray-400 text-white',
};

const URGENCY_LABEL = (u: UrgencyScore, lang: string): string => {
  if (lang === 'hi') {
    return u === 'HIGH' ? 'अति आपातकाल' : u === 'MED' ? 'मध्यम' : 'कम';
  }
  if (lang === 'ta') {
    return u === 'HIGH' ? 'மிக அவசரம்' : u === 'MED' ? 'நடுத்தரம்' : 'குறைந்தது';
  }
  return u;
};

const formatRelative = (ms: number, lang: string): string => {
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 60) {
    return lang === 'hi'
      ? 'अभी अभी'
      : lang === 'ta'
      ? 'இப்போதே'
      : 'just now';
  }
  const mins = Math.floor(diffSec / 60);
  if (mins < 60) {
    if (lang === 'hi') return `${mins} मिनट पहले`;
    if (lang === 'ta') return `${mins} நிமிடங்களுக்கு முன்`;
    return `${mins} min ago`;
  }
  const hrs = Math.floor(mins / 60);
  if (lang === 'hi') return `${hrs} घंटे पहले`;
  if (lang === 'ta') return `${hrs} மணி நேரத்திற்கு முன்`;
  return `${hrs} hr ago`;
};

interface SOSAlertBannerProps {
  /** Optional callback invoked when the user clicks the
   *  "x more pending" link, so a host page can scroll the SOS history
   *  feed into view. */
  onJumpToHistory?: () => void;
}

/**
 * Caregiver-only banner that surfaces the most recent unacknowledged
 * SOS event from `SOSContext`. Lives at the top of the layout (sticky)
 * and disappears once every event has been acknowledged.
 */
export const SOSAlertBanner: React.FC<SOSAlertBannerProps> = ({
  onJumpToHistory,
}) => {
  const { role } = useRole();
  const { language } = useSettings();
  const { pendingSosEvents, acknowledgeEvent } = useSOS();

  const [ackingId, setAckingId] = useState<string | null>(null);
  const [, setTick] = useState(0);
  const [expanded, setExpanded] = useState(true);

  // Keep "x min ago" current — refreshes the banner every 30s.
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  if (role !== 'caregiver' || pendingSosEvents.length === 0) return null;

  const headline: SosEvent = pendingSosEvents[0];
  const morePending = pendingSosEvents.length - 1;

  // PULSE — modified: a single source-of-truth for the recording <audio>
  // element. Cloudinary strategy fills audioURL; base64 strategy fills
  // audioBase64 (a `data:` URI). Either is a valid <audio src>.
  const audioSrc = headline.audioURL || headline.audioBase64 || '';

  const handleAck = async () => {
    setAckingId(headline.id);
    try {
      await acknowledgeEvent(headline.id);
    } finally {
      setAckingId(null);
    }
  };

  const labels = (() => {
    if (language === 'hi') {
      return {
        title: 'SOS आपातकाल',
        ack: 'स्वीकार करें',
        more: (n: number) => `${n} और लंबित →`,
        voiceNoteLabel: 'मूल वॉयस नोट',
        summaryAudioLabel: 'AI सारांश ऑडियो',
        collapse: 'छिपाएँ',
        expand: 'विवरण देखें',
      };
    }
    if (language === 'ta') {
      return {
        title: 'SOS அவசரம்',
        ack: 'ஒப்புக்கொள்',
        more: (n: number) => `${n} மேலும் நிலுவையில் →`,
        voiceNoteLabel: 'அசல் குரல் குறிப்பு',
        summaryAudioLabel: 'AI சுருக்கம் ஆடியோ',
        collapse: 'மறை',
        expand: 'விரிவாக்கு',
      };
    }
    return {
      title: 'SOS Emergency',
      ack: 'Acknowledge',
      more: (n: number) => `${n} more pending →`,
      voiceNoteLabel: 'Original voice note',
      summaryAudioLabel: 'AI summary audio',
      collapse: 'Collapse',
      expand: 'Expand',
    };
  })();

  const headlineMs = headline.timestamp.getTime();

  return (
    <div
      className="sticky top-14 z-30 bg-destructive text-destructive-foreground border-b border-red-800 shadow-sm animate-in fade-in-0 duration-150"
      role="alert"
      aria-live="assertive"
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center gap-3 px-4 lg:px-6 py-2.5 text-left tactile-btn"
        aria-expanded={expanded}
        aria-label={expanded ? labels.collapse : labels.expand}
      >
        <span className="relative inline-flex items-center justify-center w-5 h-5 shrink-0">
          <span className="absolute inset-0 rounded-full bg-white/40 animate-ping" />
          <span className="relative w-2.5 h-2.5 rounded-full bg-white" />
        </span>

        <Alert02Icon size={20} className="text-white shrink-0" />

        <div className="flex-1 min-w-0">
          <div className="text-[11px] font-medium uppercase tracking-wider text-white/80">
            {labels.title}
          </div>
          <div className="text-xs sm:text-sm font-semibold text-white truncate">
            {headline.patientName}
          </div>
        </div>

        {expanded ? (
          <ArrowUp01Icon size={18} className="text-white shrink-0" />
        ) : (
          <ArrowDown01Icon size={18} className="text-white shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="bg-red-700/90 border-t border-white/15 px-4 lg:px-6 py-3">
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${URGENCY_PILL[headline.urgencyScore]}`}
              >
                {URGENCY_LABEL(headline.urgencyScore, language)}
              </span>
              <span className="text-xs font-medium text-white/90">
                {formatRelative(headlineMs, language)}
              </span>
              <span className="text-xs font-medium text-white/70">
                {headline.language}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-medium text-white leading-snug">
              {headline.aiSummary || headline.translatedText}
            </p>

            {(audioSrc || headline.ttsAudioURL) && (
              <div className="flex flex-col sm:flex-row gap-2">
                {audioSrc && (
                  <div className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-lg p-2.5">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-white/80 mb-1.5">
                      {labels.voiceNoteLabel}
                    </div>
                    <audio
                      src={audioSrc}
                      controls
                      preload="none"
                      className="w-full h-8"
                      aria-label={labels.voiceNoteLabel}
                    />
                  </div>
                )}
                {headline.ttsAudioURL && (
                  <div className="flex-1 min-w-0 bg-white/10 border border-white/20 rounded-lg p-2.5">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-white/80 mb-1.5 flex items-center gap-1">
                      <VolumeHighIcon size={12} />
                      {labels.summaryAudioLabel}
                    </div>
                    <audio
                      src={headline.ttsAudioURL}
                      controls
                      preload="none"
                      className="w-full h-8"
                      aria-label={labels.summaryAudioLabel}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 pt-1">
              {morePending > 0 ? (
                <button
                  onClick={onJumpToHistory}
                  className="inline-flex items-center text-xs font-medium text-white/90 underline-offset-4 hover:underline"
                  aria-label={labels.more(morePending)}
                >
                  {labels.more(morePending)}
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={handleAck}
                disabled={ackingId === headline.id}
                className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-100 text-destructive font-medium px-3.5 py-1.5 rounded-lg shadow-sm tactile-btn disabled:opacity-60 text-xs self-end"
                aria-label={labels.ack}
              >
                {ackingId === headline.id ? (
                  <Loading03Icon size={16} className="animate-spin" />
                ) : (
                  <CheckmarkCircle02Icon size={16} />
                )}
                <span>{labels.ack}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SOSAlertBanner;
