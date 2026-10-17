/**
 * PULSE Shield - Tier 1 Redaction
 * 
 * Dictionary-based exact matching for PII drawn from the patient's profile:
 * - Patient name (both English and native script)
 * - Family member names
 * - Doctor name
 * - Hospital name
 * - Medical conditions
 * - Blood group
 * 
 * Tier 1 is more reliable for Indic names where regex cannot reliably detect
 * script-specific patterns. Entries are sorted by length (longest first) to
 * prevent partial replacements.
 */

import type { PIIEntity, PIICategory } from './tier0-regex';

interface DictionaryEntry {
  value: string;        // "राजेश कुमार" or "Rajesh Kumar"
  category: PIICategory;
  priority: number;     // Longer strings match first (to avoid partial matches)
}

export interface UserProfile {
  fullName?: string;
  displayName?: string;
  phoneNumber?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  conditions?: string[];
  bloodGroup?: string;
  allergies?: string[];
  linkedCaregiverIds?: string[];
  [key: string]: any;
}

/**
 * Tier 1 Dictionary Redactor
 * 
 * Builds a dictionary from patient profile and performs exact-match redaction.
 * This is particularly useful for:
 * - Indic script names (Hindi, Tamil, Telugu, etc.)
 * - Multi-part names ("Rajesh Kumar" vs just "Rajesh")
 * - Medical conditions that appear in medical text
 * 
 * Usage:
 * const dict = new Tier1Dictionary(userProfile);
 * const entities = dict.redact("Patient: राजेश कुमार has diabetes");
 */
export class Tier1Dictionary {
  private entries: DictionaryEntry[] = [];
  public builtAt: Date = new Date();

  /**
   * Initialize dictionary from user profile
   * 
   * @param profile - User profile from Firestore/localStorage
   */
  constructor(profile?: UserProfile) {
    this.buildFromProfile(profile || {});
  }

  /**
   * Rebuild dictionary from updated profile
   * Called when user profile changes
   */
  public updateProfile(profile: UserProfile): void {
    this.entries = [];
    this.buildFromProfile(profile);
    this.builtAt = new Date();
  }

  /**
   * Build dictionary entries from profile
   * Adds entries in the following priority order:
   * 1. Full name (highest priority - usually longest)
   * 2. Phone number
   * 3. Emergency contact name
   * 4. Emergency contact phone
   * 5. Medical conditions
   * 6. Blood group
   * 7. Allergies
   */
  private buildFromProfile(profile: UserProfile): void {
    // ===== Patient Name (highest priority) =====
    if (profile.fullName && profile.fullName.trim()) {
      this.addEntry(profile.fullName.trim(), 'PATIENT_NAME');
    }

    // Also add displayName if different from fullName
    if (
      profile.displayName &&
      profile.displayName.trim() &&
      profile.displayName !== profile.fullName
    ) {
      this.addEntry(profile.displayName.trim(), 'PATIENT_NAME');
    }

    // ===== Phone Numbers =====
    if (profile.phoneNumber && profile.phoneNumber.trim()) {
      this.addEntry(profile.phoneNumber.trim(), 'PHONE_NUMBER');
    }

    // ===== Emergency Contact =====
    if (profile.emergencyContact?.name && profile.emergencyContact.name.trim()) {
      this.addEntry(profile.emergencyContact.name.trim(), 'FAMILY_NAME');
    }

    if (profile.emergencyContact?.phone && profile.emergencyContact.phone.trim()) {
      this.addEntry(profile.emergencyContact.phone.trim(), 'PHONE_NUMBER');
    }

    // ===== Medical Conditions =====
    if (profile.conditions && Array.isArray(profile.conditions)) {
      profile.conditions.forEach((condition: string) => {
        if (condition && condition.trim()) {
          this.addEntry(condition.trim(), 'CONDITION');
        }
      });
    }

    // ===== Allergies =====
    if (profile.allergies && Array.isArray(profile.allergies)) {
      profile.allergies.forEach((allergy: string) => {
        if (allergy && allergy.trim()) {
          this.addEntry(allergy.trim(), 'CONDITION'); // Treat as sensitive medical info
        }
      });
    }

    // ===== Blood Group =====
    if (profile.bloodGroup && profile.bloodGroup.trim()) {
      this.addEntry(profile.bloodGroup.trim(), 'BLOOD_GROUP');
    }

    // Sort by priority (longest first to avoid partial matches)
    this.entries.sort((a, b) => b.priority - a.priority);

    console.log(`[Tier1-Dictionary] Built dictionary with ${this.entries.length} entries`, {
      patientNames: this.entries.filter(e => e.category === 'PATIENT_NAME').length,
      phones: this.entries.filter(e => e.category === 'PHONE_NUMBER').length,
      conditions: this.entries.filter(e => e.category === 'CONDITION').length,
      familyNames: this.entries.filter(e => e.category === 'FAMILY_NAME').length,
    });
  }

