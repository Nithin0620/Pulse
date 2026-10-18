/**
 * PULSE Shield - Phase 3.2: ConsentDashboard Component
 * 
 * User-facing privacy controls:
 * 1. Master on/off switch for all PulseShield
 * 2. Per-feature toggles (STT, OCR, Chat, SOS, etc.)
 * 3. 3-level control: Off / Redacted Cloud / Local Only
 * 4. Show Privacy X-Ray toggle
 * 5. Log retention settings
 * 
 * Purpose: Give users granular control over their privacy
 * Used in: Settings page, Profile page
 */

import React, { useState } from 'react';
import { Shield, Info, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import type { ConsentSettings, AIFeature, ConsentLevel } from '../services/pulseShield/types';

const FEATURES: Array<{
  key: AIFeature;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    key: 'STT',
    label: 'Voice Input',
    description: 'Speech-to-text for recording medications and SOS calls',
    icon: '🎤',
  },
  {
    key: 'TTS',
    label: 'Voice Output',
    description: 'Text-to-speech for reminders and AI responses',
    icon: '🔊',
  },
  {
    key: 'OCR',
    label: 'Prescription Scan',
    description: 'Extract medicines from uploaded prescription images and PDFs',
    icon: '📄',
  },
  {
    key: 'CHAT',
    label: 'AI Assistant',
    description: 'Chat with AI about medicines and ask private health questions',
    icon: '💬',
  },
  {
    key: 'SOS',
    label: 'Emergency SOS',
    description: 'Record voice emergency calls and get AI triage',
    icon: '🚨',
  },
  {
    key: 'TRANSLATE',
    label: 'Translation',
    description: 'Translate between Indian languages',
    icon: '🌐',
  },
];

const STORAGE_KEY = 'pulse_shield_consent';

function loadSettings(): ConsentSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}

  // Default: all features enabled with redaction
  return {
    globalSwitch: true,
    showPrivacyXRay: true,
    logRetentionDays: 7,
    features: {
      STT: 'REDACTED_CLOUD',
      TTS: 'REDACTED_CLOUD',
      OCR: 'REDACTED_CLOUD',
      CHAT: 'REDACTED_CLOUD',
      SOS: 'REDACTED_CLOUD',
      TRANSLATE: 'REDACTED_CLOUD',
    },
  };
}

