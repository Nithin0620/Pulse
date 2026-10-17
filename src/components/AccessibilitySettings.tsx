import React, { useState } from 'react';
import {
  Cancel01Icon,
  Sun01Icon,
  Moon02Icon,
  TextFontIcon,
  ViewIcon,
  VolumeHighIcon,
  WaveIcon,
  RotateLeft01Icon,
  Download01Icon,
  ArrowDown01Icon,
  ArrowUp01Icon,
  AlertCircleIcon,
  TranslateIcon,
  Medicine01Icon,
} from 'hugeicons-react';
import {
  useAccessibility,
  type FontSizePreset,
  type ThemeMode,
} from '../context/AccessibilityContext';
import { useSettings } from '../context/SettingsContext';
import type { LanguageCode } from '../context/SettingsContext';

interface Props {
  open: boolean;
  onClose: () => void;
}

const FONT_PRESETS: { id: FontSizePreset; label: string; sub: string }[] = [
  { id: 'small',       label: 'Small',       sub: 'A' },
  { id: 'normal',      label: 'Normal',      sub: 'A' },
  { id: 'large',       label: 'Large',       sub: 'A' },
  { id: 'extra-large', label: 'Extra Large', sub: 'A' },
];

const LANGUAGE_OPTIONS: { code: LanguageCode; native: string; latin: string }[] = [
  { code: 'hi', native: 'हिंदी',     latin: 'Hindi' },
  { code: 'en', native: 'English',  latin: 'English' },
  { code: 'ta', native: 'தமிழ்',    latin: 'Tamil' },
  { code: 'te', native: 'తెలుగు',   latin: 'Telugu' },
  { code: 'bn', native: 'বাংলা',     latin: 'Bengali' },
  { code: 'mr', native: 'मराठी',     latin: 'Marathi' },
  { code: 'gu', native: 'ગુજરાતી',   latin: 'Gujarati' },
  { code: 'kn', native: 'ಕನ್ನಡ',     latin: 'Kannada' },
  { code: 'ml', native: 'മലയാളം',  latin: 'Malayalam' },
];