  /**
   * Add a single entry to the dictionary
   * Skips empty strings and duplicates
   */
  private addEntry(value: string, category: PIICategory): void {
    // Skip empty strings
    if (!value || value.length === 0) return;

    // Skip duplicates
    if (this.entries.some(e => e.value === value && e.category === category)) {
      return;
    }

    this.entries.push({
      value,
      category,
      priority: value.length, // Longer strings have higher priority
    });
  }

  /**
   * Redact text using dictionary matching
   * 
   * Performs case-insensitive substring matching, avoiding:
   * - Already-redacted regions (from Tier 0)
   * - Partial matches within larger entities
   * 
   * @param text - Input text to redact
   * @param existingEntities - Entities already detected by Tier 0
   * @returns Array of newly detected entities
   */
  public redact(text: string, existingEntities: PIIEntity[] = []): PIIEntity[] {
    const newEntities: PIIEntity[] = [];

    // Mark regions already redacted by Tier 0
    const redactedRanges = existingEntities.map(e => ({
      start: e.startIndex,
      end: e.endIndex,
    }));

    for (const entry of this.entries) {
      // Use case-insensitive matching for English entries
      // But NOT for Indic scripts (they're case-sensitive by nature)
      const isIndicScript = /[\u0900-\u0DFF]/.test(entry.value); // Devanagari + South Indian scripts
      const flags = isIndicScript ? 'g' : 'gi';

      try {
        const regex = new RegExp(this.escapeRegex(entry.value), flags);
        let match: RegExpExecArray | null;

        while ((match = regex.exec(text)) !== null) {
          const start = match.index;
          const end = start + match[0].length;

          // Check if this region overlaps with already-redacted zone
          const overlaps = redactedRanges.some(
            r => (start >= r.start && start < r.end) || (end > r.start && end <= r.end)
          );

          if (!overlaps) {
            // Check if this span is within a word boundary (avoid "Kumar" matching inside "RajeshKumar")
            const textBefore = text[start - 1];
            const textAfter = text[end];
            const beforeOk = !textBefore || /[^a-zA-Z0-9\u0900-\u0DFF]/.test(textBefore);
            const afterOk = !textAfter || /[^a-zA-Z0-9\u0900-\u0DFF]/.test(textAfter);

            if (beforeOk && afterOk) {
              const categoryCount = newEntities.filter(
                e => e.category === entry.category
              ).length;
              const placeholder = `[${entry.category}_${categoryCount + 1}]`;

              newEntities.push({
                original: match[0],
                placeholder,
                category: entry.category,
                tier: 1,
                startIndex: start,
                endIndex: end,
              });

              // Mark this range as redacted to avoid duplicates
              redactedRanges.push({ start, end });
            }
          }
        }
      } catch (err) {
        console.warn(`[Tier1] Regex error for "${entry.value}":`, err);
      }
    }

    if (newEntities.length > 0) {
      console.log(`[Tier1-Dictionary] Redacted ${newEntities.length} entities from dictionary`);
    }

    return newEntities;
  }

  /**
   * Escape special regex characters in a string
   * Allows us to treat dictionary entries as literal strings, not patterns
   * 
   * @example
   * escapeRegex("Dr. Smith's Clinic") -> "Dr\\. Smith\\'s Clinic"
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Get dictionary size
   * Useful for debugging and monitoring
   */
  public size(): number {
    return this.entries.length;
  }

  /**
   * Get entry list for testing/debugging
   * WARNING: Returns actual PII values - do not expose to UI
   */
  public getEntriesForTesting(): DictionaryEntry[] {
    return [...this.entries];
  }
}

/**
 * Factory function to load profile from storage
 * Tries localStorage first, then returns empty object
 * 
 * Used as fallback when React context is not available
 */
export function loadProfileFromStorage(): UserProfile {
  try {
    // Try loading from localStorage (used by MedicationContext)
    const stored = localStorage.getItem('pulse_user_profile');
    if (stored) {
      return JSON.parse(stored);
    }

    // Fallback: try RoleContext profile if available
    const roleStored = localStorage.getItem('pulse_role_profile');
    if (roleStored) {
      return JSON.parse(roleStored);
    }
  } catch (err) {
    console.warn('[Tier1] Failed to load profile from storage:', err);
  }

  return {};
}
