/**
 * PULSE Shield - Main Orchestrator
 * 
 * Combines Tier 0 (Regex), Tier 1 (Dictionary), and Tier 2 (NER) redactors
 * into a unified interface.
 * 
 * Workflow:
 * 1. User calls redact(text)
 * 2. Tier 0: Regex patterns detect Aadhaar, phone, email, PIN
 * 3. Tier 1: Dictionary matches patient/family names, conditions
 * 4. Tier 2: (Optional) NER model for remaining entities
 * 5. Return redacted text + vaultKey
 * 
 * User then sends redacted text to cloud API
 * Cloud API returns response with placeholders
 * User calls restore(text, vaultKey) to recover original values
 */

import { tier0Redact, type PIIEntity } from './redactors/tier0-regex';
import { Tier1Dictionary, loadProfileFromStorage } from './redactors/tier1-dictionary';
import { piiVault } from './vault';
import type { UserProfile } from './redactors/tier1-dictionary';

export interface RedactionResult {
  redactedText: string;       // Text with [PLACEHOLDER_N] substitutions
  entities: PIIEntity[];      // All detected PII entities
  vaultKey: string;           // Key to retrieve from vault
  originalLength: number;
  redactedLength: number;
  confidence: number;         // 0-1 score (higher = more confident)
  timestamp: Date;
  tier0Count: number;         // Entities from Tier 0 (regex)
  tier1Count: number;         // Entities from Tier 1 (dictionary)
  tier2Count?: number;        // Entities from Tier 2 (NER, if enabled)
}

export interface RestorationResult {
  restoredText: string;
  entitiesRestored: number;
  timeMs: number;
}

/**
 * PulseShield: Main privacy gateway class
 * 
 * Handles all redaction and restoration operations for PULSE AI calls.
 * This is the primary interface that services and components interact with.
 * 
 * Usage:
 * const shield = new PulseShield();
 * const result = shield.redact("My name is Rajesh Kumar, call 9876543210");
 * 
 * // Send redacted text to cloud API:
 * const response = await sarvamAPI(result.redactedText);
 * 
 * // Restore original text from response:
 * const finalText = shield.restore(response.text, result.vaultKey);
 */
export class PulseShield {
  private tier1: Tier1Dictionary;
  private performanceMetrics = {
    redactCount: 0,
    restoreCount: 0,
    totalRedactionTimeMs: 0,
    totalRestorationTimeMs: 0,
    entitiesRedactedTotal: 0,
  };

  constructor(userProfile?: UserProfile) {
    // Initialize Tier 1 dictionary from profile or storage
    const profile = userProfile || loadProfileFromStorage();
    this.tier1 = new Tier1Dictionary(profile);

    console.log('[PulseShield] Initialized with Tier 0 (Regex) + Tier 1 (Dictionary)');
  }

  /**
   * Update user profile for Tier 1 redaction
   * Call this whenever user profile changes (name, conditions, etc.)
   * 
   * @param profile - Updated user profile
   */
  public updateProfile(profile: UserProfile): void {
    this.tier1.updateProfile(profile);
    console.log('[PulseShield] Profile updated, Tier 1 dictionary rebuilt');
  }

  /**
   * Main redaction function
   * 
   * Process:
   * 1. Apply Tier 0 regex patterns
   * 2. Apply Tier 1 dictionary matching (skipping already-redacted regions)
   * 3. Sort all entities by position
   * 4. Replace in reverse order to preserve indices
   * 5. Store in vault and return result
   * 
   * @param text - Input text to redact
   * @param sourceFeature - Optional identifier for logging ('STT', 'OCR', 'CHAT')
   * @returns RedactionResult with redacted text and vault key
   * 
   * @example
   * const result = shield.redact("मेरा नाम राजेश है", 'STT');
   * console.log(result.redactedText); // "मेरा नाम [PATIENT_NAME_1] है"
   */
  public redact(text: string, sourceFeature?: string): RedactionResult {
    const startTime = performance.now();

    // Tier 0: Regex patterns
    const tier0Entities = tier0Redact(text);

    // Tier 1: Dictionary (skip Tier 0 redacted regions)
    const tier1Entities = this.tier1.redact(text, tier0Entities);

    // Combine and sort by start index (descending, for replacement)
    const allEntities = [...tier0Entities, ...tier1Entities];
    allEntities.sort((a, b) => b.startIndex - a.startIndex); // Reverse order for safe replacement

    // Replace placeholders in reverse order to preserve indices
    let redactedText = text;
    for (const entity of allEntities) {
      const before = redactedText.substring(0, entity.startIndex);
      const after = redactedText.substring(entity.endIndex);
      redactedText = before + entity.placeholder + after;
    }

    // Store in vault
    const vaultKey = piiVault.store(allEntities, sourceFeature);

    const elapsed = performance.now() - startTime;

    // Update metrics
    this.performanceMetrics.redactCount++;
    this.performanceMetrics.totalRedactionTimeMs += elapsed;
    this.performanceMetrics.entitiesRedactedTotal += allEntities.length;

    const result: RedactionResult = {
      redactedText,
      entities: allEntities,
      vaultKey,
      originalLength: text.length,
      redactedLength: redactedText.length,
      confidence: allEntities.length > 0 ? 0.9 : 1.0, // Higher confidence if redacted something
      timestamp: new Date(),
      tier0Count: tier0Entities.length,
      tier1Count: tier1Entities.length,
    };

    console.log(`[PulseShield] Redacted in ${elapsed.toFixed(2)}ms`, {
      tier0: tier0Entities.length,
      tier1: tier1Entities.length,
      total: allEntities.length,
      textSize: `${text.length} → ${redactedText.length} chars`,
      sourceFeature: sourceFeature || 'unknown',
    });

    return result;
  }

