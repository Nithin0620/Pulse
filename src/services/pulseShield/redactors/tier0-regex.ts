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
  | 'CONDITION'
  | 'DATE_OF_BIRTH'
  | 'AGE'
  | 'GENDER'
  | 'MRN';

// Regex patterns for Tier 0 detection
const patterns = {
  // Aadhaar: 1234-5678-9012 or 1234 5678 9012 or 1234567890012
  aadhaar: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,

  // Phone: Supports both Indian and US formats
  // Indian: +91-9876543210, 09876543210, 9876543210 (starts with 6-9)
  // US: (555)777-7777, 555-777-7777, +1-555-777-7777
  phone: /(\+91[\s-]?)?[6-9]\d{9}\b|(\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,

  // Email: test@example.com (standard format)
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // PIN code: 6-digit Indian postal code (100000-999999)
  pincode: /\b[1-9]\d{5}\b/g,

  // Date of Birth: MM/DD/YYYY or DD/MM/YYYY or YYYY-MM-DD formats
  dob: /\b(?:Birthdate|DOB|Date of Birth|Birth Date)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})\b/gi,

  // Age: "Age: 67 Years" or "67 years old" or "Age 67"
  age: /\b(?:Age|aged)[\s:]*(\d{1,3})\s*(?:years?|yrs?|y\.o\.|year old|years old)/gi,

  // Gender: Male/Female/M/F with context
  gender: /\b(?:Sex|Gender)[\s:]*(?:MALE|FEMALE|M|F|Male|Female)\b/gi,

  // MRN (Medical Record Number): Various formats
  mrn: /\bMRN[\s:]*[A-Z0-9-]+/gi,

  // US ZIP codes: 12345 or 12345-6789 (5 or 9 digits)
  zipCode: /\b\d{5}(?:-\d{4})?\b/g,
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

  // =========== Date of Birth Detection ===========
  patterns.dob.lastIndex = 0;
  while ((match = patterns.dob.exec(text)) !== null) {
    entities.push({
      original: match[0],
      placeholder: `[DOB_${entities.filter(e => e.category === 'DATE_OF_BIRTH').length + 1}]`,
      category: 'DATE_OF_BIRTH',
      tier: 0,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // =========== Age Detection ===========
  patterns.age.lastIndex = 0;
  while ((match = patterns.age.exec(text)) !== null) {
    entities.push({
      original: match[0],
      placeholder: `[AGE_${entities.filter(e => e.category === 'AGE').length + 1}]`,
      category: 'AGE',
      tier: 0,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // =========== Gender Detection ===========
  patterns.gender.lastIndex = 0;
  while ((match = patterns.gender.exec(text)) !== null) {
    entities.push({
      original: match[0],
      placeholder: `[GENDER_${entities.filter(e => e.category === 'GENDER').length + 1}]`,
      category: 'GENDER',
      tier: 0,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // =========== MRN Detection ===========
  patterns.mrn.lastIndex = 0;
  while ((match = patterns.mrn.exec(text)) !== null) {
    entities.push({
      original: match[0],
      placeholder: `[MRN_${entities.filter(e => e.category === 'MRN').length + 1}]`,
      category: 'MRN',
      tier: 0,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
    });
  }

  // =========== ZIP Code Detection ===========
  patterns.zipCode.lastIndex = 0;
  while ((match = patterns.zipCode.exec(text)) !== null) {
    // Skip if it looks like a date (e.g., 32015 in "04/1 32015")
    const before = text.substring(Math.max(0, match.index - 10), match.index);
    if (/\d{1,2}\/\d{1,2}\s*$/.test(before)) continue;

    entities.push({
      original: match[0],
      placeholder: `[ZIP_${entities.filter(e => e.category === 'PIN_CODE').length + 1}]`,
      category: 'PIN_CODE', // Use PIN_CODE category for ZIP codes too
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
    dob: entities.filter(e => e.category === 'DATE_OF_BIRTH').length,
    age: entities.filter(e => e.category === 'AGE').length,
    gender: entities.filter(e => e.category === 'GENDER').length,
    mrn: entities.filter(e => e.category === 'MRN').length,
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