export const AccessibilitySettings: React.FC<Props> = ({ open, onClose }) => {
  const {
    theme, fontSize, highContrast, reduceMotion, voiceFeedback, soundVolume,
    setTheme, setFontSize, setHighContrast, setReduceMotion, setVoiceFeedback,
    setSoundVolume, resetDefaults, exportSettings,
  } = useAccessibility();

  const {
    language, setLanguage,
    sarvamKey, setSarvamKey,
    firebaseConfig, setFirebaseConfig,
    isDemo, setIsDemo,
  } = useSettings();

  const [confirmReset, setConfirmReset] = useState(false);
  const [showDev, setShowDev] = useState(false);
  const [tempSarvam, setTempSarvam] = useState(sarvamKey);
  const [tempFirebase, setTempFirebase] = useState(firebaseConfig);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const playTestSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        gain.gain.value = Math.max(0.01, soundVolume / 100);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch {
      // Audio playback unavailable
    }
  };

  const handleSaveDevKeys = () => {
    setSarvamKey(tempSarvam);
    setFirebaseConfig(tempFirebase);
    alert('Developer configuration saved');
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex justify-end animate-in fade-in-0 duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
      onClick={onClose}
    >
      <div
        className="w-full sm:w-[460px] h-full bg-card border-l border-border flex flex-col shadow-lifted animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 z-10 bg-card border-b border-border px-5 py-3.5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Settings</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Personalize display, typography, and accessibility.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground bg-secondary/80 border border-border rounded-lg tactile-btn"
            aria-label="Close settings"
          >
            <Cancel01Icon size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto thin-scroll px-5 py-5 space-y-5">
          {/* Theme */}
          <Section title="Theme" subtitle="Switch between clean clinical light mode and night mode.">
            <div
              className="grid grid-cols-2 gap-2 bg-secondary/50 border border-border rounded-xl p-1.5"
              role="radiogroup"
              aria-label="App theme"
            >
              <ThemeButton
                active={theme === 'light'}
                onClick={() => setTheme('light')}
                icon={<Sun01Icon size={18} />}
                label="Light"
              />
              <ThemeButton
                active={theme === 'dark'}
                onClick={() => setTheme('dark')}
                icon={<Moon02Icon size={18} />}
                label="Dark"
              />
            </div>
          </Section>

          {/* Text size */}
          <Section
            title="Text Size"
            subtitle="Choose your preferred reading font scale."
            icon={<TextFontIcon size={16} className="text-primary" />}
          >
            <div
              className="grid grid-cols-4 gap-2"
              role="radiogroup"
              aria-label="Text size"
            >
              {FONT_PRESETS.map(({ id, label }) => (
                <button
                  key={id}
                  role="radio"
                  aria-checked={fontSize === id}
                  onClick={() => setFontSize(id)}
                  className={`flex flex-col items-center justify-center gap-1 rounded-lg border tactile-btn py-2 px-1 text-center transition-all ${
                    fontSize === id
                      ? 'bg-primary/10 border-primary text-primary font-semibold shadow-sm'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <span className="font-semibold text-sm">A</span>
                  <span className="text-[10px] truncate max-w-full">{label}</span>
                </button>
              ))}
            </div>

            {/* Live preview tile */}
            <div className="mt-3 bg-secondary/40 border border-border rounded-xl p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Preview
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Medicine01Icon size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-foreground">Paracetamol 500 mg</div>
                  <div className="text-[11px] text-muted-foreground truncate">
                    {language === 'hi' ? 'खाने के बाद, दिन में 2 बार' : '1 tablet, twice daily after meals'}
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* High contrast */}
          <Section
            title="High Contrast"
            subtitle="Boosts borders and color separation for maximum visibility."
            icon={<ViewIcon size={16} className="text-primary" />}
          >
            <ToggleSwitch
              checked={highContrast}
              onChange={setHighContrast}
              ariaLabel="High contrast mode"
            />
          </Section>

          {/* Audio & motion */}
          <Section
            title="Audio & Motion"
            subtitle="Control audio confirmations and animation speeds."
            icon={<VolumeHighIcon size={16} className="text-primary" />}
          >
            <div className="space-y-3">
              <RowToggle
                title="Voice feedback"
                description='PULSE speaks confirmations out loud after each action.'
                checked={voiceFeedback}
                onChange={setVoiceFeedback}
              />
              <RowToggle
                title="Reduce motion"
                description="Disables pulsing and sliding animations."
                checked={reduceMotion}
                onChange={setReduceMotion}
                icon={<WaveIcon size={16} className="text-muted-foreground" />}
              />
              <div className="bg-secondary/40 border border-border rounded-xl p-3">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="text-xs font-semibold text-foreground">Volume</div>
                  <span className="text-xs font-medium text-primary" aria-live="polite">
                    {soundVolume}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(parseInt(e.target.value, 10))}
                  aria-label="Sound volume"
                  className="w-full h-1.5 rounded-full bg-border accent-[rgb(var(--c-primary))] cursor-pointer"
                />
                <div className="flex items-center justify-between mt-2">
                  <button
                    onClick={playTestSound}
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-medium hover:underline"
                  >
                    <VolumeHighIcon size={14} />
                    <span>Test sound</span>
                  </button>
                </div>
              </div>
            </div>
          </Section>

          {/* Language */}
          <Section
            title="Language"
            subtitle="Instant translations across all clinical interfaces."
            icon={<TranslateIcon size={16} className="text-primary" />}
          >
            <div
              className="grid grid-cols-3 gap-1.5"
              role="radiogroup"
              aria-label="Language"
            >
              {LANGUAGE_OPTIONS.map(({ code, native, latin }) => (
                <button
                  key={code}
                  role="radio"
                  aria-checked={language === code}
                  onClick={() => setLanguage(code)}
                  className={`flex flex-col items-center justify-center rounded-lg border tactile-btn py-2 px-1 text-center transition-all ${
                    language === code
                      ? 'bg-primary text-primary-foreground font-semibold border-primary shadow-sm'
                      : 'bg-card border-border text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <span className="text-xs font-medium leading-tight">{native}</span>
                  <span className={`text-[10px] ${language === code ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {latin}
                  </span>
                </button>
              ))}
            </div>
          </Section>

          {/* Developer / API keys */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <button
              onClick={() => setShowDev((v) => !v)}
              aria-expanded={showDev}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left tactile-btn hover:bg-secondary/50 text-xs font-semibold text-foreground"
            >
              <span className="flex items-center gap-1.5">
                <AlertCircleIcon size={16} className="text-amber-500" />
                Developer Settings (API Keys)
              </span>
              {showDev ? <ArrowUp01Icon size={14} className="text-muted-foreground" /> : <ArrowDown01Icon size={14} className="text-muted-foreground" />}
            </button>

            {showDev && (
              <div className="p-3.5 border-t border-border space-y-3">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-2.5 flex items-start gap-2">
                  <AlertCircleIcon size={16} className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-800 dark:text-amber-300">
                    <div>Toggle between offline mock data and live APIs.</div>
                    <button
                      onClick={() => setIsDemo(!isDemo)}
                      className="mt-1.5 px-2.5 py-1 rounded-md text-xs font-medium border border-amber-500/30 bg-card text-foreground"
                    >
                      {isDemo ? 'Switch to Live API Mode' : 'Switch to Demo Mode'}
                    </button>
                  </div>
                </div>

                <label className="block">
                  <span className="block text-xs font-medium text-foreground mb-1">Sarvam AI Key</span>
                  <input
                    type="password"
                    value={tempSarvam}
                    onChange={(e) => setTempSarvam(e.target.value)}
                    placeholder="sk_live_..."
                    className="w-full h-8 bg-secondary/50 border border-border rounded-md px-2.5 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="block">
                  <span className="block text-xs font-medium text-foreground mb-1">Firebase Config (JSON)</span>
                  <textarea
                    value={tempFirebase}
                    onChange={(e) => setTempFirebase(e.target.value)}
                    rows={4}
                    placeholder='{ "apiKey": "..." }'
                    className="w-full bg-secondary/50 border border-border rounded-md p-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary font-mono"
                  />
                </label>
                <button
                  onClick={handleSaveDevKeys}
                  className="w-full h-8 bg-primary hover:bg-primary-hover text-primary-foreground font-medium rounded-md text-xs shadow-sm"
                >
                  Save Configuration
                </button>
              </div>
            )}
          </div>

          {/* Reset & Export */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                if (confirmReset) {
                  resetDefaults();
                  setConfirmReset(false);
                } else {
                  setConfirmReset(true);
                }
              }}
              className={`inline-flex items-center justify-center gap-1.5 rounded-lg border font-medium text-xs h-9 ${
                confirmReset
                  ? 'bg-destructive border-destructive text-destructive-foreground'
                  : 'bg-card border-border text-foreground hover:bg-secondary/60'
              }`}
            >
              <RotateLeft01Icon size={14} />
              <span>{confirmReset ? 'Confirm Reset' : 'Reset'}</span>
            </button>
            <button
              onClick={exportSettings}
              className="inline-flex items-center justify-center gap-1.5 bg-card border border-border hover:bg-secondary/60 text-foreground font-medium rounded-lg text-xs h-9"
            >
              <Download01Icon size={14} />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* Helper subcomponents */
const Section: React.FC<{
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, children }) => (
  <section aria-label={title}>
    <div className="flex items-center gap-1.5 mb-1">
      {icon}
      <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground">{title}</h3>
    </div>
    {subtitle && <p className="text-xs text-muted-foreground mb-2.5">{subtitle}</p>}
    {children}
  </section>
);

const ThemeButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: ThemeMode | string;
}> = ({ active, onClick, icon, label }) => (
  <button
    role="radio"
    aria-checked={active}
    onClick={onClick}
    className={`flex items-center justify-center gap-2 rounded-lg border tactile-btn py-2 px-3 text-xs font-medium transition-all ${
      active
        ? 'bg-card border-border text-primary font-semibold shadow-sm'
        : 'border-transparent text-muted-foreground hover:text-foreground'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

const ToggleSwitch: React.FC<{
  checked: boolean;
  onChange: (v: boolean) => void;
  ariaLabel?: string;
}> = ({ checked, onChange, ariaLabel }) => (
  <button
    role="switch"
    aria-checked={checked}
    aria-label={ariaLabel}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex items-center h-6 w-11 rounded-full border border-border transition-colors duration-200 ${
      checked ? 'bg-primary' : 'bg-secondary'
    }`}
  >
    <span
      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? 'translate-x-5' : 'translate-x-1'
      }`}
    />
  </button>
);

const RowToggle: React.FC<{
  title: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}> = ({ title, description, checked, onChange, icon }) => (
  <div className="bg-secondary/40 border border-border rounded-xl p-3 flex items-center justify-between gap-3">
    <div className="min-w-0 flex items-start gap-2">
      {icon}
      <div className="min-w-0">
        <div className="text-xs font-semibold text-foreground">{title}</div>
        {description && (
          <div className="text-[11px] text-muted-foreground mt-0.5">{description}</div>
        )}
      </div>
    </div>
    <ToggleSwitch checked={checked} onChange={onChange} ariaLabel={title} />
  </div>
);

export default AccessibilitySettings;
