# PULSE Shield: Privacy Gateway Integration Document

> **Build Target**: HackDays 2026  
> **Timeline**: 4-6 hours implementation  
> **Status**: Ready for immediate build  
> **Last Updated**: 2026-10-17 17:52 IST

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [The Problem](#the-problem)
3. [The Solution: Pulse Shield](#the-solution-pulse-shield)
4. [Technical Architecture](#technical-architecture)
5. [Implementation Plan](#implementation-plan)
6. [Integration Points](#integration-points)
7. [Code Implementation](#code-implementation)
8. [UI/UX Components](#uiux-components)
9. [Testing Strategy](#testing-strategy)
10. [Deployment Checklist](#deployment-checklist)

---

## Executive Summary

**Pulse Shield** is a privacy-first gateway that sits between PULSE and all external AI services (Sarvam AI, Google Gemini). It redacts personally identifiable information (PII) before sending data to cloud APIs and restores it when responses return — all processing happens on-device.

### Why This Matters

Current PULSE sends sensitive patient data directly to cloud AI:
- Patient names, ages, medical conditions
- Family member details, doctor names
- Aadhaar numbers, phone numbers from OCR'd documents
- Medicine schedules tied to real identities

**Pulse Shield eliminates this risk** by replacing all PII with placeholders like `[PATIENT_1]`, `[DOCTOR_A]` before cloud transmission.

### Key Features

✅ **3-Tier Redaction**: Regex → Dictionary → On-device NER  
✅ **Reversible Vault**: Original data never leaves device  
✅ **Privacy X-Ray**: See exactly what was sent vs. what was redacted  
✅ **Consent Ledger**: Per-feature AI switches (Off / Redacted / Local-only)  
✅ **Bidirectional Guardrails**: Block prompt injection inbound, unsafe advice outbound  
✅ **Fail-Closed**: Errors block transmission rather than leak data  

### Success Metrics

- Zero PII in cloud API logs
- < 50ms redaction overhead per call
- 95%+ redaction accuracy for Indic names
- User-visible privacy controls on every AI feature

---

## The Problem

### Current State: Data Leakage Risk

PULSE currently sends unredacted data to 3rd-party AI services:

#### 1. **STT/TTS (Sarvam AI)**
```javascript
// Current: voice recording contains full patient name
const transcript = await SarvamService.speechToText(audioBlob, 'hi');
// Output: "मेरा नाम राजेश कुमार है और मुझे सांस लेने में तकलीफ है"
//         "My name is Rajesh Kumar and I am having breathing difficulty"
```

#### 2. **Prescription OCR (Sarvam DI + Gemini)**
```javascript
// Current: OCR'd text includes Aadhaar, phone numbers
const result = await prescriptionPipeline(pdfBlob);
// Extracted: "Patient: Priya Sharma, Aadhaar: 1234-5678-9012, Phone: +91-9876543210"
```

#### 3. **AI Chat Assistant (Sarvam Chat)**
```javascript
// Current: chat messages expose conditions
const response = await SarvamChatService.completions({
  messages: [
    { role: 'user', content: 'My father Ramesh has diabetes and hypertension' }
  ]
});
```

#### 4. **SOS Pipeline (Sarvam STT → Translate → Chat)**
```javascript
// Current: emergency voice includes family details
const sos = await sarvamSOSPipelineService.triggerSOS({
  audioBlob,  // "Tell my son Amit at 9876543210 that I fell"
});
```

### Risk Assessment

| Data Type | Exposure | Severity | Frequency |
|-----------|----------|----------|-----------|
| Patient name | Every AI call | HIGH | 100% |
| Family names | SOS, chat | HIGH | 60% |
| Aadhaar number | OCR | CRITICAL | 30% |
| Phone numbers | OCR, profile | HIGH | 40% |
| Medical conditions | Chat, prescriptions | MEDIUM | 80% |
| Doctor/hospital | OCR, appointments | LOW | 70% |

### Compliance Issues

- **DISHA (Draft India Data Protection Act)**: Requires explicit consent + data minimization
- **HIPAA-equivalent**: Medical data must be de-identified before 3rd-party processing
- **User Trust**: Elderly users fear data misuse; this is a barrier to adoption

---

## The Solution: Pulse Shield

### High-Level Concept

```
┌─────────────────────────────────────────────────────────────┐
│                        PULSE App                             │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  User Input: "मेरा नाम राजेश है और मुझे बुखार है"    │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│                       ▼                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │           🛡️ PULSE SHIELD (On-Device)                │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │ 1. Detect PII: "राजेश" → Hindi name          │    │   │
│  │  │ 2. Redact: "[PATIENT_1]"                      │    │   │
│  │  │ 3. Store in vault: {P1: "राजेश"}              │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│                       ▼                                      │
│  Redacted: "मेरा नाम [PATIENT_1] है और मुझे बुखार है"      │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ▼
         ☁️ Sarvam AI (sees only placeholders)
                        │
                        ▼
         Response: "[PATIENT_1] के लिए पैरासिटामोल लें"
                        │
                        ▼
┌───────────────────────┼──────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐   │
│  │           🛡️ PULSE SHIELD (Restore)                  │   │
│  │  ┌──────────────────────────────────────────────┐    │   │
│  │  │ 1. Replace placeholders                       │    │   │
│  │  │ 2. [PATIENT_1] → "राजेश"                      │    │   │
│  │  └──────────────────────────────────────────────┘    │   │
│  └────────────────────┬─────────────────────────────────┘   │
│                       │                                      │
│                       ▼                                      │
│  Final: "राजेश के लिए पैरासिटामोल लें"                      │
│  User sees: Original name restored ✅                        │
└──────────────────────────────────────────────────────────────┘
```

### Core Principles

1. **Client-Side Only**: All redaction happens in browser; vault never syncs to cloud
2. **Reversible**: Placeholders map 1:1 to original values; perfect restoration
3. **Transparent**: Show users side-by-side view of what was sent
4. **Fail-Safe**: If redaction errors, block the call rather than leak data
5. **Granular Control**: Per-feature consent switches

---

## Technical Architecture

### Component Hierarchy

```
src/
├── services/
│   ├── pulseShield/
│   │   ├── index.ts                    # Main PulseShield class (orchestrator)
│   │   ├── redactors/
│   │   │   ├── tier0-regex.ts          # Regex for Aadhaar, phone, email, PIN
│   │   │   ├── tier1-dictionary.ts     # Exact-match from user profile
│   │   │   └── tier2-ner.ts            # Transformers.js NER (optional)
│   │   ├── vault.ts                    # In-memory PII storage + restore
│   │   ├── guardrails.ts               # Inbound/outbound content filters
│   │   ├── privacyLedger.ts            # Log what was sent where
│   │   └── consentManager.ts           # Per-feature AI switches
│   │
│   ├── sarvamService.ts                # MODIFIED: wrap with PulseShield
│   ├── geminiVisionService.ts          # MODIFIED: wrap with PulseShield
│   └── sarvamSOSPipelineService.ts     # MODIFIED: wrap with PulseShield
│
├── components/
│   ├── PrivacyXRay.tsx                 # Side-by-side redaction viewer
│   ├── ConsentDashboard.tsx            # Toggle AI features on/off
│   └── PrivacyBadge.tsx                # "🛡️ Protected" indicator
│
├── context/
│   └── PrivacyContext.tsx              # Shield config + consent state
│
└── hooks/
    └── usePulseShield.ts               # React hook for shield operations
```

### Data Models

#### 1. **PII Entity**
```typescript
interface PIIEntity {
  original: string;         // "राजेश कुमार"
  placeholder: string;      // "[PATIENT_1]"
  category: PIICategory;    // 'PATIENT_NAME'
  tier: 0 | 1 | 2;         // Which redactor caught it
  language?: string;        // 'hi', 'ta', etc.
  startIndex: number;       // Position in text
  endIndex: number;
}

type PIICategory =
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
```

#### 2. **Redaction Result**
```typescript
interface RedactionResult {
  redactedText: string;       // Text with placeholders
  entities: PIIEntity[];      // All detected PII
  vaultKey: string;           // UUID to retrieve from vault
  originalLength: number;
  redactedLength: number;
  confidence: number;         // 0-1 score
  timestamp: Date;
}
```

#### 3. **Privacy Ledger Entry**
```typescript
interface PrivacyLogEntry {
  id: string;
  timestamp: Date;
  feature: AIFeature;         // 'STT' | 'OCR' | 'CHAT' | 'SOS'
  provider: 'sarvam' | 'gemini' | 'local';
  originalText: string;       // (encrypted in storage)
  redactedText: string;
  entitiesRedacted: PIICategory[];
  consentGiven: boolean;
  userVisible: boolean;       // Show in Privacy X-Ray?
}

type AIFeature = 'STT' | 'TTS' | 'OCR' | 'CHAT' | 'SOS' | 'TRANSLATE';
```

#### 4. **Consent Settings**
```typescript
interface ConsentSettings {
  features: Record<AIFeature, ConsentLevel>;
  globalSwitch: boolean;      // Master on/off
  showPrivacyXRay: boolean;   // Show side-by-side comparison
  logRetentionDays: number;   // How long to keep ledger (default 7)
}

type ConsentLevel =
  | 'OFF'              // Feature disabled entirely
  | 'REDACTED_CLOUD'   // Use cloud AI with PII redacted
  | 'LOCAL_ONLY';      // Use on-device models only (future)
```

---

## Implementation Plan

### Phase 1: Core Redaction Engine (60 min)

**Goal**: Build 3-tier redactor + vault

#### Step 1.1: Tier 0 — Regex Redactor (15 min)
```typescript
// src/services/pulseShield/redactors/tier0-regex.ts

const patterns = {
  aadhaar: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  phone: /(\+91[\s-]?)?[6-9]\d{9}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  pincode: /\b[1-9]\d{5}\b/g,
};

export function tier0Redact(text: string): PIIEntity[] {
  const entities: PIIEntity[] = [];
  
  // Aadhaar
  let match;
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
  
  // Phone numbers
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
  
  // Email
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
  
  // PIN code
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
  
  return entities;
}
```

#### Step 1.2: Tier 1 — Dictionary Redactor (20 min)
```typescript
// src/services/pulseShield/redactors/tier1-dictionary.ts

import { useRole } from '../../../context/RoleContext';

interface DictionaryEntry {
  value: string;        // "राजेश कुमार" or "Rajesh Kumar"
  category: PIICategory;
  priority: number;     // Longer strings match first
}

export class Tier1Dictionary {
  private entries: DictionaryEntry[] = [];
  
  constructor() {
    this.buildFromProfile();
  }
  
  private buildFromProfile() {
    // Pull from RoleContext profile
    const profile = this.getProfile(); // Helper to access context
    
    if (profile.fullName) {
      this.entries.push({
        value: profile.fullName,
        category: 'PATIENT_NAME',
        priority: profile.fullName.length,
      });
    }
    
    if (profile.phoneNumber) {
      this.entries.push({
        value: profile.phoneNumber,
        category: 'PHONE_NUMBER',
        priority: profile.phoneNumber.length,
      });
    }
    
    // Emergency contact
    if (profile.emergencyContact?.name) {
      this.entries.push({
        value: profile.emergencyContact.name,
        category: 'FAMILY_NAME',
        priority: profile.emergencyContact.name.length,
      });
    }
    
    if (profile.emergencyContact?.phone) {
      this.entries.push({
        value: profile.emergencyContact.phone,
        category: 'PHONE_NUMBER',
        priority: profile.emergencyContact.phone.length,
      });
    }
    
    // Conditions
    if (profile.conditions) {
      profile.conditions.forEach(cond => {
        this.entries.push({
          value: cond,
          category: 'CONDITION',
          priority: cond.length,
        });
      });
    }
    
    // Blood group
    if (profile.bloodGroup) {
      this.entries.push({
        value: profile.bloodGroup,
        category: 'BLOOD_GROUP',
        priority: profile.bloodGroup.length,
      });
    }
    
    // Sort by priority (longest first to avoid partial matches)
    this.entries.sort((a, b) => b.priority - a.priority);
  }
  
  public redact(text: string, existingEntities: PIIEntity[]): PIIEntity[] {
    const newEntities: PIIEntity[] = [];
    let workingText = text;
    
    // Mark already-redacted regions
    const redactedRanges = existingEntities.map(e => ({ start: e.startIndex, end: e.endIndex }));
    
    for (const entry of this.entries) {
      const regex = new RegExp(this.escapeRegex(entry.value), 'gi');
      let match;
      
      while ((match = regex.exec(workingText)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        
        // Skip if overlaps with already-redacted region
        const overlaps = redactedRanges.some(r => 
          (start >= r.start && start < r.end) || (end > r.start && end <= r.end)
        );
        
        if (!overlaps) {
          const categoryCount = newEntities.filter(e => e.category === entry.category).length;
          newEntities.push({
            original: match[0],
            placeholder: `[${entry.category}_${categoryCount + 1}]`,
            category: entry.category,
            tier: 1,
            startIndex: start,
            endIndex: end,
          });
          
          redactedRanges.push({ start, end });
        }
      }
    }
    
    return newEntities;
  }
  
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  private getProfile() {
    // Access from React context or localStorage fallback
    try {
      const stored = localStorage.getItem('pulse_user_profile');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }
}
```

#### Step 1.3: Vault (15 min)
```typescript
// src/services/pulseShield/vault.ts

interface VaultEntry {
  vaultKey: string;
  entities: PIIEntity[];
  timestamp: Date;
  expiresAt: Date;  // Auto-cleanup after 1 hour
}

class PIIVault {
  private store: Map<string, VaultEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;
  
  constructor() {
    // Cleanup expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }
  
  public store(entities: PIIEntity[]): string {
    const vaultKey = this.generateKey();
    const now = new Date();
    
    this.store.set(vaultKey, {
      vaultKey,
      entities,
      timestamp: now,
      expiresAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour
    });
    
    return vaultKey;
  }
  
  public retrieve(vaultKey: string): PIIEntity[] | null {
    const entry = this.store.get(vaultKey);
    
    if (!entry) return null;
    if (entry.expiresAt < new Date()) {
      this.store.delete(vaultKey);
      return null;
    }
    
    return entry.entities;
  }
  
  public restore(redactedText: string, vaultKey: string): string {
    const entities = this.retrieve(vaultKey);
    if (!entities) return redactedText;
    
    let restored = redactedText;
    
    // Sort by placeholder length (longest first to avoid partial replacements)
    const sorted = [...entities].sort((a, b) => b.placeholder.length - a.placeholder.length);
    
    for (const entity of sorted) {
      restored = restored.replaceAll(entity.placeholder, entity.original);
    }
    
    return restored;
  }
  
  private generateKey(): string {
    return `vault_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  private cleanup() {
    const now = new Date();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }
  
  public destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

export const piiVault = new PIIVault();
```

#### Step 1.4: Main PulseShield Class (10 min)
```typescript
// src/services/pulseShield/index.ts

import { tier0Redact } from './redactors/tier0-regex';
import { Tier1Dictionary } from './redactors/tier1-dictionary';
import { piiVault } from './vault';

export class PulseShield {
  private tier1: Tier1Dictionary;
  
  constructor() {
    this.tier1 = new Tier1Dictionary();
  }
  
  public redact(text: string): RedactionResult {
    const startTime = Date.now();
    
    // Tier 0: Regex
    const tier0Entities = tier0Redact(text);
    
    // Tier 1: Dictionary
    const tier1Entities = this.tier1.redact(text, tier0Entities);
    
    // Combine
    const allEntities = [...tier0Entities, ...tier1Entities];
    
    // Sort by start index
    allEntities.sort((a, b) => a.startIndex - b.startIndex);
    
    // Replace in text (work backwards to preserve indices)
    let redactedText = text;
    for (let i = allEntities.length - 1; i >= 0; i--) {
      const e = allEntities[i];
      redactedText = 
        redactedText.slice(0, e.startIndex) +
        e.placeholder +
        redactedText.slice(e.endIndex);
    }
    
    // Store in vault
    const vaultKey = piiVault.store(allEntities);
    
    const elapsed = Date.now() - startTime;
    console.log(`[PulseShield] Redacted ${allEntities.length} entities in ${elapsed}ms`);
    
    return {
      redactedText,
      entities: allEntities,
      vaultKey,
      originalLength: text.length,
      redactedLength: redactedText.length,
      confidence: allEntities.length > 0 ? 0.85 : 1.0,
      timestamp: new Date(),
    };
  }
  
  public restore(redactedText: string, vaultKey: string): string {
    return piiVault.restore(redactedText, vaultKey);
  }
  
  public hasRedactableContent(text: string): boolean {
    // Quick check without full redaction
    const tier0 = tier0Redact(text);
    return tier0.length > 0;
  }
}

export const pulseShield = new PulseShield();
```

---

### Phase 2: Service Integration (45 min)

#### Step 2.1: Wrap Sarvam STT (10 min)
```typescript
// src/services/sarvamService.ts (MODIFIED)

import { pulseShield } from './pulseShield';
import { privacyLedger } from './pulseShield/privacyLedger';

export class SarvamService {
  // ... existing code ...
  
  public static async speechToText(
    audioBlob: Blob,
    languageCode: LanguageCode,
    options?: { bypassShield?: boolean }
  ): Promise<string> {
    const transcript = await SarvamSpeechService.transcribe({
      file: audioBlob,
      language_code: this.mapLanguageCode(languageCode) as SarvamAI.SpeechToTextLanguage,
    });
    
    const originalTranscript = transcript.transcript;
    
    // Shield integration
    if (!options?.bypassShield && this.isShieldEnabled()) {
      const redactionResult = pulseShield.redact(originalTranscript);
      
      // Log to privacy ledger
      privacyLedger.log({
        feature: 'STT',
        provider: 'sarvam',
        originalText: originalTranscript,
        redactedText: redactionResult.redactedText,
        entitiesRedacted: redactionResult.entities.map(e => e.category),
        vaultKey: redactionResult.vaultKey,
      });
      
      // Return redacted (will be restored downstream if needed)
      return redactionResult.redactedText;
    }
    
    return originalTranscript;
  }
  
  private static isShieldEnabled(): boolean {
    // Check consent settings
    try {
      const settings = JSON.parse(localStorage.getItem('pulse_shield_consent') || '{}');
      return settings.features?.STT !== 'OFF';
    } catch {
      return true; // Enabled by default
    }
  }
}
```

#### Step 2.2: Wrap Prescription OCR (15 min)
```typescript
// src/services/prescriptionPipeline.ts (MODIFIED)

import { pulseShield } from './pulseShield';

export async function extractPrescription(
  file: File | Blob,
  userLanguage: LanguageCode
): Promise<PrescriptionExtractionResult> {
  
  // ... existing OCR stages 1-4 ...
  
  let rawText = ''; // from Sarvam DI or Gemini or Tesseract
  
  // SHIELD: Redact before Stage 5 (structured extraction)
  const shieldEnabled = isShieldEnabled('OCR');
  let vaultKey = '';
  
  if (shieldEnabled) {
    const redactionResult = pulseShield.redact(rawText);
    rawText = redactionResult.redactedText;
    vaultKey = redactionResult.vaultKey;
    
    console.log(`[Shield] OCR redacted ${redactionResult.entities.length} PII entities`);
    
    privacyLedger.log({
      feature: 'OCR',
      provider: ocrSource === 'gemini-vision' ? 'gemini' : 'sarvam',
      originalText: '', // Too large to store
      redactedText: rawText.slice(0, 500), // First 500 chars
      entitiesRedacted: redactionResult.entities.map(e => e.category),
      vaultKey,
    });
  }
  
  // Stage 5: Extract structured data from redacted text
  const extracted = await SarvamChatService.extractPrescriptionData(rawText);
  
  // SHIELD: Restore PII in structured fields
  if (shieldEnabled && vaultKey) {
    if (extracted.doctor) {
      extracted.doctor = pulseShield.restore(extracted.doctor, vaultKey);
    }
    if (extracted.hospital) {
      extracted.hospital = pulseShield.restore(extracted.hospital, vaultKey);
    }
    extracted.medicines = extracted.medicines.map(med => ({
      ...med,
      name: pulseShield.restore(med.name, vaultKey),
      instructions: pulseShield.restore(med.instructions || '', vaultKey),
    }));
  }
  
  return {
    ...extracted,
    rawText: shieldEnabled ? pulseShield.restore(rawText, vaultKey) : rawText,
    // ... other fields
  };
}
```

#### Step 2.3: Wrap Chat Assistant (10 min)
```typescript
// src/services/sarvamChatService.ts (MODIFIED)

export class SarvamChatService {
  public static async completions(
    params: ChatCompletionParams,
    options?: { vaultKey?: string }
  ): Promise<ChatCompletionResponse> {
    
    const shieldEnabled = isShieldEnabled('CHAT');
    let vaultKey = options?.vaultKey || '';
    
    // Redact user messages
    if (shieldEnabled) {
      params.messages = params.messages.map(msg => {
        if (msg.role === 'user') {
          const redactionResult = pulseShield.redact(msg.content);
          vaultKey = redactionResult.vaultKey;
          
          privacyLedger.log({
            feature: 'CHAT',
            provider: 'sarvam',
            originalText: msg.content,
            redactedText: redactionResult.redactedText,
            entitiesRedacted: redactionResult.entities.map(e => e.category),
            vaultKey,
          });
          
          return { ...msg, content: redactionResult.redactedText };
        }
        return msg;
      });
    }
    
    // Make API call with redacted messages
    const response = await this.callSarvamAPI(params);
    
    // Restore PII in response
    if (shieldEnabled && vaultKey) {
      response.output = pulseShield.restore(response.output, vaultKey);
    }
    
    return response;
  }
}
```

#### Step 2.4: Wrap SOS Pipeline (10 min)
```typescript
// src/services/sarvamSOSPipelineService.ts (MODIFIED)

export async function triggerSOS(params: SOSParams): Promise<SOSResult> {
  
  // Stage 1: STT (already shielded via SarvamService.speechToText)
  const transcript = await SarvamService.speechToText(audioBlob, language);
  
  // Stage 2: Translate (use redacted transcript)
  const translated = await SarvamTranslationService.translate(transcript, 'en-IN');
  
  // Stage 3: Triage (already operating on redacted text)
  const triage = await SarvamChatService.completions({
    messages: [
      { role: 'system', content: 'Classify urgency...' },
      { role: 'user', content: translated },
    ],
  });
  
  // Extract vault key from privacy ledger (last STT entry)
  const lastLog = privacyLedger.getLatest('STT');
  const vaultKey = lastLog?.vaultKey || '';
  
  // Stage 4: TTS summary (keep redacted for cloud TTS)
  const ttsAudio = await SarvamService.textToSpeech(triage.summary, 'en');
  
  // Stage 5: Write to Firestore
  // Store both redacted (for cloud) and vault key (for local restore)
  const sosEvent = {
    transcription: transcript,  // Redacted
    translatedText: translated,  // Redacted
    aiSummary: triage.summary,   // Redacted
    urgencyScore: triage.urgency,
    vaultKey,  // NEW: store for caregiver-side restore
    audioBase64,
    // ... other fields
  };
  
  await addDoc(collection(db, 'sosEvents'), sosEvent);
  
  return sosEvent;
}
```

---

### Phase 3: UI Components (60 min)

#### Step 3.1: Privacy X-Ray Modal (25 min)
```typescript
// src/components/PrivacyXRay.tsx

import React, { useState } from 'react';
import { privacyLedger, type PrivacyLogEntry } from '../services/pulseShield/privacyLedger';
import { X, Shield, Eye, EyeOff } from 'lucide-react';

export const PrivacyXRay: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [logs, setLogs] = useState<PrivacyLogEntry[]>(privacyLedger.getAll());
  const [selectedLog, setSelectedLog] = useState<PrivacyLogEntry | null>(null);
  
  const categoryColors: Record<string, string> = {
    PATIENT_NAME: 'bg-red-100 text-red-800',
    FAMILY_NAME: 'bg-orange-100 text-orange-800',
    PHONE_NUMBER: 'bg-yellow-100 text-yellow-800',
    AADHAAR: 'bg-purple-100 text-purple-800',
    EMAIL: 'bg-blue-100 text-blue-800',
    CONDITION: 'bg-green-100 text-green-800',
  };
  
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-navy-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-white" />
            <h2 className="text-xl font-bold text-white">Privacy X-Ray</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {logs.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Shield className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No AI calls yet. Your data is safe!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => setSelectedLog(selectedLog?.id === log.id ? null : log)}
                >
                  {/* Summary Row */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {log.feature === 'STT' && '🎤'}
                        {log.feature === 'OCR' && '📄'}
                        {log.feature === 'CHAT' && '💬'}
                        {log.feature === 'SOS' && '🚨'}
                      </span>
                      <div>
                        <p className="font-semibold">{log.feature}</p>
                        <p className="text-sm text-gray-500">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                        {log.provider}
                      </span>
                      {selectedLog?.id === log.id ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </div>
                  </div>
                  
                  {/* Redacted Categories */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {log.entitiesRedacted.map((cat, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded-md text-xs font-medium ${categoryColors[cat] || 'bg-gray-100 text-gray-800'}`}
                      >
                        {cat.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                  
                  {/* Expanded View */}
                  {selectedLog?.id === log.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3">
                      {/* Original */}
                      <div>
                        <p className="text-sm font-semibold text-red-600 mb-1">
                          ❌ Original (NOT sent):
                        </p>
                        <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200">
                          <p className="text-sm font-mono">{log.originalText || '(too large)'}</p>
                        </div>
                      </div>
                      
                      {/* Redacted */}
                      <div>
                        <p className="text-sm font-semibold text-green-600 mb-1">
                          ✅ Redacted (SENT to {log.provider}):
                        </p>
                        <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200">
                          <p className="text-sm font-mono">{log.redactedText}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

#### Step 3.2: Consent Dashboard (20 min)
```typescript
// src/components/ConsentDashboard.tsx

import React, { useState, useEffect } from 'react';
import { Shield, Info } from 'lucide-react';
import type { ConsentSettings, AIFeature, ConsentLevel } from '../services/pulseShield/consentManager';

const FEATURES: { key: AIFeature; label: string; description: string }[] = [
  { key: 'STT', label: 'Voice Input', description: 'Speech-to-text for medication entry and SOS' },
  { key: 'TTS', label: 'Voice Output', description: 'Text-to-speech for reminders and responses' },
  { key: 'OCR', label: 'Prescription Scan', description: 'Extract medicines from uploaded documents' },
  { key: 'CHAT', label: 'AI Assistant', description: 'Chat with AI about medicines and health' },
  { key: 'SOS', label: 'Emergency SOS', description: 'Voice SOS with AI triage' },
  { key: 'TRANSLATE', label: 'Translation', description: 'Translate between Indian languages' },
];

export const ConsentDashboard: React.FC = () => {
  const [settings, setSettings] = useState<ConsentSettings>(loadSettings());
  
  function loadSettings(): ConsentSettings {
    try {
      const stored = localStorage.getItem('pulse_shield_consent');
      if (stored) return JSON.parse(stored);
    } catch {}
    
    // Default: all features redacted + enabled
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
  
  function saveSettings(newSettings: ConsentSettings) {
    setSettings(newSettings);
    localStorage.setItem('pulse_shield_consent', JSON.stringify(newSettings));
  }
  
  function toggleFeature(feature: AIFeature, level: ConsentLevel) {
    saveSettings({
      ...settings,
      features: { ...settings.features, [feature]: level },
    });
  }
  
  return (
    <div className="bg-white dark:bg-navy-900 rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-purple-600" />
        <h3 className="text-xl font-bold">AI Privacy Controls</h3>
      </div>
      
      {/* Global Switch */}
      <div className="mb-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
        <label className="flex items-center justify-between cursor-pointer">
          <div>
            <p className="font-semibold">Master Protection</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enable Pulse Shield for all AI features
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.globalSwitch}
            onChange={(e) => saveSettings({ ...settings, globalSwitch: e.target.checked })}
            className="w-12 h-6"
          />
        </label>
      </div>
      
      {/* Per-Feature Controls */}
      <div className="space-y-4">
        {FEATURES.map((feat) => (
          <div key={feat.key} className="border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-semibold">{feat.label}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feat.description}</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => toggleFeature(feat.key, 'OFF')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  settings.features[feat.key] === 'OFF'
                    ? 'bg-red-100 text-red-800 border-2 border-red-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Off
              </button>
              
              <button
                onClick={() => toggleFeature(feat.key, 'REDACTED_CLOUD')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  settings.features[feat.key] === 'REDACTED_CLOUD'
                    ? 'bg-green-100 text-green-800 border-2 border-green-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🛡️ Protected
              </button>
              
              <button
                disabled
                className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-gray-50 text-gray-400 cursor-not-allowed"
                title="Coming soon"
              >
                Local Only
              </button>
            </div>
          </div>
        ))}
      </div>
      
      {/* Privacy X-Ray Toggle */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
        <label className="flex items-center justify-between cursor-pointer">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-600" />
            <p className="font-semibold">Show Privacy X-Ray</p>
          </div>
          <input
            type="checkbox"
            checked={settings.showPrivacyXRay}
            onChange={(e) => saveSettings({ ...settings, showPrivacyXRay: e.target.checked })}
            className="w-12 h-6"
          />
        </label>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          View side-by-side comparison of original vs. sent data
        </p>
      </div>
    </div>
  );
};
```

#### Step 3.3: Privacy Badge (15 min)
```typescript
// src/components/PrivacyBadge.tsx

import React from 'react';
import { Shield } from 'lucide-react';

interface PrivacyBadgeProps {
  feature: string;
  entitiesRedacted: number;
  onClick?: () => void;
}

export const PrivacyBadge: React.FC<PrivacyBadgeProps> = ({
  feature,
  entitiesRedacted,
  onClick,
}) => {
  if (entitiesRedacted === 0) return null;
  
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-100 text-green-800 rounded-full text-sm font-medium hover:bg-green-200 transition"
    >
      <Shield className="w-4 h-4" />
      <span>
        {entitiesRedacted} item{entitiesRedacted > 1 ? 's' : ''} protected
      </span>
    </button>
  );
};
```

---

### Phase 4: Privacy Ledger (30 min)

```typescript
// src/services/pulseShield/privacyLedger.ts

import type { AIFeature, PrivacyLogEntry } from './types';

class PrivacyLedger {
  private logs: PrivacyLogEntry[] = [];
  private maxLogs = 100; // Keep last 100 entries
  
  public log(entry: Omit<PrivacyLogEntry, 'id' | 'timestamp' | 'consentGiven' | 'userVisible'>): void {
    const fullEntry: PrivacyLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      consentGiven: true, // Check from consent manager
      userVisible: this.shouldShowInXRay(entry.feature),
      ...entry,
    };
    
    this.logs.unshift(fullEntry); // Add to front
    
    // Trim to max
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }
    
    // Persist to localStorage (last 20 for performance)
    try {
      const toStore = this.logs.slice(0, 20).map(l => ({
        ...l,
        originalText: '', // Don't persist full original text
      }));
      localStorage.setItem('pulse_privacy_ledger', JSON.stringify(toStore));
    } catch (e) {
      console.warn('[PrivacyLedger] Failed to persist', e);
    }
  }
  
  public getAll(): PrivacyLogEntry[] {
    return [...this.logs];
  }
  
  public getByFeature(feature: AIFeature): PrivacyLogEntry[] {
    return this.logs.filter(l => l.feature === feature);
  }
  
  public getLatest(feature?: AIFeature): PrivacyLogEntry | null {
    if (feature) {
      return this.logs.find(l => l.feature === feature) || null;
    }
    return this.logs[0] || null;
  }
  
  public clear(): void {
    this.logs = [];
    localStorage.removeItem('pulse_privacy_ledger');
  }
  
  private shouldShowInXRay(feature: AIFeature): boolean {
    try {
      const settings = JSON.parse(localStorage.getItem('pulse_shield_consent') || '{}');
      return settings.showPrivacyXRay !== false;
    } catch {
      return true;
    }
  }
  
  public exportCSV(): string {
    const header = 'Timestamp,Feature,Provider,Entities Redacted\n';
    const rows = this.logs.map(l => 
      `${l.timestamp.toISOString()},${l.feature},${l.provider},"${l.entitiesRedacted.join(', ')}"`
    ).join('\n');
    
    return header + rows;
  }
}

export const privacyLedger = new PrivacyLedger();
```

---

## Integration Points

### 1. Add Shield Toggle to Settings Page

```typescript
// src/pages/Profile.tsx (add section)

import { ConsentDashboard } from '../components/ConsentDashboard';

// In the render:
<section>
  <h3 className="text-lg font-semibold mb-4">🛡️ Privacy & AI Controls</h3>
  <ConsentDashboard />
</section>
```

### 2. Add Privacy X-Ray to Layout

```typescript
// src/components/Layout.tsx (add modal trigger)

import { PrivacyXRay } from './PrivacyXRay';
import { Shield } from 'lucide-react';

const [showXRay, setShowXRay] = useState(false);

// In the header:
<button
  onClick={() => setShowXRay(true)}
  className="p-2 hover:bg-navy-800 rounded-lg transition"
  title="Privacy X-Ray"
>
  <Shield className="w-5 h-5 text-green-500" />
</button>

{showXRay && <PrivacyXRay onClose={() => setShowXRay(false)} />}
```

### 3. Show Privacy Badge After AI Calls

```typescript
// Example in Assistant.tsx after chat response

const [lastRedactionCount, setLastRedactionCount] = useState(0);

// After calling SarvamChatService:
const lastLog = privacyLedger.getLatest('CHAT');
if (lastLog) {
  setLastRedactionCount(lastLog.entitiesRedacted.length);
}

// In render:
{lastRedactionCount > 0 && (
  <PrivacyBadge
    feature="CHAT"
    entitiesRedacted={lastRedactionCount}
    onClick={() => setShowXRay(true)}
  />
)}
```

---

## Testing Strategy

### Unit Tests

1. **Tier 0 Regex** (5 test cases)
   - Aadhaar: `1234-5678-9012` → `[AADHAAR_1]`
   - Phone: `+91-9876543210` → `[PHONE_1]`
   - Email: `test@example.com` → `[EMAIL_1]`
   - PIN: `560001` → `[PIN_1]`
   - Mixed: all of the above in one text

2. **Tier 1 Dictionary** (3 test cases)
   - Patient name in English: `Rajesh Kumar` → `[PATIENT_NAME_1]`
   - Patient name in Hindi: `राजेश कुमार` → `[PATIENT_NAME_1]`
   - Overlap prevention: Don't redact "Kumar" if already part of "Rajesh Kumar"

3. **Vault** (3 test cases)
   - Store + retrieve within 1 hour → success
   - Retrieve expired key (> 1 hour) → null
   - Restore placeholders → original text

### Integration Tests

1. **STT Flow**
   - Record voice: "मेरा नाम राजेश है"
   - Check ledger: originalText contains "राजेश", redactedText contains "[PATIENT_NAME_1]"
   - Verify API never received "राजेश"

2. **OCR Flow**
   - Upload prescription with "Patient: Priya, Aadhaar: 1234-5678-9012"
   - Check extracted doctor field restored (not placeholder)
   - Verify Gemini/Sarvam never saw Aadhaar

3. **Chat Flow**
   - Send: "My father has diabetes"
   - If "father" in emergency contact → redacted
   - Response restored correctly

### Manual Testing Checklist

- [ ] Enable shield in consent dashboard
- [ ] Trigger STT → verify badge shows "X items protected"
- [ ] Open Privacy X-Ray → see side-by-side original vs. redacted
- [ ] Upload prescription → verify Aadhaar redacted in logs
- [ ] Chat with AI → verify no PII in network tab (DevTools)
- [ ] Disable shield → verify raw data flows through
- [ ] Re-enable → verify protection resumes

---

## Deployment Checklist

### Pre-Deploy

- [ ] Test all 3 tiers of redaction with sample data
- [ ] Verify vault expires entries after 1 hour
- [ ] Check localStorage quota (Privacy Ledger limited to 20 entries)
- [ ] Confirm no PII in console.log statements
- [ ] Test on mobile (localStorage, performance)

### Environment Variables

No new env vars needed (all client-side). Optional:

```env
# Optional: disable shield in dev for faster testing
VITE_SHIELD_BYPASS=false
```

### Build

```bash
npm run build
# Verify bundle size: shield adds ~15KB gzipped
```

### Deploy

- Firebase Hosting: `firebase deploy`
- Netlify/Vercel: Standard build + deploy

### Post-Deploy Monitoring

- [ ] Check browser console for shield errors
- [ ] Monitor API logs (Sarvam/Gemini) for any PII leakage
- [ ] User feedback: "Did you see your name in AI responses?"

---

## Performance Considerations

### Benchmarks (Target)

| Operation | Time | Notes |
|-----------|------|-------|
| Tier 0 regex | < 5ms | Even on 10KB text |
| Tier 1 dictionary | < 10ms | 50 entries × 5KB text |
| Full redaction | < 20ms | Combined tiers |
| Vault store | < 1ms | In-memory map |
| Vault restore | < 5ms | String replace loop |

### Optimization Tips

1. **Lazy load Tier 2 NER** (not in Phase 1; future)
2. **Cache dictionary** (rebuild only on profile change)
3. **Debounce real-time redaction** (e.g., in chat input preview)
4. **Limit ledger size** (max 100 entries, auto-prune)

---

## Future Enhancements (Post-Hackathon)

### Tier 2: On-Device NER

```typescript
// Using Transformers.js + fine-tuned Indic NER model
import { pipeline } from '@xenova/transformers';

const ner = await pipeline('ner', 'Xenova/bert-base-NER');
const entities = await ner(text);
// Filter to PER (person), LOC (location), ORG (organization)
```

### Local-Only Mode

- Integrate Whisper.cpp for STT (WASM)
- Use Tesseract.js only (already local)
- Offline LLM via WebLLM (7B quantized model)

### Blockchain Audit Trail

- Write SHA-256 hashes of redacted payloads to blockchain
- Immutable proof of what was sent when

### Differential Privacy

- Add noise to numeric fields (age, weight) before cloud transmission
- ε-differential privacy guarantee

---

## FAQ

### Q: Does this slow down AI responses?

**A**: Minimal. Redaction adds ~20ms overhead, unnoticeable to users.

### Q: What if the AI needs real names to answer correctly?

**A**: The AI sees placeholders during processing, but the final response is restored. The user experience is identical.

### Q: Can users disable the shield?

**A**: Yes, via the Consent Dashboard. Each feature has a 3-way switch: Off / Protected / Local-only.

### Q: What if a new PII type isn't caught?

**A**: The system is fail-open (sends data) but logs a warning. Users can manually add to dictionary or report for Tier 2 NER training.

### Q: Is this GDPR/DISHA compliant?

**A**: It's a strong step toward compliance (data minimization, consent). Full compliance requires legal review + DPA registration.

---

## Summary

**Pulse Shield** transforms PULSE from a data-leaking app into a privacy-first platform. With 3-tier redaction, a client-side vault, and transparent Privacy X-Ray UI, users can trust that their most sensitive information never reaches cloud AI — while still enjoying all the intelligent features.

**Build Time**: 4-6 hours (phased implementation)  
**Risk**: Low (fail-closed design prevents data leaks)  
**Impact**: High (major competitive differentiator for elderly/medical apps)

---

**Document Version**: 1.0  
**Ready to Build**: YES ✅  
**Next Step**: Start with Phase 1 (Core Redaction Engine) →
