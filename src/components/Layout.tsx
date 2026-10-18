import React, { useState, useEffect } from 'react';
import {
  DashboardSquare01Icon,
  Medicine01Icon,
  Activity01Icon,
  File02Icon,
  Calendar03Icon,
  Location01Icon,
  AiChat02Icon,
  Link01Icon,
  Settings02Icon,
  UserIcon,
  UserGroupIcon,
  Logout01Icon,
  Menu01Icon,
  Cancel01Icon,
  Mic01Icon,
  VolumeHighIcon,
  ArrowLeft01Icon,
  SecurityBlockIcon,
} from 'hugeicons-react';
import { useSettings } from '../context/SettingsContext';
import type { LanguageCode } from '../context/SettingsContext';
import { useMedication } from '../context/MedicationContext';
import { useFirebase } from '../context/FirebaseContext';
import { useRole } from '../context/RoleContext';
import { useSOS } from '../context/SOSContext';
import { SarvamService } from '../services/sarvamService';
import { auth } from '../firebase';
import { PatientSwitcher } from './PatientSwitcher';
import { SOSAlertBanner } from './SOSAlertBanner';
import { AccessibilitySettings } from './AccessibilitySettings';
import { PrivacyXRay } from './PrivacyXRay';

interface LayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

interface NavItem {
  id: string;
  label: string;
  nativeLabel?: string;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
}

