import React, { useEffect, useRef, useState } from 'react';
import {
  Medicine01Icon,
  Alert02Icon,
  Note01Icon,
  Clock01Icon,
  VolumeHighIcon,
  Loading03Icon,
  Cancel01Icon,
  RefreshIcon,
  SparklesIcon,
  AlertCircleIcon,
} from 'hugeicons-react';
import { useSettings } from '../context/SettingsContext';
import { useActivePatient } from '../context/RoleContext';
import { SarvamService } from '../services/sarvamService';
import {
  flattenMedicineInfo,
  loadMedicineInfo,
  type MedicineInfo,
} from '../services/medicineInfoService';

interface MedicineInfoPanelProps {
  medicineName: string | null;
  onClose: () => void;
}

const ANIM_MS = 250;

export const MedicineInfoPanel: React.FC<MedicineInfoPanelProps> = ({
  medicineName,
  onClose,
}) => {
  const { language } = useSettings();
  const { patientId } = useActivePatient();

  const [info, setInfo] = useState<MedicineInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [cached, setCached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speaking, setSpeaking] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (medicineName) {
      if (closeTimerRef.current) {
        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
      }
      setMounted(true);
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    } else if (mounted) {
      setVisible(false);
      closeTimerRef.current = window.setTimeout(() => {
        setMounted(false);
        setInfo(null);
        setError(null);
        setSpeaking(false);
      }, ANIM_MS);
    }
  }, [medicineName]);

  useEffect(() => {
    if (!medicineName || !mounted) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await loadMedicineInfo(patientId || 'anonymous', medicineName, language);
        if (cancelled) return;
        setInfo(res.info);
        setCached(res.cached);
      } catch (err: any) {
        if (cancelled) return;
        console.error('loadMedicineInfo failed:', err);
        setError(err?.message || 'Could not fetch medicine details.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [medicineName, language, patientId, mounted]);

  const handleRefresh = async () => {
    if (!medicineName || refreshing) return;
    setRefreshing(true);
    setError(null);
    try {
      const res = await loadMedicineInfo(patientId || 'anonymous', medicineName, language, { forceRefresh: true });
      setInfo(res.info);
      setCached(res.cached);
    } catch (err: any) {
      console.error('refresh failed:', err);
      setError(err?.message || 'Could not refresh information.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSpeak = async () => {
    if (!info) return;
    if (speaking) {
      setSpeaking(false);
      return;
    }
    const script = flattenMedicineInfo(info);
    if (!script) return;

    setSpeaking(true);
    try {
      await SarvamService.textToSpeech(script, language);
    } catch (err) {
      console.warn('TTS playback failed:', err);
    } finally {
      setSpeaking(false);
    }
  };

  const labels = (() => {
    if (language === 'hi') {
      return {
        title: 'दवा विवरण',
        subtitle: 'AI-संचालित चिकित्सीय सारांश',
        cachedTag: 'कैश किया',
        freshTag: 'नया',
        refresh: 'रिफ्रेश करें',
        close: 'बंद करें',
        speak: 'विवरण सुनें',
        stopSpeak: 'रोकें',
        purpose: 'उपयोग एवं उद्देश्य',
        sideEffects: 'संभावित दुष्प्रभाव',
        instructions: 'लेने का तरीका',
        missedDose: 'खुराक छूट जाने पर',
        disclaimer: 'यह जानकारी केवल मार्गदर्शन के लिए है। किसी भी बदलाव से पहले अपने चिकित्सक से परामर्श लें।',
        loading: 'चिकित्सीय जानकारी लोड हो रही है…',
        error: 'जानकारी लोड करने में असमर्थ।',
      };
    }
    return {
      title: 'Medicine Information',
      subtitle: 'AI-assisted clinical overview',
      cachedTag: 'Cached',
      freshTag: 'Live',
      refresh: 'Refresh',
      close: 'Close',
      speak: 'Listen Aloud',
      stopSpeak: 'Stop',
      purpose: 'Usage & Purpose',
      sideEffects: 'Possible Side Effects',
      instructions: 'Directions for Use',
      missedDose: 'Missed Dose Protocol',
      disclaimer: 'For reference only. Always follow your prescribing doctor’s guidance.',
      loading: 'Loading clinical intelligence…',
      error: 'Unable to load medicine details.',
    };
  })();

  if (!mounted) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="medicine-info-title"
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-opacity duration-200 ${
        visible ? 'opacity-100 bg-black/40 backdrop-blur-sm' : 'opacity-0 pointer-events-none'
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-lifted flex flex-col max-h-[85vh] transition-transform duration-200 ${
          visible ? 'translate-y-0' : 'translate-y-6'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-card">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Medicine01Icon size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="medicine-info-title" className="text-sm font-semibold text-foreground truncate">
                {medicineName}
              </h2>
              {info && !loading && (
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-primary/20 bg-primary/10 text-primary">
                  <SparklesIcon size={9} />
                  {cached ? labels.cachedTag : labels.freshTag}
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              {labels.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={handleRefresh}
              disabled={loading || refreshing}
              className="p-1.5 text-muted-foreground hover:text-foreground bg-secondary/60 rounded-md border border-border tactile-btn disabled:opacity-50"
              aria-label={labels.refresh}
            >
              {refreshing ? <Loading03Icon size={14} className="animate-spin" /> : <RefreshIcon size={14} />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:text-foreground bg-secondary/60 rounded-md border border-border tactile-btn"
              aria-label={labels.close}
            >
              <Cancel01Icon size={14} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-3">
          {loading ? (
            <div className="space-y-3 py-4" aria-busy="true">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loading03Icon size={14} className="animate-spin text-primary" />
                <span className="text-xs font-medium">{labels.loading}</span>
              </div>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="p-3 rounded-xl border border-border bg-secondary/30 animate-pulse space-y-2">
                  <div className="h-3 w-28 bg-secondary rounded" />
                  <div className="h-2.5 w-full bg-secondary rounded" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-2 text-xs text-destructive">
              <Alert02Icon size={16} className="shrink-0 mt-0.5" />
              <span>{labels.error}</span>
            </div>
          ) : info ? (
            <>
              <InfoSection
                icon={<Medicine01Icon size={14} />}
                title={labels.purpose}
                variant="primary"
                body={info.purpose}
              />
              <InfoSection
                icon={<Alert02Icon size={14} />}
                title={labels.sideEffects}
                variant="warning"
                body={info.sideEffects}
              />
              <InfoSection
                icon={<Note01Icon size={14} />}
                title={labels.instructions}
                variant="emerald"
                body={info.instructions}
              />
              <InfoSection
                icon={<Clock01Icon size={14} />}
                title={labels.missedDose}
                variant="destructive"
                body={info.missedDose}
              />
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="border-t border-border px-5 py-3 space-y-2.5 bg-card">
          <button
            onClick={handleSpeak}
            disabled={!info || loading || speaking}
            className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-lg text-xs py-2 px-3 shadow-sm tactile-btn disabled:opacity-50"
          >
            {speaking ? (
              <>
                <Loading03Icon size={14} className="animate-spin" />
                <span>{labels.stopSpeak}</span>
              </>
            ) : (
              <>
                <VolumeHighIcon size={14} />
                <span>{labels.speak}</span>
              </>
            )}
          </button>
          <div className="flex items-start gap-1.5 text-[10px] text-muted-foreground leading-relaxed">
            <AlertCircleIcon size={12} className="text-primary mt-0.5 shrink-0" />
            <span>{labels.disclaimer}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  body: string;
  variant: 'primary' | 'warning' | 'emerald' | 'destructive';
}> = ({ icon, title, body, variant }) => {
  const styles = {
    primary: 'border-primary/20 bg-primary/5 text-primary',
    warning: 'border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400',
    emerald: 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400',
    destructive: 'border-destructive/20 bg-destructive/5 text-destructive',
  }[variant];

  return (
    <section className="rounded-xl border border-border bg-card p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <span className={`w-6 h-6 rounded-md flex items-center justify-center border shrink-0 ${styles}`}>
          {icon}
        </span>
        <h3 className="text-xs font-semibold text-foreground tracking-wide">
          {title}
        </h3>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap pl-8">
        {body}
      </p>
    </section>
  );
};

export default MedicineInfoPanel;
