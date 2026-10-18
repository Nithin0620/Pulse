import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFirebase } from '../context/FirebaseContext';
import { useSettings } from '../context/SettingsContext';

interface LoginScreenProps {
  onLoginSuccess?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = () => {
  const { login, signup, error: authError } = useFirebase();
  const { language, setLanguage, t } = useSettings();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLogin = mode === 'login';

  const handleAuth = async () => {
    setErrorMsg(null);
    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both email and password.');
      return;
    }

    if (!isLogin) {
      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await signup(email, password, {
          role: 'patient',
          primaryLanguage: language,
        });
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (role: 'patient' | 'caregiver') => {
    if (role === 'patient') {
      setEmail('patient@pulse.test');
      setPassword('password123');
    } else {
      setEmail('caregiver@pulse.test');
      setPassword('password123');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header / Brand */}
        <View style={styles.brandHeader}>
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>⚡</Text>
          </View>
          <Text style={styles.brandName}>PULSE</Text>
          <Text style={styles.tagline}>
            {language === 'hi'
              ? 'आपका साथी, हर खुराक पर'
              : 'Your companion, every dose of the way'}
          </Text>
        </View>

        {/* Card */}
        <View style={styles.authCard}>
          <Text style={styles.cardTitle}>
            {isLogin
              ? language === 'hi'
                ? 'लॉग इन करें'
                : 'Sign In to PULSE'
              : language === 'hi'
              ? 'नया अकाउंट बनाएँ'
              : 'Create Account'}
          </Text>

          {Boolean(errorMsg || authError) && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMsg || authError}</Text>
            </View>
          )}

          {/* Email input */}
          <Text style={styles.inputLabel}>
            {language === 'hi' ? 'ईमेल' : 'Email Address'}
          </Text>
          <View style={styles.inputWrap}>
            <Ionicons name="mail-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="you@example.com"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password input */}
          <Text style={styles.inputLabel}>
            {language === 'hi' ? 'पासवर्ड' : 'Password'}
          </Text>
          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="••••••••"
              placeholderTextColor="#64748B"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeBtn}
            >
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={18}
                color="#94A3B8"
              />
            </TouchableOpacity>
          </View>

          {/* Confirm Password (if registering) */}
          {!isLogin && (
            <>
              <Text style={styles.inputLabel}>
                {language === 'hi' ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
              </Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#64748B"
                  secureTextEntry={!showPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.submitBtnText}>
                  {isLogin
                    ? language === 'hi'
                      ? 'लॉग इन'
                      : 'Sign In'
                    : language === 'hi'
                    ? 'अकाउंट बनाएँ'
                    : 'Create Account'}
                </Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </View>
            )}
          </TouchableOpacity>

          {/* Switch Mode */}
          <View style={styles.switchModeRow}>
            <Text style={styles.switchModeText}>
              {isLogin
                ? language === 'hi'
                  ? 'अकाउंट नहीं है?'
                  : "Don't have an account?"
                : language === 'hi'
                ? 'पहले से अकाउंट है?'
                : 'Already have an account?'}
            </Text>
            <TouchableOpacity
              onPress={() => {
                setMode(isLogin ? 'register' : 'login');
                setErrorMsg(null);
              }}
            >
              <Text style={styles.switchModeLink}>
                {isLogin
                  ? language === 'hi'
                    ? 'अकाउंट बनाएँ'
                    : 'Register'
                  : language === 'hi'
                  ? 'लॉग इन करें'
                  : 'Sign In'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Quick Demo Fills */}
          <View style={styles.demoSection}>
            <Text style={styles.demoTitle}>Quick Demo Sign-In</Text>
            <View style={styles.demoButtonsRow}>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleDemoFill('patient')}
              >
                <Ionicons name="person" size={14} color="#0D9488" />
                <Text style={styles.demoBtnText}>Patient Demo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => handleDemoFill('caregiver')}
              >
                <Ionicons name="people" size={14} color="#10B981" />
                <Text style={styles.demoBtnText}>Caregiver Demo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Security badge */}
        <View style={styles.securityRow}>
          <Ionicons name="shield-checkmark" size={16} color="#0D9488" />
          <Text style={styles.securityText}>
            Secured by Firebase • Clinical grade encryption
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    minHeight: '100%',
  },
  brandHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 148, 136, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(13, 148, 136, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoEmoji: {
    fontSize: 26,
  },
  brandName: {
    fontSize: 26,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 13,
    color: '#0D9488',
    marginTop: 4,
    textAlign: 'center',
  },
  authCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#FCA5A5',
    fontSize: 12,
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#CBD5E1',
    marginBottom: 6,
    marginTop: 8,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 10,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  eyeBtn: {
    padding: 6,
  },
  submitBtn: {
    backgroundColor: '#0D9488',
    borderRadius: 10,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  switchModeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  switchModeText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  switchModeLink: {
    color: '#0D9488',
    fontSize: 13,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  demoTitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
    marginBottom: 10,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  demoBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 10,
    borderRadius: 8,
  },
  demoBtnText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  securityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 20,
  },
  securityText: {
    color: '#64748B',
    fontSize: 12,
  },
});