export const Layout: React.FC<LayoutProps> = ({ activeTab, setActiveTab, children }) => {
  const {
    language,
    setLanguage,
    t,
  } = useSettings();
  const { addMedication } = useMedication();
  const { user } = useFirebase();
  const { role, profile, activePatientId, activePatientName, setActivePatientId } = useRole();
  const { unacknowledgedCount } = useSOS();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMicOpen, setIsMicOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechText, setSpeechText] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isPatientSwitcherOpen, setIsPatientSwitcherOpen] = useState(false);
  const [showPrivacyXRay, setShowPrivacyXRay] = useState(false);

  // MediaRecorder for audio capture (uses Sarvam AI STT)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const toggleMic = () => {
    if (isMicOpen) {
      // Stop recording
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
      setIsMicOpen(false);
    } else {
      setIsMicOpen(true);
      setSpeechText(t.micListening);
      setTimeout(() => {
        startSpeechListening();
      }, 400);
    }
  };

  const startSpeechListening = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(chunks, { type: 'audio/webm' });
        stream.getTracks().forEach(track => track.stop());
        
        setIsListening(false);
        setSpeechText(language === 'hi' ? 'पहचान हो रही है...' : 'Processing...');

        try {
          // Use Sarvam AI STT instead of browser API
          const transcript = await SarvamService.speechToText(audioBlob, language);
          setSpeechText(transcript);
          handleSpeechCompletion(transcript);
          console.log('VOICE RECEIVED (Sarvam AI):', transcript);
        } catch (err) {
          console.error('Sarvam STT Error:', err);
          setSpeechText(language === 'hi' ? 'त्रुटि हुई। फिर प्रयास करें।' : 'Error. Please try again.');
          setTimeout(() => setIsMicOpen(false), 2000);
        }
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsListening(true);
      setSpeechText(language === 'hi' ? 'बोलिए...' : 'Speak now...');

      // Auto-stop after 10 seconds
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 10000);

    } catch (err) {
      console.error('Microphone access error:', err);
      setIsListening(false);
      setSpeechText(language === 'hi' ? 'माइक्रोफ़ोन एक्सेस अस्वीकृत' : 'Microphone access denied');
      setTimeout(() => setIsMicOpen(false), 2000);
    }
  };

  const handleSpeechCompletion = async (text: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (activeTab === 'assistant') {
      window.dispatchEvent(new CustomEvent('pulse_voice_chat', { detail: text }));
      setIsMicOpen(false);
      return;
    }

    setSpeechText(language === 'hi' ? 'दवा समझी जा रही है...' : 'Processing medication...');
    try {
      const med = await SarvamService.extractMedicationFromText(text);
      if (med) {
        const newMed = {
          name: med.name || 'Medicine',
          dosage: med.dosage || '1 tablet',
          frequency: med.frequency || 'Daily',
          timing: Array.isArray(med.timing) ? med.timing : ['morning'],
          instructions: med.instructions || 'After meals',
          color: '#0D9488',
          reminder: true,
          startDate: new Date().toISOString().split('T')[0],
        };
        await addMedication(newMed);
      }
    } catch (e) {
      console.warn('Voice command fallback:', e);
    }

    const successSpeech: Record<string, string> = {
      hi: 'दवाई सुरक्षित रूप से जोड़ दी गई है',
      ta: 'மருந்து வெற்றிகரமாக சேர்க்கப்பட்டது',
      en: 'Medicine has been added successfully',
    };
    await SarvamService.textToSpeech(successSpeech[language] || successSpeech['hi'], language);

    setActiveTab('medicines');
    setIsMicOpen(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setProfileMenuOpen(false);
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsSettingsOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const navLabels: Record<string, { en: string; native?: string }> = {
    home:           { en: 'Dashboard', native: language === 'hi' ? 'डैशबोर्ड' : undefined },
    medicines:      { en: 'Medicines', native: language === 'hi' ? 'दवाइयाँ' : t.medicinesTab },
    vitals:         { en: 'Vitals & Pulse', native: language === 'hi' ? 'वाइटल्स' : 'Vitals' },
    documents:      { en: 'Prescriptions', native: language === 'hi' ? 'पर्चे' : t.documentsTab },
    appointments:   { en: 'Appointments', native: language === 'hi' ? 'अपॉइंटमेंट' : undefined },
    nearby:         { en: 'Nearby Care', native: language === 'hi' ? 'पास की देखभाल' : undefined },
    assistant:      { en: 'AI Assistant', native: language === 'hi' ? 'सहायक' : undefined },
    'caregiver-link': { en: 'Link Caregiver', native: language === 'hi' ? 'केयरगिवर लिंक' : undefined },
  };

  const baseNavItems: NavItem[] = [
    { id: 'home',         label: navLabels.home.en,         nativeLabel: navLabels.home.native,         icon: DashboardSquare01Icon },
    { id: 'medicines',    label: navLabels.medicines.en,    nativeLabel: navLabels.medicines.native,    icon: Medicine01Icon },
    { id: 'vitals',       label: navLabels.vitals.en,       nativeLabel: navLabels.vitals.native,       icon: Activity01Icon },
    { id: 'documents',    label: navLabels.documents.en,    nativeLabel: navLabels.documents.native,    icon: File02Icon },
    { id: 'appointments', label: navLabels.appointments.en, nativeLabel: navLabels.appointments.native, icon: Calendar03Icon },
    { id: 'nearby',       label: navLabels.nearby.en,       nativeLabel: navLabels.nearby.native,       icon: Location01Icon },
    { id: 'assistant',    label: navLabels.assistant.en,    nativeLabel: navLabels.assistant.native,    icon: AiChat02Icon },
  ];

  const navItems: NavItem[] =
    role === 'patient'
      ? [
          ...baseNavItems,
          {
            id: 'caregiver-link',
            label: navLabels['caregiver-link'].en,
            nativeLabel: navLabels['caregiver-link'].native,
            icon: Link01Icon,
          },
        ]
      : baseNavItems;

  const profileName = profile?.fullName || profile?.displayName || '';
  const userInitial = (profileName || user?.email || 'U').charAt(0).toUpperCase();
  const showSOSDot = role === 'caregiver' && unacknowledgedCount > 0;

  const renderNavIcon = (
    Icon: React.ComponentType<{ size?: number | string; className?: string }>,
    iconClass: string,
    isHomeTab: boolean
  ) => (
    <span className="relative inline-flex shrink-0">
      <Icon size={18} className={iconClass} />
      {isHomeTab && showSOSDot && (
        <span
          aria-label="Unacknowledged SOS alerts"
          className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-destructive border-2 border-card"
        />
      )}
    </span>
  );

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-background text-foreground flex flex-col font-sans">
      {/* Top Navbar: slim h-14, clean borders and subtle blur */}
      <header className="sticky top-0 z-40 h-14 bg-card/95 backdrop-blur-md border-b border-border flex items-center justify-between px-2.5 sm:px-4 lg:px-6 w-full max-w-full overflow-hidden">
        {/* Left side: switcher + menu + brand */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
          {/* Caregiver patient switcher */}
          {role === 'caregiver' && (
            <button
              onClick={() => setIsPatientSwitcherOpen(true)}
              className="text-muted-foreground hover:text-foreground bg-secondary/70 hover:bg-secondary rounded-lg border border-border p-1.5 sm:p-2 tactile-btn relative flex items-center justify-center shrink-0 h-8 w-8"
              aria-label="Open linked patients"
              title="Open linked patients"
            >
              <UserGroupIcon size={16} />
              {activePatientId && (
                <span
                  className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 border-2 border-card"
                  aria-hidden="true"
                />
              )}
            </button>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-muted-foreground hover:text-foreground bg-secondary/70 hover:bg-secondary rounded-lg border border-border p-1.5 sm:p-2 tactile-btn flex items-center justify-center shrink-0 h-8 w-8"
            aria-label="Open menu"
          >
            <Menu01Icon size={16} />
          </button>

          {/* Brand */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none min-w-0"
            onClick={() => setActiveTab('home')}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="leading-none flex items-center gap-1.5 min-w-0">
              <span className="text-sm font-semibold tracking-tight text-foreground truncate">{t.appName}</span>
              <span className="hidden sm:inline-flex text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                Health
              </span>
            </div>
          </div>
        </div>

        {/* Right actions: language, settings, profile */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            aria-label="Select language"
            className="h-8 bg-secondary/70 text-foreground font-medium text-xs px-1.5 sm:px-2 rounded-lg border border-border outline-none cursor-pointer hover:border-primary/50 transition-colors shrink-0 max-w-[58px] sm:max-w-none"
          >
            <option value="hi">हिंदी</option>
            <option value="ta">தமிழ்</option>
            <option value="gu">ગુજરાતી</option>
            <option value="mr">मराठी</option>
            <option value="te">తెలుగు</option>
            <option value="bn">বাংলা</option>
            <option value="kn">ಕನ್ನಡ</option>
            <option value="ml">മലയാളം</option>
            <option value="en">EN</option>
          </select>

          <button
            onClick={() => setShowPrivacyXRay(true)}
            className="h-8 px-2.5 text-muted-foreground hover:text-green-600 bg-secondary/70 hover:bg-green-50 dark:hover:bg-green-950/20 rounded-lg border border-border hover:border-green-500/30 tactile-btn flex items-center gap-1.5 text-xs font-medium transition-colors"
            aria-label="Privacy X-Ray"
            title="View Privacy Protection"
          >
            <SecurityBlockIcon size={16} className="text-green-600" />
            <span className="hidden sm:inline">Privacy</span>
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="h-8 w-8 sm:w-auto p-0 sm:px-2.5 text-muted-foreground hover:text-foreground bg-secondary/70 hover:bg-secondary rounded-lg border border-border tactile-btn flex items-center justify-center gap-1.5 text-xs font-medium shrink-0"
            aria-label="Settings"
            title="Settings"
          >
            <Settings02Icon size={16} />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Profile Menu */}
          <div className="relative shrink-0">
            <button
              onClick={() => setProfileMenuOpen((p) => !p)}
              className="w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-xs flex items-center justify-center shadow-sm hover:opacity-90 transition-opacity tactile-btn"
              aria-label="Profile"
            >
              {userInitial}
            </button>

            {profileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setProfileMenuOpen(false)}
                />
                <div className="absolute right-0 top-10 w-60 bg-card border border-border rounded-xl shadow-lifted z-40 p-2 animate-in fade-in-0 slide-in-from-top-2 duration-150">
                  <div className="px-2.5 py-2 border-b border-border mb-1">
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      Account
                    </div>
                    {profileName && (
                      <div className="text-xs font-medium text-foreground truncate mt-0.5">
                        {profileName}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground truncate">
                      {user?.email || 'Guest'}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setActiveTab('profile');
                    }}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-secondary rounded-lg text-left transition-colors"
                  >
                    <UserIcon size={16} className="text-primary" />
                    <span>{language === 'hi' ? 'मेरी प्रोफ़ाइल' : 'My Profile'}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 rounded-lg text-left transition-colors"
                  >
                    <Logout01Icon size={16} />
                    <span>Sign out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Caregiver patient banner */}
      {role === 'caregiver' && activePatientId && (
        <div className="sticky top-14 z-30 bg-emerald-500/10 border-b border-emerald-500/20 px-4 lg:px-6 py-2 flex items-center gap-2.5 text-xs">
          <button
            onClick={() => setIsPatientSwitcherOpen(true)}
            className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium hover:underline"
            aria-label="Switch patient"
          >
            <ArrowLeft01Icon size={14} />
            <UserGroupIcon size={14} />
          </button>
          <div className="flex-1 truncate">
            <span className="text-muted-foreground">
              {language === 'hi' ? 'मरीज़:' : 'Viewing:'}
            </span>{' '}
            <span className="font-semibold text-foreground">
              {activePatientName || 'Linked patient'}
            </span>
          </div>
          <button
            onClick={() => setActivePatientId(null)}
            className="text-xs font-medium text-muted-foreground hover:text-foreground bg-card/60 border border-border px-2 py-0.5 rounded-md"
          >
            {language === 'hi' ? 'बाहर निकलें' : 'Exit'}
          </button>
        </div>
      )}

      {/* Caregiver SOS Alert Banner */}
      <SOSAlertBanner
        onJumpToHistory={() => {
          setActiveTab('home');
          setTimeout(() => {
            const el = document.getElementById('sos-history');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }}
      />

      <PatientSwitcher
        open={isPatientSwitcherOpen}
        onClose={() => setIsPatientSwitcherOpen(false)}
      />

      {/* Body: Sidebar + Main Content */}
      <div className="flex-1 flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-card/50 sticky top-14 h-[calc(100vh-3.5rem)]">
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto thin-scroll">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-all duration-150 text-xs font-medium ${
                    active
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                  }`}
                >
                  {renderNavIcon(
                    Icon,
                    active ? 'text-primary' : 'text-muted-foreground',
                    item.id === 'home'
                  )}
                  <span className="truncate">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Voice Add CTA in Sidebar footer */}
          <div className="p-3 border-t border-border">
            <button
              onClick={toggleMic}
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-xs py-2 px-3 rounded-lg shadow-sm tactile-btn"
              aria-label="Add medicine by voice"
            >
              <Mic01Icon size={16} />
              <span>{language === 'hi' ? 'आवाज से जोड़ें' : 'Voice Add'}</span>
            </button>
          </div>
        </aside>

        {/* Main View Container */}
        <main className="flex-1 min-w-0 w-full max-w-full overflow-x-hidden pb-20 lg:pb-6">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-5 w-full max-w-full">
            {children}
          </div>
        </main>
      </div>

      {/* Mobile Drawer (Sidebar) - placed at root for correct top stacking context */}
      {isSidebarOpen && (
        <div className="lg:hidden relative z-[100]">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[90] animate-in fade-in-0 duration-200"
            onClick={() => setIsSidebarOpen(false)}
            aria-hidden="true"
          />
          <aside className="fixed left-0 top-0 bottom-0 w-72 max-w-[85vw] bg-card border-r border-border z-[100] flex flex-col shadow-2xl animate-in slide-in-from-left duration-200 overflow-hidden">
            <div className="h-14 px-4 flex items-center justify-between border-b border-border shrink-0">
              <span className="font-semibold text-foreground text-sm">{t.appName}</span>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg border border-border"
                aria-label="Close menu"
              >
                <Cancel01Icon size={16} />
              </button>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto thin-scroll">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left text-xs font-medium transition-colors ${
                      active
                        ? 'bg-primary/10 text-primary font-semibold'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                    }`}
                  >
                    {renderNavIcon(
                      Icon,
                      active ? 'text-primary' : 'text-muted-foreground',
                      item.id === 'home'
                    )}
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </nav>
            <div className="p-3 border-t border-border shrink-0">
              <button
                onClick={() => {
                  setIsSidebarOpen(false);
                  toggleMic();
                }}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground font-medium text-xs py-2 px-3 rounded-lg shadow-sm tactile-btn"
              >
                <Mic01Icon size={16} />
                <span>{language === 'hi' ? 'आवाज से जोड़ें' : 'Voice Add'}</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar: strictly bounded to viewport without horizontal scroll */}
      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 w-full max-w-full z-40 bg-card/95 backdrop-blur-md border-t border-border flex items-center justify-around px-0.5 py-1 box-border overflow-hidden"
      >
        {[
          { id: 'home', label: navLabels.home.en, icon: DashboardSquare01Icon },
          { id: 'medicines', label: navLabels.medicines.en, icon: Medicine01Icon },
          { id: 'vitals', label: navLabels.vitals.en, icon: Activity01Icon },
          { id: 'documents', label: navLabels.documents.en, icon: File02Icon },
          { id: 'assistant', label: navLabels.assistant.en, icon: AiChat02Icon },
        ].map((item) => {
          const active = activeTab === item.id;
          const Icon = item.icon;
          const isHome = item.id === 'home';
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-label={item.label}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center py-1 px-0.5 rounded-md transition-colors relative min-h-[44px] ${
                active ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="relative shrink-0">
                <Icon size={18} className={active ? 'text-primary' : 'text-muted-foreground'} />
                {isHome && showSOSDot && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive animate-pulse" />
                )}
              </span>
              <span className="text-[10px] leading-tight mt-0.5 truncate w-full text-center">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Voice Add FAB for mobile: placed cleanly above bottom bar without overflow */}
      <div
        className="lg:hidden fixed z-30 pointer-events-auto"
        style={{
          right: 'max(1rem, env(safe-area-inset-right, 0px))',
          bottom: 'calc(3.75rem + env(safe-area-inset-bottom, 0px))',
        }}
      >
        <button
          onClick={toggleMic}
          className="w-12 h-12 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center shadow-lifted text-primary-foreground tactile-btn"
          aria-label="Voice input"
        >
          <Mic01Icon size={20} />
        </button>
      </div>

      {/* Voice Modal Dialog */}
      {isMicOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in-0 duration-150">
          <button
            onClick={() => setIsMicOpen(false)}
            className="absolute top-5 right-5 p-2 text-muted-foreground hover:text-foreground bg-card rounded-full border border-border shadow-sm tactile-btn"
            aria-label="Close voice input"
          >
            <Cancel01Icon size={18} />
          </button>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-1 text-foreground">{t.appName} Voice Input</h2>
            <p className="text-muted-foreground text-sm">
              {activeTab === 'assistant' ? 'Talk to the Pulse Assistant' : t.micPrompt}
            </p>
          </div>

          <div className="relative w-28 h-28 flex items-center justify-center mb-8">
            <div className="absolute inset-0 rounded-full bg-primary/15 animate-ping"></div>
            <button
              onClick={startSpeechListening}
              className="w-20 h-20 rounded-full bg-primary hover:bg-primary-hover flex items-center justify-center text-primary-foreground z-10 shadow-lifted tactile-btn"
              aria-label="Start listening"
            >
              {isListening ? <VolumeHighIcon size={28} className="animate-pulse" /> : <Mic01Icon size={28} />}
            </button>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 w-full max-w-sm shadow-card min-h-16 flex items-center justify-center">
            <p className="text-foreground text-sm font-medium leading-relaxed">{speechText}</p>
          </div>
        </div>
      )}

      {/* Accessibility & Theme drawer */}
      <AccessibilitySettings open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />

      {/* Privacy X-Ray Modal */}
      {showPrivacyXRay && <PrivacyXRay onClose={() => setShowPrivacyXRay(false)} />}
    </div>
  );
};
