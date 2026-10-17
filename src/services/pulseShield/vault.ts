/**
 * PULSE Shield - PII Vault
 * 
 * Secure in-memory storage for original PII values
 * 
 * Key design principles:
 * 1. Never persists to disk/localStorage (except for vaultKey reference)
 * 2. Auto-expires entries after 1 hour (configurable)
 * 3. Provides restoration of placeholders back to original text
 * 4. Thread-safe cleanup routine to prevent memory leaks
 * 
 * Workflow:
 * 1. PulseShield.redact() stores PII entities in vault
 * 2. Returns vaultKey to caller
 * 3. Caller sends redacted text + vaultKey to cloud API
 * 4. Caregiver/patient receives response with placeholders
 * 5. PulseShield.restore() uses vaultKey to reverse placeholders
 * 6. User sees original names/numbers in the final text
 */

import type { PIIEntity } from './redactors/tier0-regex';

interface VaultEntry {
  vaultKey: string;
  entities: PIIEntity[];
  timestamp: Date;
  expiresAt: Date;
  sourceFeature?: string; // 'STT' | 'OCR' | 'CHAT' | etc. (for debugging)
}

/**
 * PIIVault: Secure in-memory storage for redacted entities
 * 
 * Usage:
 * const vault = new PIIVault();
 * const vaultKey = vault.store(entities);
 * const restored = vault.restore(redactedText, vaultKey);
 */
export class PIIVault {
  private vaultEntries: Map<string, VaultEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private config = {
    expiryMinutes: 60,        // Keep entries for 1 hour
    cleanupIntervalSeconds: 5 * 60, // Check for expired entries every 5 minutes
    maxVaultSize: 1000,       // Maximum entries before warning
  };

  constructor(config?: Partial<typeof PIIVault.prototype.config>) {
    if (config) {
      this.config = { ...this.config, ...config };
    }

    // Start cleanup routine
    this.startCleanupRoutine();

    console.log(
      `[PIIVault] Initialized with ${this.config.expiryMinutes}min expiry, cleanup every ${this.config.cleanupIntervalSeconds}s`
    );
  }

  /**
   * Store PII entities in vault
   * Returns a unique key to retrieve them later
   * 
   * @param entities - Array of PIIEntity objects to store
   * @param sourceFeature - Optional identifier (STT, OCR, CHAT) for debugging
   * @returns Unique vault key for later retrieval
   */
  public store(entities: PIIEntity[], sourceFeature?: string): string {
    const vaultKey = this.generateKey();
    const now = new Date();

    const entry: VaultEntry = {
      vaultKey,
      entities,
      timestamp: now,
      expiresAt: new Date(now.getTime() + this.config.expiryMinutes * 60 * 1000),
      sourceFeature,
    };

    this.vaultEntries.set(vaultKey, entry);

    // Warn if vault is getting too large
    if (this.vaultEntries.size > this.config.maxVaultSize) {
      console.warn(
        `[PIIVault] Large vault size (${this.vaultEntries.size} entries). Consider clearing old entries.`
      );
    }

    console.log(
      `[PIIVault] Stored ${entities.length} entities under key ${vaultKey.slice(0, 8)}... (expires in ${this.config.expiryMinutes}min)`
    );

    return vaultKey;
  }

  /**
   * Retrieve entities from vault
   * Returns null if key not found or entry has expired
   * 
   * @param vaultKey - Key returned by store()
   * @returns Array of PIIEntity objects, or null if not found/expired
   */
  public retrieve(vaultKey: string): PIIEntity[] | null {
    const entry = this.vaultEntries.get(vaultKey);

    if (!entry) {
      console.warn(`[PIIVault] Key not found: ${vaultKey.slice(0, 8)}...`);
      return null;
    }

    // Check expiry
    if (entry.expiresAt < new Date()) {
      console.warn(
        `[PIIVault] Entry expired: ${vaultKey.slice(0, 8)}... (expired ${Date.now() - entry.expiresAt.getTime()}ms ago)`
      );
      this.vaultEntries.delete(vaultKey);
      return null;
    }

    return entry.entities;
  }

