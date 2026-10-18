/**
 * PULSE Shield - Phase 3.1: PrivacyXRay Component
 * 
 * Side-by-side modal showing:
 * 1. Original data (left, red background)
 * 2. Redacted data sent to cloud (right, green background)
 * 3. PII categories that were redacted
 * 4. Which provider received it
 * 5. Timestamp of operation
 * 
 * Purpose: Transparency for users about privacy protection
 * Used in: Privacy badge clicks, Settings page
 */

import React, { useState } from 'react';
import { privacyLedger, type PrivacyLogEntry } from '../services/pulseShield/privacyLedger';
import { X, Shield, Eye, EyeOff, Download, Trash2 } from 'lucide-react';

interface PrivacyXRayProps {
  onClose: () => void;
  initialFeatureFilter?: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  PATIENT_NAME: 'bg-red-100 text-red-800 border-red-300',
  FAMILY_NAME: 'bg-orange-100 text-orange-800 border-orange-300',
  PHONE_NUMBER: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  AADHAAR: 'bg-purple-100 text-purple-800 border-purple-300',
  EMAIL: 'bg-blue-100 text-blue-800 border-blue-300',
  CONDITION: 'bg-green-100 text-green-800 border-green-300',
  BLOOD_GROUP: 'bg-pink-100 text-pink-800 border-pink-300',
  ADDRESS: 'bg-indigo-100 text-indigo-800 border-indigo-300',
};

const FEATURE_ICONS: Record<string, string> = {
  STT: '🎤',
  TTS: '🔊',
  OCR: '📄',
  CHAT: '💬',
  SOS: '🚨',
  TRANSLATE: '🌐',
};

export const PrivacyXRay: React.FC<PrivacyXRayProps> = ({ onClose, initialFeatureFilter }) => {
  const [logs, setLogs] = useState<PrivacyLogEntry[]>(privacyLedger.getAll());
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [filterFeature, setFilterFeature] = useState<string>(initialFeatureFilter || 'ALL');

  // Filter logs
  const filteredLogs = filterFeature === 'ALL' 
    ? logs 
    : logs.filter(l => l.feature === filterFeature);

  const handleExportCSV = () => {
    const csv = privacyLedger.exportCSV();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `privacy-audit-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Clear all privacy logs? This cannot be undone.')) {
      privacyLedger.clear();
      setLogs([]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">🛡️ Privacy X-Ray</h2>
              <p className="text-purple-100 text-sm">See exactly what was redacted and sent to cloud APIs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-6">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 p-4 rounded-lg border border-red-200 dark:border-red-700">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Total Operations</p>
              <p className="text-2xl font-bold text-red-800 dark:text-red-300">{logs.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-lg border border-green-200 dark:border-green-700">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">PII Redacted</p>
              <p className="text-2xl font-bold text-green-800 dark:text-green-300">
                {logs.reduce((sum, l) => sum + l.entitiesRedacted.length, 0)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-lg border border-blue-200 dark:border-blue-700">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Providers</p>
              <p className="text-2xl font-bold text-blue-800 dark:text-blue-300">
                {new Set(logs.map(l => l.provider)).size}
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-lg border border-purple-200 dark:border-purple-700">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Protected Since</p>
              <p className="text-lg font-bold text-purple-800 dark:text-purple-300">
                {logs.length > 0 ? new Date(logs[logs.length - 1].timestamp).toLocaleTimeString() : '—'}
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 pb-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
            {['ALL', 'STT', 'OCR', 'CHAT', 'SOS', 'TTS', 'TRANSLATE'].map(feature => (
              <button
                key={feature}
                onClick={() => setFilterFeature(feature)}
                className={`px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                  filterFeature === feature
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {FEATURE_ICONS[feature] || '📊'} {feature}
              </button>
            ))}
          </div>

          {/* Logs List */}
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">No privacy operations yet</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                Your data will be shown here as you use PULSE
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredLogs.map(log => (
                <div
                  key={log.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition hover:shadow-md"
                >
                  {/* Summary Row */}
                  <div
                    onClick={() =>
                      setExpandedLogId(expandedLogId === log.id ? null : log.id)
                    }
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer bg-gray-50/50 dark:bg-gray-800/20"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-2xl">{FEATURE_ICONS[log.feature] || '📊'}</span>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {log.feature} Operation
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(log.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full text-sm font-medium">
                          {log.provider}
                        </span>
                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 rounded-full text-sm font-medium">
                          {log.entitiesRedacted.length} redacted
                        </span>
                        {expandedLogId === log.id ? (
                          <EyeOff className="w-5 h-5 text-purple-600" />
                        ) : (
                          <Eye className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Category Badges */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {log.entitiesRedacted.map((cat: string, idx: number) => (
                        <span
                          key={idx}
                          className={`px-2.5 py-1 rounded-full text-xs font-medium border ${CATEGORY_COLORS[cat] || 'bg-gray-100 text-gray-800'}`}
                        >
                          {cat.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedLogId === log.id && (
                    <div className="border-t border-gray-200 dark:border-gray-700 p-4 space-y-4 bg-white dark:bg-navy-900">
                      {/* Original Data */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-red-600 dark:text-red-400">
                            ❌ ORIGINAL (NOT sent to {log.provider})
                          </p>
                          <p className="text-xs text-gray-500">Your device only</p>
                        </div>
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-3 rounded-lg">
                          <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                            {log.originalText || '(too large to display)'}
                          </p>
                        </div>
                      </div>

                      {/* Redacted Data */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                            ✅ REDACTED (SENT to {log.provider})
                          </p>
                          <p className="text-xs text-gray-500">Cloud received this</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 p-3 rounded-lg">
                          <p className="text-sm font-mono text-gray-800 dark:text-gray-200 break-all">
                            {log.redactedText}
                          </p>
                        </div>
                      </div>

                      {/* Comparison */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Original Size</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {log.originalText?.length || 0} chars
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Redacted Size</p>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">
                            {log.redactedText.length} chars
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        {logs.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex gap-2 justify-end shrink-0 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </button>
            <button
              onClick={handleClear}
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 dark:bg-red-900/30 dark:hover:bg-red-900/50 dark:text-red-400 rounded-lg font-medium transition"
            >
              <Trash2 className="w-4 h-4" />
              Clear Logs
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
