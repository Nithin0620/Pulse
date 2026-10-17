import { useState } from 'react';
import { loginUser, registerUser } from '../services/authService';
import { useSettings } from '../context/SettingsContext';
import type { LanguageCode } from '../context/SettingsContext';
import {
  Mail01Icon,
  SquareLock01Icon,
  ViewIcon,
  ViewOffSlashIcon,
  ArrowRight01Icon,
  SecurityCheckIcon,
  SparklesIcon,
  Medicine01Icon,
  File01Icon,
  CheckmarkCircle02Icon,
  AlertCircleIcon,
  Activity01Icon,
  Loading03Icon,
} from 'hugeicons-react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

type Mode = 'login' | 'register';

const friendlyError = (code: string | undefined, fallback: string): string => {
  if (!code) return fallback;
  const map: Record<string, string> = {
    'auth/invalid-email': 'That email address looks invalid.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password — please try again.',
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/weak-password': 'Password is too weak — use at least 6 characters.',
    'auth/network-request-failed': 'Network issue — check your connection.',
    'auth/too-many-requests': 'Too many attempts — please wait a minute.',
  };
  return map[code] || fallback;
};

export default function Login() {
  const { language, setLanguage } = useSettings();

  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const isLogin = mode === 'login';

  const tagline =
    language === 'hi'
      ? 'आपका साथी, हर खुराक पर'
      : language === 'ta'
      ? 'ஒவ்வொரு டோசிலும் உங்கள் துணை'
      : 'Your companion, every dose of the way';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await loginUser(email, password);
      } else {
        await registerUser(email, password);
        setSuccess('Account created — signing you in…');
      }
    } catch (err: any) {
      setError(friendlyError(err?.code, err?.message || 'Authentication failed.'));
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setSuccess(null);
    setConfirmPassword('');
  };

  const featureBullets = [
    {
      icon: Medicine01Icon,
      title: language === 'hi' ? 'स्मार्ट दवाई ट्रैकिंग' : 'Smart medicine tracking',
      desc:
        language === 'hi'
          ? 'सुबह से रात तक हर खुराक स्वतः लॉग करें।'
          : 'Log every dose from morning to night, automatically.',
    },
    {
      icon: File01Icon,
      title: language === 'hi' ? 'दस्तावेज़ AI' : 'Document AI',
      desc:
        language === 'hi'
          ? 'पर्चे और रिपोर्ट्स से सीधे सवाल पूछें।'
          : 'Ask questions about your prescriptions and lab reports.',
    },
    {
      icon: SparklesIcon,
      title: language === 'hi' ? '9 भारतीय भाषाएँ' : '9 Indian languages',
      desc:
        language === 'hi'
          ? 'हिंदी, तमिल, गुजराती और बहुत कुछ — आपकी भाषा में।'
          : 'Hindi, Tamil, Gujarati and more — in your language.',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-background text-foreground flex flex-col lg:flex-row">
      {/* Hero / Branding panel — desktop only */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 relative overflow-hidden border-r bg-teal-900 text-white">
        <div className="relative z-10 p-10 xl:p-12 flex flex-col w-full justify-between">
          <div>
            {/* Brand */}
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300 font-bold">
                <Activity01Icon size={20} />
              </div>
              <div className="leading-tight">
                <h1 className="text-xl font-bold tracking-tight text-white">PULSE</h1>
                <span className="text-[11px] font-medium text-teal-300 uppercase tracking-wider">
                  Medication Tracker
                </span>
              </div>
            </div>

            {/* Hero copy */}
            <div className="mt-14">
              <h2 className="text-3xl xl:text-4xl font-semibold text-white leading-tight tracking-tight">
                {tagline}
              </h2>
              <p className="text-teal-100/80 text-sm mt-3 leading-relaxed max-w-sm">
                {language === 'hi'
                  ? 'PULSE आपकी दवाइयों, पर्चों और स्वास्थ्य रिपोर्ट्स को एक सुरक्षित डैशबोर्ड में लाता है।'
                  : 'PULSE brings your medicines, clinical prescriptions, and telemetry into one secure, multilingual dashboard.'}
              </p>
            </div>

            {/* Feature bullets */}
            <div className="mt-8 space-y-3">
              {featureBullets.map(({ icon: Icon, title, desc }, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 bg-teal-950/40 border border-teal-800/40 rounded-lg backdrop-blur-xs"
                >
                  <div className="w-8 h-8 rounded-md bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white">{title}</div>
                    <div className="text-[11px] text-teal-200/70 mt-0.5 leading-relaxed">{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer trust badge */}
          <div className="pt-8 flex items-center gap-1.5 text-xs text-teal-300/80">
            <SecurityCheckIcon size={15} />
            <span>Encrypted by Firebase • Clinical standard</span>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 relative bg-background">
        {/* Language selector */}
        <div className="absolute top-5 right-5 sm:top-6 sm:right-6">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            aria-label="Select language"
            className="h-8 rounded-md border border-input bg-card px-2.5 text-xs text-foreground outline-none focus:ring-2 focus:ring-ring cursor-pointer"
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
        </div>

        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2.5 mb-6">
            <div className="w-9 h-9 rounded-md bg-teal-600 text-white flex items-center justify-center font-bold">
              <Activity01Icon size={18} />
            </div>
            <div className="leading-tight">
              <h1 className="text-lg font-bold text-foreground tracking-tight">PULSE</h1>
              <span className="text-[10px] font-medium text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                Medication Tracker
              </span>
            </div>
          </div>

          {/* Auth card */}
          <Card className="p-5 sm:p-6 shadow-sm border">
            {/* Mode toggle */}
            <div className="flex p-1 bg-muted/50 rounded-lg mb-5 border">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                  isLogin ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {language === 'hi' ? 'लॉग इन' : 'Sign In'}
              </button>
              <button
                type="button"
                onClick={() => switchMode('register')}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors ${
                  !isLogin ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {language === 'hi' ? 'रजिस्टर' : 'Create Account'}
              </button>
            </div>

            <div className="mb-4">
              <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-foreground">
                {isLogin
                  ? language === 'hi'
                    ? 'वापसी पर स्वागत है'
                    : 'Welcome back'
                  : language === 'hi'
                  ? 'अपना अकाउंट बनाएँ'
                  : 'Create account'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isLogin
                  ? 'Access your medication schedule and records.'
                  : 'Start tracking in under a minute.'}
              </p>
            </div>

            {/* Status banners */}
            {error && (
              <div className="mb-4 flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-md p-2.5 text-xs text-destructive animate-fade-in" role="alert">
                <AlertCircleIcon size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="mb-4 flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-md p-2.5 text-xs text-emerald-800 dark:text-emerald-300 animate-fade-in" role="status">
                <CheckmarkCircle02Icon size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div className="space-y-1">
                <label htmlFor="login-email" className="text-xs font-medium text-foreground">
                  {language === 'hi' ? 'ईमेल' : 'Email'}
                </label>
                <div className="relative">
                  <Mail01Icon
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-8 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-password" className="text-xs font-medium text-foreground">
                    {language === 'hi' ? 'पासवर्ड' : 'Password'}
                  </label>
                </div>
                <div className="relative">
                  <SquareLock01Icon
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  />
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete={isLogin ? 'current-password' : 'new-password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-8 pr-8 h-9 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <ViewOffSlashIcon size={14} /> : <ViewIcon size={14} />}
                  </button>
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1 animate-fade-in">
                  <label htmlFor="login-confirm" className="text-xs font-medium text-foreground">
                    {language === 'hi' ? 'पासवर्ड पुष्टि करें' : 'Confirm Password'}
                  </label>
                  <div className="relative">
                    <SquareLock01Icon
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    />
                    <Input
                      id="login-confirm"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="pl-8 h-9 text-xs"
                    />
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-9 text-xs bg-teal-600 hover:bg-teal-700 text-white gap-1.5 mt-1"
              >
                {submitting ? (
                  <>
                    <Loading03Icon size={13} className="animate-spin" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <span>{isLogin ? (language === 'hi' ? 'लॉग इन करें' : 'Sign In') : (language === 'hi' ? 'अकाउंट बनाएँ' : 'Create Account')}</span>
                    <ArrowRight01Icon size={14} />
                  </>
                )}
              </Button>
            </form>

            <div className="text-center mt-4 pt-3 border-t text-xs text-muted-foreground">
              <span>
                {isLogin
                  ? language === 'hi'
                    ? 'अकाउंट नहीं है? '
                    : "Don't have an account? "
                  : language === 'hi'
                  ? 'पहले से अकाउंट है? '
                  : 'Already have an account? '}
              </span>
              <button
                type="button"
                onClick={() => switchMode(isLogin ? 'register' : 'login')}
                className="text-teal-600 dark:text-teal-400 font-semibold hover:underline cursor-pointer ml-1"
              >
                {isLogin ? 'Register' : 'Sign In'}
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
