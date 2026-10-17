/**
 * PULSE Shield - Tier 0 Redaction
 * 
 * Regex-based detection for high-confidence PII patterns:
 * - Aadhaar numbers: 1234-5678-9012 or 1234 5678 9012 or 1234567890012
 * - Phone numbers: +91-9876543210, 09876543210, 9876543210
 * - Email addresses: test@example.com
 * - PIN codes: 560001 (6-digit Indian postal codes)
 * 
 * All patterns use case-insensitive matching where applicable.
 * Patterns are designed to avoid false positives while catching common formats.
 */

export interface PIIEntity {
  original: string;         // "राजेश कुमार" or "Rajesh Kumar"
  placeholder: string;      // "[PATIENT_1]"
  category: PIICategory;    // 'PATIENT_NAME', 'PHONE_NUMBER', etc.
  tier: 0 | 1 | 2;         // Which redactor caught it
  language?: string;        // 'hi', 'ta', 'en', etc.
  startIndex: number;       // Position in text (for replacement)
  endIndex: number;
}

export type PIICategory =
  | 'PATIENT_NAME'
  | 'FAMILY_NAME'
  | 'DOCTOR_NAME'
  | 'HOSPITAL_NAME'
  | 'PHONE_NUMBER'
  | 'EMAIL'
  | 'AADHAAR'
  | 'PIN_CODE'
  | 'ADDRESS'
  | 'BLOOD_GROUP'
  | 'CONDITION';

// Regex patterns for Tier 0 detection
const patterns = {
  // Aadhaar: 1234-5678-9012 or 1234 5678 9012 or 1234567890012
  aadhaar: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,

  // Phone: +91-9876543210, +919876543210, 09876543210, 9876543210
  // Must start with 6-9 after country code
  phone: /(\+91[\s-]?)?[6-9]\d{9}\b/g,

  // Email: test@example.com (standard format)
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // PIN code: 6-digit Indian postal code (100000-999999)
  pincode: /\b[1-9]\d{5}\b/g,
};

/**
 * Detects PII using Tier 0 regex patterns
 * 
 * @param text - Input text to scan for PII
 * @returns Array of detected PII entities with positions
 * 
 * @example
 * const entities = tier0Redact("My name is Rajesh, call +91-9876543210");
 * // Returns: [{ original: "+91-9876543210", placeholder: "[PHONE_1]", ... }]
 */
export function tier0Redact(text: string): PIIEntity[] {
  const entities: PIIEntity[] = [];

  // =========== Aadhaar Detection ===========
  let match: RegExpExecArray | null;
  while ((match = patterns.aadhaar.exec(text)) !== null) {
    entities.push({
      original: match[0],
      placeholder: `[AADHAAR_${entities.filter(e => e.category === 'AADHAAR').length + 1}]`,
      category: 'AADHAAR',
      tier: 0,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // =========== Phone Number Detection ===========
  patterns.phone.lastIndex = 0;
  while ((match = patterns.phone.exec(text)) !== null) {
    entities.push({
      original: match[0],
      placeholder: `[PHONE_${entities.filter(e => e.category === 'PHONE_NUMBER').length + 1}]`,
      category: 'PHONE_NUMBER',
      tier: 0,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // =========== Email Detection ===========
  patterns.email.lastIndex = 0;
  while ((match = patterns.email.exec(text)) !== null) {
    entities.push({
      original: match[0],
      placeholder: `[EMAIL_${entities.filter(e => e.category === 'EMAIL').length + 1}]`,
      category: 'EMAIL',
      tier: 0,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // =========== PIN Code Detection ===========
  patterns.pincode.lastIndex = 0;
  while ((match = patterns.pincode.exec(text)) !== null) {
    entities.push({
      original: match[0],
      placeholder: `[PIN_${entities.filter(e => e.category === 'PIN_CODE').length + 1}]`,
      category: 'PIN_CODE',
      tier: 0,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  console.log(`[Tier0-Regex] Detected ${entities.length} PII entities`, {
    aadhaar: entities.filter(e => e.category === 'AADHAAR').length,
    phone: entities.filter(e => e.category === 'PHONE_NUMBER').length,
    email: entities.filter(e => e.category === 'EMAIL').length,
    pincode: entities.filter(e => e.category === 'PIN_CODE').length,
  });

  return entities;
}

/**
 * Verify that a pattern string matches the expected format
 * Used for testing and validation
 * 
 * @example
 * isValidAadhaar("1234-5678-9012"); // true
 * isValidPhone("+91-9876543210");   // true
 */
export function isValidAadhaar(value: string): boolean {
  const cleanValue = value.replace(/[\s-]/g, '');
  return /^\d{12}$/.test(cleanValue);
}

export function isValidPhone(value: string): boolean {
  const cleanValue = value.replace(/[\s-+]/g, '');
  // Either 10 digits (Indian) or 12 digits with country code
  return /^(91)?[6-9]\d{9}$/.test(cleanValue);
}

export function isValidEmail(value: string): boolean {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/.test(value);
}

export function isValidPinCode(value: string): boolean {
  const cleanValue = value.replace(/[\s-]/g, '');
  return /^[1-9]\d{5}$/.test(cleanValue);
}