  /**
   * Restore original values from redacted text
   * 
   * Replaces all placeholders with original values using the vault key.
   * Works by iterating through entities sorted by placeholder length
   * (longest first) to avoid partial replacements.
   * 
   * @param redactedText - Text containing placeholders like [PATIENT_1]
   * @param vaultKey - Key from store()
   * @returns Restored text with original values, or original if key not found
   * 
   * @example
   * redacted = "Hello [PATIENT_1], your [PHONE_1] is on file"
   * restored = vault.restore(redacted, key);
   * // Returns: "Hello Rajesh Kumar, your +91-9876543210 is on file"
   */
  public restore(redactedText: string, vaultKey: string): string {
    const entities = this.retrieve(vaultKey);

    if (!entities) {
      console.warn(`[PIIVault] Cannot restore: key expired or not found`);
      return redactedText; // Fail gracefully - return original redacted text
    }

    let restored = redactedText;

    // Sort by placeholder length (longest first) to avoid partial replacements
    // e.g., replace "[PATIENT_NAME_1]" before "[PATIENT_1]"
    const sorted = [...entities].sort((a, b) => b.placeholder.length - a.placeholder.length);

    for (const entity of sorted) {
      // Use replaceAll to handle multiple occurrences
      restored = restored.replaceAll(entity.placeholder, entity.original);
    }

    console.log(
      `[PIIVault] Restored ${entities.length} entities (${redactedText.length} → ${restored.length} chars)`
    );

    return restored;
  }

  /**
   * Batch restore: works on multiple texts with same vault key
   * Useful for restoring multiple fields (doctor, hospital, medicines, etc.)
   * 
   * @example
   * const fields = vault.restoreMultiple(
   *   { doctor: "[DOCTOR_1]", hospital: "[HOSPITAL_1]" },
   *   vaultKey
   * );
   * // Returns: { doctor: "Dr. Smith", hospital: "Apollo Hospital" }
   */
  public restoreMultiple(
    fields: Record<string, string>,
    vaultKey: string
  ): Record<string, string> {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(fields)) {
      result[key] = this.restore(value, vaultKey);
    }

    return result;
  }

  /**
   * Get vault statistics (for debugging)
   * Shows size, age distribution, etc.
   */
  public getStats(): {
    totalEntries: number;
    avgEntityCount: number;
    oldestEntryAgeMinutes: number;
    newestEntryAgeSeconds: number;
  } {
    const entries = Array.from(this.vaultEntries.values());
    const now = new Date();

    const totalEntities = entries.reduce((sum, e) => sum + e.entities.length, 0);
    const avgEntityCount = entries.length > 0 ? totalEntities / entries.length : 0;

    const ages = entries.map(e => now.getTime() - e.timestamp.getTime());
    const oldestEntryAgeMinutes = ages.length > 0 ? Math.max(...ages) / (60 * 1000) : 0;
    const newestEntryAgeSeconds = ages.length > 0 ? Math.min(...ages) / 1000 : 0;

    return {
      totalEntries: entries.length,
      avgEntityCount,
      oldestEntryAgeMinutes,
      newestEntryAgeSeconds,
    };
  }

  /**
   * Clear all vault entries (for testing or explicit cleanup)
   */
  public clear(): void {
    console.log(`[PIIVault] Clearing ${this.vaultEntries.size} entries`);
    this.vaultEntries.clear();
  }

  /**
   * Stop the cleanup routine (call on app shutdown)
   */
  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
    console.log('[PIIVault] Destroyed');
  }

  // ============= Private Methods =============

  /**
   * Generate a unique vault key
   * Format: vault_<timestamp>_<random>
   * 
   * Using timestamp ensures keys are sortable, random suffix prevents collisions
   */
  private generateKey(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return `vault_${timestamp}_${random}`;
  }

  /**
   * Start periodic cleanup routine
   * Removes expired entries every cleanupIntervalSeconds
   */
  private startCleanupRoutine(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.config.cleanupIntervalSeconds * 1000);

    // Don't keep Node.js process alive just for cleanup
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Remove expired entries
   * Called automatically every 5 minutes
   */
  private cleanup(): void {
    const now = new Date();
    let removed = 0;

    for (const [key, entry] of this.vaultEntries.entries()) {
      if (entry.expiresAt < now) {
        this.vaultEntries.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[PIIVault] Cleanup: removed ${removed} expired entries (${this.vaultEntries.size} remaining)`);
    }
  }
}

/**
 * Global singleton instance
 * Initialized once on module load, reused across all redaction operations
 */
export const piiVault = new PIIVault({
  expiryMinutes: 60,           // 1 hour
  cleanupIntervalSeconds: 5 * 60, // 5 minutes
  maxVaultSize: 1000,          // Warn at 1000 entries
});

/**
 * Cleanup on app shutdown (for Node.js environments)
 * In browsers, this runs when the page unloads
 */
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    piiVault.destroy();
  });
}
