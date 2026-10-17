/**
 * PULSE Shield - Type Definitions
 * 
 * Shared types used across the privacy gateway implementation
 */

import type { PIIEntity, PIICategory } from './redactors/tier0-regex';

export type { PIIEntity, PIICategory } from './redactors/tier0-regex';

export interface RedactionResult {
  redactedText: string;
  entities: PIIEntity[];
  vaultKey: string;
  originalLength: number;
  redactedLength: number;
  confidence: number;
  timestamp: Date;
  tier0Count: number;
  tier1Count: number;
  tier2Count?: number;
}

export interface RestorationResult {
  restoredText: string;
  entitiesRestored: number;
  timeMs: number;
}

export type AIFeature = 'STT' | 'TTS' | 'OCR' | 'CHAT' | 'SOS' | 'TRANSLATE';
export type ConsentLevel = 'OFF' | 'REDACTED_CLOUD' | 'LOCAL_ONLY';

export interface ConsentSettings {
  globalSwitch: boolean;
  showPrivacyXRay: boolean;
  logRetentionDays: number;
  features: Record<AIFeature, ConsentLevel>;
}

export interface PrivacyLogEntry {
  id: string;
  timestamp: Date;
  feature: AIFeature;
  provider: 'sarvam' | 'gemini' | 'local';
  originalText: string;
  redactedText: string;
  entitiesRedacted: PIICategory[];
  vaultKey: string;
  consentGiven: boolean;
  userVisible: boolean;
}
