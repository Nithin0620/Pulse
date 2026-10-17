import React, { useEffect, useRef, useState } from 'react';
import {
  RecaptchaVerifier,
  linkWithPhoneNumber,
  signInWithPhoneNumber,
  type ConfirmationResult,
} from 'firebase/auth';
import { auth } from '../firebase';
import { useFirebase } from '../context/FirebaseContext';
import { useRole } from '../context/RoleContext';
import {
  Activity01Icon,
  SecurityCheckIcon,
  UserIcon,
  UserGroupIcon,
  Call02Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Loading03Icon,
  IdentityCardIcon,
} from 'hugeicons-react';
import { useSettings } from '../context/SettingsContext';
import PersonalDetailsForm from '../components/PersonalDetailsForm';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface OnboardingProps {
  onComplete: () => void;
}

type Step = 'role' | 'details' | 'phone';

const RECAPTCHA_CONTAINER_ID = 'pulse-recaptcha-container';

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { user } = useFirebase();
  const {
    profile,
    role,
    saveRole,
    savePhoneNumber,
    saveDisplayName,
    savePersonalDetails,
  } = useRole();
  const { language } = useSettings();

  const [step, setStep] = useState<Step>('role');
  const [savingRole, setSavingRole] = useState<null | 'patient' | 'caregiver'>(null);
  const [displayName, setDisplayName] = useState('');

  // Phone fields
  const [phoneDigits, setPhoneDigits] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [phoneStage, setPhoneStage] = useState<'enter' | 'otp'>('enter');
  const [resendCountdown, setResendCountdown] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (resendCountdown <= 0) return;
    const t = setInterval(() => setResendCountdown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCountdown]);

  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
        recaptchaVerifierRef.current = null;
      }
    };
  }, []);

  const initRecaptcha = (): RecaptchaVerifier => {
    if (recaptchaVerifierRef.current) {
      return recaptchaVerifierRef.current;
    }
    const verifier = new RecaptchaVerifier(auth, RECAPTCHA_CONTAINER_ID, {
      size: 'invisible',
      callback: () => {},
      'expired-callback': () => {
        setError(
          language === 'hi'
            ? 'reCAPTCHA का समय समाप्त हो गया। कृपया पुनः प्रयास करें।'
            : 'reCAPTCHA expired. Please try again.'
        );
      },
    });
    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  const handleSelectRole = async (chosen: 'patient' | 'caregiver') => {
    setError(null);
    setSavingRole(chosen);
    try {
      if (displayName.trim()) {
        await saveDisplayName(displayName.trim());
      }
      await saveRole(chosen);
      setStep('details');
    } catch (err: any) {
      console.error('saveRole failed', err);
      setError(err?.message || 'Could not save your role. Please try again.');
    } finally {
      setSavingRole(null);
    }
  };

  const handleSaveDetails = async (patch: Parameters<typeof savePersonalDetails>[0]) => {
    setError(null);
    try {
      await savePersonalDetails(patch);
      setStep('phone');
    } catch (err: any) {
      console.error('savePersonalDetails failed', err);
      setError(err?.message || 'Could not save your details. Please try again.');
    }
  };

  const fullPhone = `+91${phoneDigits.trim()}`;

  const handleSendOtp = async () => {
    setError(null);
    setSuccess(null);
    if (!/^\d{10}$/.test(phoneDigits.trim())) {
      setError(
        language === 'hi'
          ? 'कृपया 10 अंकों का वैध भारतीय मोबाइल नंबर डालें।'
          : 'Please enter a valid 10-digit mobile number.'
      );
      return;
    }

    setSubmitting(true);
    try {
      const verifier = initRecaptcha();
      let conf: ConfirmationResult;
      if (user) {
        conf = await linkWithPhoneNumber(user, fullPhone, verifier);
      } else {
        conf = await signInWithPhoneNumber(auth, fullPhone, verifier);
      }
      setConfirmation(conf);
      setPhoneStage('otp');
      setResendCountdown(30);
      setSuccess(
        language === 'hi'
          ? `${fullPhone} पर OTP भेज दिया गया है।`
          : `OTP sent to ${fullPhone}`
      );
    } catch (err: any) {
      console.error('sendOtp failed', err);
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch {}
        recaptchaVerifierRef.current = null;
      }
      if (err?.code === 'auth/credential-already-in-use') {
        setError(
          language === 'hi'
            ? 'यह नंबर पहले से किसी अन्य खाते से जुड़ा है।'
            : 'This phone number is already linked to another account.'
        );
      } else {
        setError(
          err?.message ||
            (language === 'hi'
              ? 'OTP भेजने में त्रुटि हुई। कृपया पुनः प्रयास करें।'
              : 'Could not send OTP. Please try again.')
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmation) return;
    setError(null);
    setSuccess(null);

    if (!/^\d{6}$/.test(otp.trim())) {
      setError(
        language === 'hi'
          ? 'कृपया 6 अंकों का OTP कोड डालें।'
          : 'Please enter the 6-digit OTP.'
      );
      return;
    }

    setSubmitting(true);
    try {
      await confirmation.confirm(otp.trim());
      await savePhoneNumber(fullPhone);
      setSuccess(
        language === 'hi' ? 'फ़ोन नंबर सत्यापित हो गया!' : 'Phone verified!'
      );
      setTimeout(() => onComplete(), 600);
    } catch (err: any) {
      console.error('verifyOtp failed', err);
      setError(
        err?.code === 'auth/invalid-verification-code'
          ? language === 'hi'
            ? 'अमान्य OTP कोड। कृपया दोबारा जाँचें।'
            : 'Incorrect OTP code. Please check and try again.'
          : err?.message || 'Could not verify OTP.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkipPhone = () => {
    onComplete();
  };

  const stepIndex = step === 'role' ? 1 : step === 'details' ? 2 : 3;
  const pct = Math.round((stepIndex / 3) * 100);

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="h-14 px-5 sm:px-8 flex items-center justify-between border-b bg-card">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-teal-600 flex items-center justify-center text-white font-bold text-sm">
            <Activity01Icon size={16} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-foreground">PULSE</div>
            <div className="text-[10px] uppercase font-medium text-teal-600 dark:text-teal-400">
              Welcome Setup
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
          <span className={step === 'role' ? 'text-teal-600 dark:text-teal-400 font-semibold' : ''}>1. Role</span>
          <span>›</span>
          <span className={step === 'details' ? 'text-teal-600 dark:text-teal-400 font-semibold' : ''}>2. Details</span>
          <span>›</span>
          <span className={step === 'phone' ? 'text-teal-600 dark:text-teal-400 font-semibold' : ''}>3. Phone</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-2xl">
          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-6">
            <div
              className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"
              role="progressbar"
              aria-valuenow={pct}
            >
              <div
                className="h-full bg-teal-600 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider shrink-0">
              {language === 'hi' ? `चरण ${stepIndex} / 3` : `Step ${stepIndex} of 3`}
            </span>
          </div>

          {/* Status banners */}
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-md p-3 text-xs text-destructive animate-fade-in" role="alert">
              <AlertCircleIcon size={15} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="mb-4 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-md p-3 text-xs text-emerald-800 dark:text-emerald-300 animate-fade-in" role="status">
              <CheckmarkCircle02Icon size={15} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{success}</span>
            </div>
          )}

          {/* STEP 1: ROLE */}
          {step === 'role' && (
            <div className="space-y-5 animate-fade-in">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-foreground">
                  {language === 'hi' ? 'PULSE में आपका स्वागत है' : 'Welcome to PULSE'}
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                  {language === 'hi'
                    ? 'शुरू करने के लिए हमें बताइए कि आप ऐप का उपयोग किस रूप में करेंगे।'
                    : 'To get started, choose how you will be using PULSE.'}
                </p>
              </div>

              {/* Name */}
              <div className="space-y-1">
                <label htmlFor="onboarding-name" className="text-xs font-medium text-foreground">
                  {language === 'hi' ? 'आपका नाम (वैकल्पिक)' : 'Your Name (optional)'}
                </label>
                <Input
                  id="onboarding-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={user?.email?.split('@')[0] || 'Full Name'}
                  className="h-9 text-xs"
                />
              </div>

              {/* Role options */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <Card
                  onClick={() => !savingRole && handleSelectRole('patient')}
                  className="p-4 cursor-pointer hover:border-teal-500 transition-all text-left flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {language === 'hi' ? 'मैं मरीज़ हूँ' : 'I am a Patient'}
                        </div>
                        <div className="text-[10px] uppercase font-semibold text-teal-600 dark:text-teal-400">
                          {language === 'hi' ? 'अपनी देखभाल' : 'Self-care'}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {language === 'hi'
                        ? 'अपनी दवाइयाँ, खुराक और रिपोर्ट्स ट्रैक करें।'
                        : 'Track your medicines, schedule reminders, and clinical vitals.'}
                    </p>
                  </div>
                  <div className="pt-3 border-t mt-3 flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold text-xs">
                    {savingRole === 'patient' ? (
                      <>
                        <Loading03Icon size={13} className="animate-spin" />
                        <span>Saving…</span>
                      </>
                    ) : (
                      <>
                        <span>{language === 'hi' ? 'जारी रखें' : 'Continue'}</span>
                        <ArrowRight01Icon size={14} />
                      </>
                    )}
                  </div>
                </Card>

                <Card
                  onClick={() => !savingRole && handleSelectRole('caregiver')}
                  className="p-4 cursor-pointer hover:border-teal-500 transition-all text-left flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
                        <UserGroupIcon size={20} />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-foreground">
                          {language === 'hi' ? 'मैं केयरगिवर हूँ' : 'I am a Caregiver'}
                        </div>
                        <div className="text-[10px] uppercase font-semibold text-teal-600 dark:text-teal-400">
                          {language === 'hi' ? 'किसी की मदद' : 'Caring for others'}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {language === 'hi'
                        ? 'परिवार के सदस्यों की दवाइयाँ और स्थिति ट्रैक करें।'
                        : 'Support family members or patients by monitoring their schedule.'}
                    </p>
                  </div>
                  <div className="pt-3 border-t mt-3 flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold text-xs">
                    {savingRole === 'caregiver' ? (
                      <>
                        <Loading03Icon size={13} className="animate-spin" />
                        <span>Saving…</span>
                      </>
                    ) : (
                      <>
                        <span>{language === 'hi' ? 'जारी रखें' : 'Continue'}</span>
                        <ArrowRight01Icon size={14} />
                      </>
                    )}
                  </div>
                </Card>
              </div>

              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground pt-1">
                <SecurityCheckIcon size={14} className="text-teal-600 dark:text-teal-400" />
                <span>Encrypted and secured clinical data storage</span>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS */}
          {step === 'details' && role && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('role')}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft01Icon size={14} />
                </Button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                    <IdentityCardIcon size={22} className="text-teal-600 dark:text-teal-400" />
                    <span>{language === 'hi' ? 'अपना विवरण भरें' : 'Clinical Profile'}</span>
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {role === 'patient'
                      ? 'Used for dose suggestions, report generation, and emergency SOS contacts.'
                      : 'Used so linked patients and emergency responders can identify you.'}
                  </p>
                </div>
              </div>

              <PersonalDetailsForm
                role={role}
                initial={{
                  fullName: profile?.fullName || displayName || '',
                  dateOfBirth: profile?.dateOfBirth,
                  gender: profile?.gender,
                  bloodGroup: profile?.bloodGroup,
                  heightCm: profile?.heightCm,
                  weightKg: profile?.weightKg,
                  allergies: profile?.allergies,
                  conditions: profile?.conditions,
                  conditionsNotes: profile?.conditionsNotes,
                  emergencyContact: profile?.emergencyContact,
                }}
                submitLabel={language === 'hi' ? 'सेव करें और जारी रखें' : 'Save & Continue'}
                onSubmit={handleSaveDetails}
              />
            </div>
          )}

          {/* STEP 3: PHONE */}
          {step === 'phone' && (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStep('details')}
                  className="h-8 w-8 p-0"
                >
                  <ArrowLeft01Icon size={14} />
                </Button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
                    <Call02Icon size={22} className="text-teal-600 dark:text-teal-400" />
                    <span>{language === 'hi' ? 'फ़ोन सत्यापित करें' : 'Verify Mobile Phone'}</span>
                  </h1>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    For automated medicine dispatch alerts and account recovery.
                  </p>
                </div>
              </div>

              <Card className="p-4 sm:p-5 max-w-lg mx-auto">
                {phoneStage === 'enter' && (
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label htmlFor="onboarding-phone" className="text-xs font-medium text-foreground">
                        {language === 'hi' ? 'मोबाइल नंबर' : 'Mobile Number'}
                      </label>
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1 border rounded-md px-2.5 text-xs font-mono font-medium text-muted-foreground bg-muted/40">
                          <span>+91</span>
                        </div>
                        <Input
                          id="onboarding-phone"
                          type="tel"
                          inputMode="numeric"
                          value={phoneDigits}
                          onChange={(e) => setPhoneDigits(e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder="98765 43210"
                          className="h-9 text-xs font-mono tracking-wider flex-1"
                        />
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={submitting || phoneDigits.length !== 10}
                      className="w-full h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                    >
                      {submitting ? (
                        <>
                          <Loading03Icon size={13} className="animate-spin" />
                          <span>{language === 'hi' ? 'OTP भेज रहे हैं…' : 'Sending OTP…'}</span>
                        </>
                      ) : (
                        <>
                          <span>{language === 'hi' ? 'OTP भेजें' : 'Send OTP'}</span>
                          <ArrowRight01Icon size={14} />
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSkipPhone}
                      disabled={submitting}
                      className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {language === 'hi' ? 'अभी छोड़ें — बाद में जोड़ें' : 'Skip for now'}
                    </Button>
                  </div>
                )}

                {phoneStage === 'otp' && (
                  <div className="space-y-4 animate-fade-in">
                    <div>
                      <div className="text-xs font-semibold text-foreground">
                        {language === 'hi' ? 'OTP डालें' : 'Enter 6-digit OTP'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 flex items-center justify-between">
                        <span>Sent to {fullPhone}</span>
                        <button
                          onClick={() => {
                            setPhoneStage('enter');
                            setOtp('');
                            setConfirmation(null);
                          }}
                          className="text-teal-600 dark:text-teal-400 font-medium cursor-pointer"
                        >
                          Change
                        </button>
                      </div>
                    </div>

                    <Input
                      type="text"
                      inputMode="numeric"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      maxLength={6}
                      className="h-11 text-center font-mono text-xl tracking-[0.3em]"
                    />

                    <Button
                      type="button"
                      onClick={handleVerifyOtp}
                      disabled={submitting || otp.length !== 6}
                      className="w-full h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5"
                    >
                      {submitting ? (
                        <>
                          <Loading03Icon size={13} className="animate-spin" />
                          <span>{language === 'hi' ? 'सत्यापित कर रहे हैं…' : 'Verifying…'}</span>
                        </>
                      ) : (
                        <>
                          <CheckmarkCircle02Icon size={14} />
                          <span>{language === 'hi' ? 'OTP सत्यापित करें' : 'Verify OTP'}</span>
                        </>
                      )}
                    </Button>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleSendOtp}
                      disabled={submitting || resendCountdown > 0}
                      className="w-full h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {resendCountdown > 0 ? `Resend OTP in ${resendCountdown}s` : 'Resend OTP'}
                    </Button>
                  </div>
                )}
              </Card>
            </div>
          )}

          <div id={RECAPTCHA_CONTAINER_ID} />
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