function saveSettings(settings: ConsentSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface ConsentDashboardProps {
  onSettingsChange?: (settings: ConsentSettings) => void;
}

export const ConsentDashboard: React.FC<ConsentDashboardProps> = ({ onSettingsChange }) => {
  const [settings, setSettings] = useState<ConsentSettings>(loadSettings());
  const [showInfo, setShowInfo] = useState(false);

  const updateSettings = (newSettings: ConsentSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    onSettingsChange?.(newSettings);
  };

  const toggleFeature = (feature: AIFeature, level: ConsentLevel) => {
    const updated = {
      ...settings,
      features: { ...settings.features, [feature]: level },
    };
    updateSettings(updated);
  };

  const toggleGlobalSwitch = () => {
    const updated = {
      ...settings,
      globalSwitch: !settings.globalSwitch,
    };
    updateSettings(updated);
  };

  const togglePrivacyXRay = () => {
    const updated = {
      ...settings,
      showPrivacyXRay: !settings.showPrivacyXRay,
    };
    updateSettings(updated);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <Shield className="w-8 h-8 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              🛡️ Privacy & AI Controls
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              Manage how your personal information is protected when using AI features. Your data
              is your privacy — choose exactly what level of protection you want.
            </p>
          </div>
          <button
            onClick={() => setShowInfo(!showInfo)}
            className="text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 p-2 rounded-lg transition"
            aria-label="More info"
          >
            <Info className="w-6 h-6" />
          </button>
        </div>

        {showInfo && (
          <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700 space-y-3 text-sm">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Off</p>
                <p className="text-gray-600 dark:text-gray-400">Feature is disabled. No AI calls made.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">🛡️ Protected (Redacted Cloud)</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Your data is redacted before sending to cloud. Names become [PATIENT_1], numbers
                  become [PHONE_1]. Perfect for privacy + full features.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Local Only (Coming Soon)</p>
                <p className="text-gray-600 dark:text-gray-400">
                  Run AI entirely on your phone. Slower but zero cloud transmission. Available in future
                  update.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Master Protection Switch */}
      <div className="bg-white dark:bg-navy-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Master Privacy Protection
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Enable Pulse Shield for all AI features. When disabled, data goes directly to cloud
              APIs without redaction.
            </p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <div
              className={`w-14 h-8 rounded-full transition ${
                settings.globalSwitch
                  ? 'bg-green-500 dark:bg-green-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={settings.globalSwitch}
              onClick={toggleGlobalSwitch}
              style={{ cursor: 'pointer' }}
            >
              <div
                className={`w-7 h-7 bg-white rounded-full shadow transition transform ${
                  settings.globalSwitch ? 'translate-x-7' : 'translate-x-0.5'
                } my-0.5`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Per-Feature Controls */}
      <div className="space-y-3">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white px-1">
          Individual AI Features
        </h4>

        {FEATURES.map(feat => (
          <div
            key={feat.key}
            className="bg-white dark:bg-navy-900 border border-gray-200 dark:border-gray-700 rounded-xl p-4"
          >
            <div className="flex items-start gap-4 mb-4">
              <span className="text-2xl">{feat.icon}</span>
              <div className="flex-1">
                <p className="font-semibold text-gray-900 dark:text-white">{feat.label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feat.description}</p>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-2">
              {/* Off Button */}
              <button
                onClick={() => toggleFeature(feat.key, 'OFF')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  settings.features[feat.key] === 'OFF'
                    ? 'bg-red-100 text-red-800 border-2 border-red-500 dark:bg-red-900/30 dark:text-red-400 dark:border-red-600'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
              >
                <XCircle className="w-4 h-4 inline mr-1" />
                Off
              </button>

              {/* Protected Button (Primary) */}
              <button
                onClick={() => toggleFeature(feat.key, 'REDACTED_CLOUD')}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                  settings.features[feat.key] === 'REDACTED_CLOUD'
                    ? 'bg-green-500 text-white border-2 border-green-600 dark:bg-green-600 dark:border-green-700'
                    : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 dark:hover:bg-gray-700'
                }`}
              >
                <Shield className="w-4 h-4 inline mr-1" />
                🛡️ Protected
              </button>

              {/* Local Only Button (Disabled - coming soon) */}
              <button
                disabled
                className="flex-1 px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-400 border border-gray-300 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 dark:border-gray-600 opacity-50"
                title="Coming in next update"
              >
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Local Only
              </button>
            </div>

            {/* Status Badge */}
            {settings.features[feat.key] === 'OFF' && (
              <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-xs text-red-700 dark:text-red-400 font-medium">
                  ⚠️ This feature is disabled. No AI processing available.
                </p>
              </div>
            )}
            {settings.features[feat.key] === 'REDACTED_CLOUD' && (
              <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">
                  ✅ Protected. Your private data is hidden from cloud AI.
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Privacy X-Ray Toggle */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h4 className="text-lg font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2">
              <Info className="w-5 h-5" />
              Show Privacy X-Ray
            </h4>
            <p className="text-sm text-blue-800 dark:text-blue-400 mt-1">
              View side-by-side comparison of original vs. sent data. Opens Privacy X-Ray modal when you
              tap the privacy badge after each AI operation.
            </p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <div
              className={`w-14 h-8 rounded-full transition ${
                settings.showPrivacyXRay
                  ? 'bg-blue-500 dark:bg-blue-600'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
              role="switch"
              aria-checked={settings.showPrivacyXRay}
              onClick={togglePrivacyXRay}
              style={{ cursor: 'pointer' }}
            >
              <div
                className={`w-7 h-7 bg-white rounded-full shadow transition transform ${
                  settings.showPrivacyXRay ? 'translate-x-7' : 'translate-x-0.5'
                } my-0.5`}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Log Retention */}
      <div className="bg-white dark:bg-navy-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Log Retention</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          How long to keep privacy operation logs for auditing and review.
        </p>

        <div className="flex gap-2">
          {[1, 3, 7, 30].map(days => (
            <button
              key={days}
              onClick={() => updateSettings({ ...settings, logRetentionDays: days })}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                settings.logRetentionDays === days
                  ? 'bg-purple-600 text-white dark:bg-purple-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
              }`}
            >
              {days} {days === 1 ? 'day' : 'days'}
            </button>
          ))}
        </div>
      </div>

      {/* Status Summary */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Protection Status</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Master Switch</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {settings.globalSwitch ? '✅ Active' : '⚠️ Disabled'}
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Protected Features</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">
              {Object.values(settings.features).filter(l => l === 'REDACTED_CLOUD').length}/6
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">Log Retention</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{settings.logRetentionDays} days</p>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <p className="text-sm text-yellow-800 dark:text-yellow-400">
          💡 <strong>Tip:</strong> We recommend keeping all features at "🛡️ Protected" for maximum privacy.
          Your personal data is protected, and you still get all the AI features!
        </p>
      </div>
    </div>
  );
};
