/**
 * PULSE Shield - Privacy Ledger
 * 
 * Audit trail of all redaction operations.
 * Tracks what was redacted, where it was sent, and to which provider.
 * 
 * Purpose:
 * 1. User transparency (Privacy X-Ray shows this data)
 * 2. Compliance logging (for DISHA/HIPAA audits)
 * 3. Debugging (when privacy issues arise)
 * 4. Performance monitoring
 * 
 * Storage:
 * - In-memory: Unlimited, session-only
 * - localStorage: Last 20 entries, for debugging
 * - Never encrypted (it's on device, user's browser)
 */

import type { AIFeature, PrivacyLogEntry } from './types';

export type { PrivacyLogEntry };

/**
 * Privacy Ledger: Audit trail of redaction operations
 * 
 * Usage:
 * privacyLedger.log({
 *   feature: 'STT',
 *   provider: 'sarvam',
 *   originalText: "My name is Rajesh",
 *   redactedText: "My name is [PATIENT_1]",
 *   entitiesRedacted: ['PATIENT_NAME'],
 *   vaultKey: 'vault_123...'
 * });
 */
class PrivacyLedger {
  private logs: PrivacyLogEntry[] = [];
  private maxLogs = 100; // Keep last 100 in memory
  private storageKey = 'pulse_privacy_ledger';

  constructor() {
    // Load previous logs from localStorage (if available)
    this.loadFromStorage();
    console.log(`[PrivacyLedger] Initialized with ${this.logs.length} previous logs`);
  }

  /**
   * Log a redaction operation
   * 
   * Called by wrapped services after redaction
   * 
   * @param entry - Partial entry (missing id and timestamp)
   */
  public log(
    entry: Omit<PrivacyLogEntry, 'id' | 'timestamp' | 'consentGiven' | 'userVisible'>
  ): void {
    const fullEntry: PrivacyLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      timestamp: new Date(),
      consentGiven: true, // Assume user gave consent if we're here
      userVisible: this.shouldShowInXRay(),
      ...entry,
    };

    // Add to front of array
    this.logs.unshift(fullEntry);

    // Trim to max size
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Persist to localStorage
    this.saveToStorage();

    console.log(
      `[PrivacyLedger] Logged: ${entry.feature} via ${entry.provider} - ${entry.entitiesRedacted.length} entities`
    );
  }

  /**
   * Get all logs
   */
  public getAll(): PrivacyLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs for a specific feature
   */
  public getByFeature(feature: AIFeature): PrivacyLogEntry[] {
    return this.logs.filter(l => l.feature === feature);
  }

  /**
   * Get logs for a specific provider
   */
  public getByProvider(provider: 'sarvam' | 'gemini' | 'local'): PrivacyLogEntry[] {
    return this.logs.filter(l => l.provider === provider);
  }

  /**
   * Get latest log entry (optionally filtered by feature)
   */
  public getLatest(feature?: AIFeature): PrivacyLogEntry | null {
    if (feature) {
      return this.logs.find(l => l.feature === feature) || null;
    }
    return this.logs[0] || null;
  }

  /**
   * Get logs within time range
   */
  public getByTimeRange(startTime: Date, endTime: Date): PrivacyLogEntry[] {
    return this.logs.filter(
      l => l.timestamp >= startTime && l.timestamp <= endTime
    );
  }

  /**
   * Get logs that are user-visible (for Privacy X-Ray)
   */
  public getVisibleLogs(): PrivacyLogEntry[] {
    return this.logs.filter(l => l.userVisible);
  }

  /**
   * Get statistics about redaction operations
   */
  public getStats(): {
    totalLogs: number;
    byFeature: Record<AIFeature, number>;
    byProvider: Record<string, number>;
    totalEntitiesRedacted: number;
    firstLogTime: Date | null;
    lastLogTime: Date | null;
  } {
    const byFeature: Record<string, number> = {};
    const byProvider: Record<string, number> = {};
    let totalEntitiesRedacted = 0;

    for (const log of this.logs) {
      byFeature[log.feature] = (byFeature[log.feature] || 0) + 1;
      byProvider[log.provider] = (byProvider[log.provider] || 0) + 1;
      totalEntitiesRedacted += log.entitiesRedacted.length;
    }

    return {
      totalLogs: this.logs.length,
      byFeature: byFeature as Record<AIFeature, number>,
      byProvider,
      totalEntitiesRedacted,
      firstLogTime: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null,
      lastLogTime: this.logs.length > 0 ? this.logs[0].timestamp : null,
    };
  }

  /**
   * Export logs as CSV for external audit
   */
  public exportCSV(): string {
    const header = 'Timestamp,Feature,Provider,Entities,VaultKey\n';
    const rows = this.logs.map(l =>
      `${l.timestamp.toISOString()},${l.feature},${l.provider},"${l.entitiesRedacted.join(', ')}",${l.vaultKey}`
    ).join('\n');

    return header + rows;
  }

  /**
   * Export logs as JSON for backup
   */
  public exportJSON(): string {
    // Don't include original text in export for privacy
    const sanitized = this.logs.map(l => ({
      ...l,
      originalText: '[REDACTED FOR EXPORT]',
    }));

    return JSON.stringify(sanitized, null, 2);
  }

  /**
   * Clear all logs (for testing or explicit cleanup)
   */
  public clear(): void {
    console.log(`[PrivacyLedger] Clearing ${this.logs.length} logs`);
    this.logs = [];
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Search logs by text pattern
   * Useful for finding redaction of specific PII
   */
  public search(pattern: string | RegExp): PrivacyLogEntry[] {
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'i') : pattern;

    return this.logs.filter(l =>
      regex.test(l.redactedText) || regex.test(l.entitiesRedacted.join(','))
    );
  }

  // ============ Private Methods ============

  /**
   * Check if a log should be visible in Privacy X-Ray
   * User can disable this in settings
   */
  private shouldShowInXRay(): boolean {
    try {
      const settings = JSON.parse(localStorage.getItem('pulse_shield_consent') || '{}');
      return settings.showPrivacyXRay !== false;
    } catch {
      return true; // Show by default
    }
  }

  /**
   * Save logs to localStorage (limited to last 20 for space)
   */
  private saveToStorage(): void {
    try {
      const toStore = this.logs.slice(0, 20).map(l => ({
        ...l,
        originalText: '', // Don't store original text
      }));

      localStorage.setItem(this.storageKey, JSON.stringify(toStore));
    } catch (err) {
      // localStorage quota exceeded - silently fail
      console.warn('[PrivacyLedger] localStorage quota exceeded');
    }
  }

  /**
   * Load logs from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.logs = Array.isArray(parsed) ? parsed : [];
      }
    } catch (err) {
      console.warn('[PrivacyLedger] Failed to load from storage:', err);
    }
  }
}

/**
 * Global singleton instance
 * Used by all services to log redaction operations
 */
export const privacyLedger = new PrivacyLedger();