  /**
   * Restore original values in text
   * 
   * Reverses redaction by replacing placeholders with original values.
   * Safe to call multiple times with same vaultKey.
   * 
   * @param redactedText - Text containing placeholders
   * @param vaultKey - Key from redaction result
   * @returns Restored text with original values
   * 
   * @example
   * const restored = shield.restore("[PATIENT_1] has condition [CONDITION_1]", vaultKey);
   * // Returns: "Rajesh Kumar has Diabetes"
   */
  public restore(redactedText: string, vaultKey: string): string {
    const startTime = performance.now();
    const restoredText = piiVault.restore(redactedText, vaultKey);
    const elapsed = performance.now() - startTime;

    // Update metrics
    this.performanceMetrics.restoreCount++;
    this.performanceMetrics.totalRestorationTimeMs += elapsed;

    console.log(`[PulseShield] Restored in ${elapsed.toFixed(2)}ms`);

    return restoredText;
  }

  /**
   * Restore multiple fields at once (batch operation)
   * 
   * Useful for prescription extraction where you need to restore
   * multiple fields (doctor, hospital, medicines, etc.)
   * 
   * @example
   * const result = shield.restoreMultiple(
   *   {
   *     doctor: "[DOCTOR_1]",
   *     hospital: "[HOSPITAL_1]",
   *     notes: "[CONDITION_1] management"
   *   },
   *   vaultKey
   * );
   */
  public restoreMultiple(
    fields: Record<string, string>,
    vaultKey: string
  ): Record<string, string> {
    return piiVault.restoreMultiple(fields, vaultKey);
  }

  /**
   * Check if text contains redactable content
   * 
   * Quick check without full redaction (useful for deciding
   * whether to show Privacy Badge or skip redaction entirely)
   * 
   * @param text - Text to check
   * @returns true if PII detected, false otherwise
   */
  public hasRedactableContent(text: string): boolean {
    const tier0Entities = tier0Redact(text);
    return tier0Entities.length > 0;
  }

  /**
   * Get performance metrics
   * Useful for monitoring and optimization
   */
  public getMetrics(): {
    redactCount: number;
    restoreCount: number;
    avgRedactionTimeMs: number;
    avgRestorationTimeMs: number;
    totalEntitiesRedacted: number;
  } {
    return {
      redactCount: this.performanceMetrics.redactCount,
      restoreCount: this.performanceMetrics.restoreCount,
      avgRedactionTimeMs:
        this.performanceMetrics.redactCount > 0
          ? this.performanceMetrics.totalRedactionTimeMs / this.performanceMetrics.redactCount
          : 0,
      avgRestorationTimeMs:
        this.performanceMetrics.restoreCount > 0
          ? this.performanceMetrics.totalRestorationTimeMs / this.performanceMetrics.restoreCount
          : 0,
      totalEntitiesRedacted: this.performanceMetrics.entitiesRedactedTotal,
    };
  }

  /**
   * Get vault statistics
   * Useful for debugging memory usage
   */
  public getVaultStats() {
    return piiVault.getStats();
  }

  /**
   * Reset all metrics and vault
   * Usually called on app startup or for testing
   */
  public reset(): void {
    console.log('[PulseShield] Reset: clearing vault and metrics');
    piiVault.clear();
    this.performanceMetrics = {
      redactCount: 0,
      restoreCount: 0,
      totalRedactionTimeMs: 0,
      totalRestorationTimeMs: 0,
      entitiesRedactedTotal: 0,
    };
  }

  /**
   * Cleanup on app shutdown
   */
  public destroy(): void {
    console.log('[PulseShield] Destroying');
    piiVault.destroy();
  }
}

/**
 * Global singleton instance
 * Used by all services, components, and contexts
 * 
 * Initialize once in App.tsx or main.tsx
 */
export const pulseShield = new PulseShield();

/**
 * Re-exports for convenience
 */
export type { PIIEntity, PIICategory } from './redactors/tier0-regex';
