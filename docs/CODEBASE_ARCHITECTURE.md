# PULSE Codebase Architecture Documentation

> Last Updated: 2026-10-17  
> Purpose: Complete reference for any developer or AI agent working on PULSE

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Layers](#architecture-layers)
3. [Directory Structure](#directory-structure)
4. [Core Contexts & State Management](#core-contexts--state-management)
5. [Services Layer](#services-layer)
6. [Pages & UI Components](#pages--ui-components)
7. [Data Flow Patterns](#data-flow-patterns)
8. [Firebase Integration](#firebase-integration)
9. [AI/ML Integrations](#aiml-integrations)
10. [Accessibility Architecture](#accessibility-architecture)
11. [Key Features Deep Dive](#key-features-deep-dive)
12. [Development Guidelines](#development-guidelines)

---

## Project Overview

**PULSE** (Patient Utility for Logged & Scheduled Events) is a PWA built with React 19, TypeScript 6, and Vite 8. It's designed for India's elderly population and their caregivers to manage medications, prescriptions, and emergency alerts in 9 Indian languages.

### Tech Stack Summary
- **Frontend**: React 19, TypeScript 6, Vite 8, TailwindCSS 3.4
- **Backend/Database**: Firebase Auth + Firestore
- **AI Services**: Sarvam AI (STT, TTS, Chat, Document Intelligence), Google Gemini 2.5 Flash (Vision)
- **Maps**: Leaflet 1.9 + OpenStreetMap + Overpass API
- **OCR Fallback**: Tesseract.js 7 (offline)
- **PDF**: pdfjs-dist 6, jsPDF 4

### Key Stats
- **Files**: ~100+ components, services, contexts
- **Bundle Size**: Optimized with code splitting
- **Supported Languages**: Hindi, Tamil, Gujarati, Marathi, Telugu, Bengali, Kannada, Malayalam, English
- **Role System**: Patient (primary) + Caregiver (read-only linked)

---

## Architecture Layers

### Layer 1: Application Entry
- **`main.tsx`**: React 19 entry point; creates root with Vite
- **`App.tsx`**: Root component with Provider nesting and tab-based routing
- **`App.css`**: Global app styles
- **`index.html`**: PWA manifest reference + viewport setup

### Layer 2: Context Providers (Dependency Injection)
Contexts are nested in `App.tsx` in this order:

1. **AccessibilityProvider** (outermost)
   - Theme, font size, high-contrast, reduce motion, voice feedback, volume
   - Syncs to `data-*` attributes on `<html>` → CSS variables

2. **SettingsProvider**
   - Language selection (9 languages)
   - Translation keys + Sarvam API key override
   - Fires up lazy Sarvam service on mount

3. **FirebaseProvider**
   - Auth state subscription
   - User object + `isFirebaseActive` flag
   - Exports `auth`, `db` instances

4. **AppContent** (routing gate)
   - Checks if `user` is logged in → renders Login or main app
   - Shows loading spinner while auth state resolves

5. **RoleProvider**
   - User profile, role (patient/caregiver), linked patients
   - `activePatientId` for caregiver patient-switching
   - Exports `useActivePatient()` hook for data-path resolution

6. **MedicationProvider** (inside RoleProvider)
   - Medications, dose logs, documents
   - Firestore listeners keyed off `useActivePatient()` paths
   - Falls back to `localStorage` when offline or Firebase unavailable

7. **SOSProvider**
   - SOS events subscription (caregivers only)
   - Event acknowledgment workflow

### Layer 3: Pages (Tab-Based Routing)
All pages are rendered via a switch statement in `App.tsx`'s `activeTab` state:

| Tab | Component | Role | Purpose |
|-----|-----------|------|---------|
| `home` | `Home.tsx` | Both | Dose countdown, next medication, SOS button, nearby card shortcut |
| `medicines` | `Medicines.tsx` | Patient | CRUD medicines, manual entry, voice capture, frequency/timing |
| `documents` | `Documents.tsx` | Patient | Upload prescriptions/reports, OCR extraction, view extracted data |
| `reports` | `AdherenceReport.tsx` | Both | 7-day adherence bar chart, streak counter, missed doses |
| `assistant` | `Assistant.tsx` | Both | Chat with AI (general or document RAG), voice Q&A |
| `caregiver-link` | `CaregiverLink.tsx` | Caregiver | Enter invite code to link to patient |
| `appointments` | `Appointments.tsx` | Patient | Schedule appointments with date/time, 24h TTS reminders |
| `nearby` | `NearbyCare.tsx` | Both | Leaflet map showing hospitals, clinics, pharmacies within 5 km |
| `profile` | `Profile.tsx` | Patient | Edit full name, DOB, blood group, conditions, emergency contact |

### Layer 4: Components (Reusable UI)
Key component library in `src/components/`:

- **`Layout.tsx`**: Bottom nav bar, SOS banner integration, tab switcher
- **`SOSButton.tsx`**: Records voice, shows transcription, sends SOS event
- **`SOSAlertBanner.tsx`**: Appears on caregiver's layout when unacknowledged SOS exists
- **`SOSHistoryFeed.tsx`**: Lists all SOS events with urgency badges, timestamps, playback
- **`CaregiverSOSBanner.tsx`**: Alternative SOS banner style for caregiver
- **`PatientSwitcher.tsx`**: Dropdown for caregiver to select which patient to view
- **`AccessibilitySettings.tsx`**: Theme, font size, high-contrast toggles
- **`PersonalDetailsForm.tsx`**: Reusable form for patient profile fields
- **`MedicineInfoPanel.tsx`**: Side panel showing medicine details, interactions via AI
- **`NearbyCareCard.tsx`**: Single POI card (hospital/clinic/pharmacy)
- **`CaregiverEnterCodeCard.tsx`**: Invite code entry UI for caregiver linking
- **`RoleGuard.tsx`**: Renders children or null based on role + activeTab

### Layer 5: Services (Business Logic)
Located in `src/services/`, these are stateless singletons:

#### Core Services
- **`authService.ts`**: Thin wrapper around Firebase Auth (email/password)
- **`firebase.ts`**: Firebase app init, exports `auth` + `db`
- **`notificationService.ts`**: Browser push notification + sound playback

#### Sarvam AI Services
- **`sarvamService.ts`**: High-level API wrapper (STT, TTS, medication extraction, chat)
- **`sarvamConfig.ts`**: API key override logic + defaults
- **`sarvamClient.ts`**: Axios instance for Sarvam REST calls
- **`sarvamCapabilities.ts`**: Language code mappings
- **`sarvamSpeechService.ts`**: STT (`saarika:v2.5`) + TTS (`bulbul:v3`) endpoints
- **`sarvamChatService.ts`**: Chat completions + structured extraction prompts (sarvam-30b)
- **`sarvamDocumentService.ts`**: Document Intelligence API for prescription OCR
- **`sarvamTranslationService.ts`**: Auto-translate to English (if needed)
- **`sarvamErrors.ts`**: Custom error classes

#### Vision & OCR Services
- **`prescriptionPipeline.ts`**: Multi-stage OCR orchestration
  - Stage 1: Detect PDF vs image
  - Stage 2: Sarvam Document Intelligence
  - Stage 3: Gemini 2.5 Flash (quality fallback)
  - Stage 4: Tesseract.js (offline fallback)
  - Stage 5: Structured extraction via Sarvam Chat
- **`geminiVisionService.ts`**: Google Gemini handwritten prescription reading
- **`geminiConfig.ts`**: Gemini API key + endpoint
- **`imagePreprocessor.ts`**: Canvas-based grayscale + contrast adjustment
- **`pdfExtractor.ts`**: pdfjs text extraction (fast typed-text mode)
- **`ocrService.ts`**: High-level OCR orchestration (deprecated in favor of prescriptionPipeline)

#### Prescription & Med Management
- **`prescriptionDisplayService.ts`**: Format extracted medicine data for display
- **`medicineInfoService.ts`**: Medicine database queries + interaction warnings (hardcoded or API-backed)
- **`appointmentService.ts`**: Appointment CRUD + TTS reminder scheduling

#### Location & Navigation
- **`overpassService.ts`**: Overpass API queries for hospitals/clinics/pharmacies
- **`sos**Service.ts`: Existing SOS event write (deprecated in favor of SOSProvider context)
- **`sarvamSOSPipelineService.ts`**: Full SOS pipeline: STT → Translate → Triage → TTS summary → Firestore write

---

## Directory Structure

```
Pulse/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icons.svg
│   └── favicon.svg
├── src/
│   ├── main.tsx               # React entry
│   ├── App.tsx                # Root with tab routing
│   ├── App.css
│   ├── index.css              # Global styles + CSS variables
│   ├── firebase.ts            # Firebase init
│   ├── assets/
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── pages/                 # Tab pages
│   │   ├── Home.tsx
│   │   ├── Medicines.tsx
│   │   ├── Documents.tsx
│   │   ├── AdherenceReport.tsx
│   │   ├── Assistant.tsx
│   │   ├── CaregiverLink.tsx
│   │   ├── Appointments.tsx
│   │   ├── NearbyCare.tsx
│   │   ├── Profile.tsx
│   │   ├── Login.tsx
│   │   └── Onboarding.tsx
│   ├── components/            # Reusable UI
│   │   ├── Layout.tsx
│   │   ├── SOSButton.tsx
│   │   ├── SOSAlertBanner.tsx
│   │   ├── SOSHistoryFeed.tsx
│   │   ├── CaregiverSOSBanner.tsx
│   │   ├── PatientSwitcher.tsx
│   │   ├── AccessibilitySettings.tsx
│   │   ├── PersonalDetailsForm.tsx
│   │   ├── MedicineInfoPanel.tsx
│   │   ├── NearbyCareCard.tsx
│   │   ├── CaregiverEnterCodeCard.tsx
│   │   └── RoleGuard.tsx
│   ├── context/               # State + DI
│   │   ├── FirebaseContext.tsx
│   │   ├── SettingsContext.tsx
│   │   ├── RoleContext.tsx
│   │   ├── MedicationContext.tsx
│   │   ├── SOSContext.tsx
│   │   └── AccessibilityContext.tsx
│   ├── services/              # Business logic
│   │   ├── sarvamService.ts
│   │   ├── sarvamConfig.ts
│   │   ├── sarvamClient.ts
│   │   ├── sarvamCapabilities.ts
│   │   ├── sarvamSpeechService.ts
│   │   ├── sarvamChatService.ts
│   │   ├── sarvamDocumentService.ts
│   │   ├── sarvamTranslationService.ts
│   │   ├── sarvamErrors.ts
│   │   ├── prescriptionPipeline.ts
│   │   ├── geminiVisionService.ts
│   │   ├── geminiConfig.ts
│   │   ├── imagePreprocessor.ts
│   │   ├── pdfExtractor.ts
│   │   ├── ocrService.ts
│   │   ├── prescriptionDisplayService.ts
│   │   ├── medicineInfoService.ts
│   │   ├── appointmentService.ts
│   │   ├── overpassService.ts
│   │   ├── sosService.ts
│   │   ├── sarvamSOSPipelineService.ts
│   │   ├── notificationService.ts
│   │   ├── authService.ts
│   │   └── useDisplayMedications.ts
│   └── hooks/                 # React hooks
│       └── useDisplayMedications.ts
├── firestore.rules            # Security rules
├── firestore.indexes.json     # Index definitions
├── package.json
├── package-lock.json
├── vite.config.ts             # Vite config
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
├── tailwind.config.js         # TailwindCSS + CSS var setup
├── postcss.config.js
├── eslint.config.js
├── index.html
└── .gitignore
```

---

## Core Contexts & State Management

### 1. FirebaseContext
**File**: `src/context/FirebaseContext.tsx`  
**Responsibility**: Auth state subscription, Firebase instance exports

```typescript
useFirebase() → {
  user: User | null,
  loading: boolean,
  isFirebaseActive: boolean,
  db: Firestore,
  auth: Auth,
}
```

**Key Behaviors**:
- Subscribes to `onAuthStateChanged()` on mount
- Exports global `db` + `auth` instances
- Sets `isFirebaseActive = false` until auth resolves
- Components check this flag before reading Firestore

### 2. SettingsContext
**File**: `src/context/SettingsContext.tsx`  
**Responsibility**: Language selection, translations, API key override

```typescript
useSettings() → {
  language: LanguageCode,
  t: Record<string, string>,  // current locale strings
  setLanguage(code: LanguageCode),
  setApiKey(key: string),  // Sarvam override
}
```

**Key Behaviors**:
- 9 languages: `hi | ta | gu | mr | te | bn | kn | ml | en`
- Translations loaded from nested objects; missing keys fall back to English
- API key override stored in memory (not persisted)

### 3. RoleContext
**File**: `src/context/RoleContext.tsx`  
**Responsibility**: User profile, role (patient/caregiver), patient linking

```typescript
useRole() → {
  role: 'patient' | 'caregiver' | null,
  profile: UserProfile,
  profileLoading: boolean,
  linkedPatientIds: string[],
  linkedCaregiverIds: string[],
  linkedPatients: LinkedPatientRow[],  // with adherence %
  activePatientId: string | null,  // for caregiver switching
  setActivePatientId(id: string | null),
  saveRole(role),
  savePhoneNumber(number),
  saveDisplayName(name),
  savePersonalDetails(patch),
}

useActivePatient() → {
  patientId: string | null,
  isOwnData: boolean,
  isCaregiverViewing: boolean,
  basePath: string,  // e.g., "users/<uid>"
  medicationsPath: string,
  documentsPath: string,
  logsPath: string,
}
```

**Key Behaviors**:
- **Patient**: `activePatientId` is always their own UID (ignored)
- **Caregiver**: `activePatientId` can switch; defaults to `null` (views own data)
- Profile auto-syncs from Firestore via `onSnapshot()`
- `linkedPatients` array computed on every profile or link change

### 4. MedicationContext
**File**: `src/context/MedicationContext.tsx`  
**Responsibility**: Medications, dose logs, documents (PDFs/prescriptions)

```typescript
useMedication() → {
  medications: Medication[],
  logs: Record<string, Record<string, DoseLog>>,  // [date][key] = dose
  documents: MedDocument[],
  addMedication(med),
  updateMedication(med),
  deleteMedication(id),
  toggleDose(date, medId, slot),
  addDocument(docData),
  deleteDocument(id),
  streak: number,  // consecutive full-adherence days
  adherenceRate: number,  // 7-day %, 0–100
}
```

**Data Models**:

```typescript
interface Medication {
  id: string;
  name: string;
  dosage: string;  // e.g., "1 tablet"
  frequency: string;  // e.g., "Twice daily"
  timing: ('morning' | 'afternoon' | 'evening' | 'night')[];
  startDate: string;  // ISO YYYY-MM-DD
  instructions: string;
}

interface DoseLog {
  medId: string;
  medName: string;
  dosage: string;
  timeSlot: Slot;
  taken: boolean;
  takenAt?: string;  // HH:MM when marked taken
}

interface MedDocument {
  id: string;
  name: string;
  type: 'prescription' | 'report' | 'summary';
  date: string;
  doctor: string;
  hospital: string;
  medicines: string[];  // extracted medicine names
  fileUrl: string;
  extractedText?: string;
  uploadedAt: Date;
  processedAt: Date;
}
```

**Key Behaviors**:
- Firestore listeners keyed off `useActivePatient()` paths
- When `isOwnData === true`, syncs to `localStorage` for offline resilience
- When caregiver views another patient, never writes to localStorage
- Read guards: only write if `canWrite === isFirebaseActive && isOwnData`
- Adherence computed on every `logs` or `medications` change
- Streak: count backward from today until a day with < 100% adherence

### 5. SOSContext
**File**: `src/context/SOSContext.tsx`  
**Responsibility**: SOS event subscription (caregiver view only)

```typescript
useSOS() → {
  allSosEvents: SosEvent[],
  pendingSosEvents: SosEvent[],  // filtered to status === 'pending'
  unacknowledgedCount: number,
  acknowledgeEvent(eventId),
  isLoading: boolean,
}

interface SosEvent {
  id: string;
  patientId: string;
  patientName: string;
  caregiverId: string;
  timestamp: Date;
  status: 'pending' | 'acknowledged' | 'resolved';
  urgencyScore: 'HIGH' | 'MED' | 'LOW';
  transcription: string;  // raw STT output
  translatedText: string;  // translated to English
  aiSummary: string;  // AI-generated concise description
  language: string;
  audioBase64: string;  // data:audio/...;base64,... or empty
  audioStoragePath: string;
  audioURL: string;  // CDN URL if using Cloudinary
  ttsAudioURL: string | null;  // summary audio playback URL
  acknowledgedAt: Date | null;
  acknowledgedBy: string | null;  // caregiver UID
}
```

**Key Behaviors**:
- Only caregivers subscribe (checks `where('caregiverId', '==', user.uid)`)
- Limited to last 50 events (SOS_SUBSCRIPTION_LIMIT)
- `acknowledgeEvent()` updates status → `acknowledged` + records timestamp + acknowledger UID
- Audio storage strategy: `base64` (default, inline) or `cloudinary` (CDN)

### 6. AccessibilityContext
**File**: `src/context/AccessibilityContext.tsx`  
**Responsibility**: Theme, font size, high-contrast, reduce motion, voice feedback

```typescript
useAccessibility() → {
  theme: 'light' | 'dark',
  fontSize: 'small' | 'normal' | 'large' | 'extra-large',  // default 'large'
  highContrast: boolean,
  reduceMotion: boolean,
  voiceFeedback: boolean,
  soundVolume: number,  // 0–100
  setTheme(t),
  toggleTheme(),
  setFontSize(s),
  setHighContrast(v),
  setReduceMotion(v),
  setVoiceFeedback(v),
  setSoundVolume(n),
  resetDefaults(),
  exportSettings(),
}
```

**Key Behaviors**:
- Settings stored in `localStorage` (STORAGE_KEY = `pulse_a11y_settings_v1`)
- On init, honors OS `prefers-reduced-motion` if not stored
- Every setter writes to both React state AND `localStorage` + DOM `data-*` attributes
- CSS variables in `index.css` listen to data attributes (no re-renders needed)
- Default font size is `large` (≈18–20px body, elder-friendly)
- High-contrast mode: pure black/white text on opposite backgrounds

---

## Services Layer

### Sarvam AI Integration

**Main Entry**: `sarvamService.ts` (high-level API)
**Low-Level**: `sarvamSpeechService.ts`, `sarvamChatService.ts`, `sarvamDocumentService.ts`

#### Speech-to-Text (STT)
```typescript
SarvamService.speechToText(audioBlob, languageCode): Promise<string>
// Uses saarika:v2.5 model
// Input: WAV/MP3 blob, language code (hi, ta, gu, etc.)
// Output: Transcribed text in original language
```

#### Text-to-Speech (TTS)
```typescript
SarvamService.textToSpeech(text, languageCode): Promise<string>
// Uses bulbul:v3 model
// Input: Text + language code
// Output: Base64 audio, auto-plays in browser
```

#### Medication Extraction
```typescript
SarvamService.extractMedicationFromText(transcript): Promise<ExtractedMed>
// Uses sarvam-30b in JSON-strict mode
// Parses: "take 1 tablet of paracetamol twice daily after food"
// Returns: { name, dosage, frequency, timing: [...], instructions }
```

#### Chat (General + RAG)
```typescript
SarvamChatService.completions({
  model: 'sarvam-30b',
  messages: [...],
  temperature?: 0.5,
}): Promise<{ output: string }>
// Used for medicine Q&A, drug interactions, document Q&A
```

#### Document Intelligence (OCR)
```typescript
SarvamDocumentService.extractFromDocument(fileBlob): Promise<{
  text: string,
  pages: number,
  detectedLanguage: string,
  confidence: number,
}
// Multilingual, layout-preserving OCR
// Supports PDF + images (auto-zipped)
```

### Prescription OCR Pipeline

**File**: `src/services/prescriptionPipeline.ts`

**5-Stage Process**:

1. **Input Detection**
   - PDF? → Try pdfjs first (fast typed-text extraction)
   - If enough text found → skip Sarvam DI, go to stage 4
   - Image? → Preprocess (grayscale + contrast boost)

2. **Sarvam Document Intelligence** (primary)
   - Input: PDF bytes or preprocessed image
   - Output: Raw OCR text, detected language
   - Fallback: If fails, go to stage 3

3. **Gemini Vision** (quality check)
   - Only if: text is suspiciously short AND Gemini is configured
   - Runs handwriting-optimized vision model
   - If better quality → use Gemini output instead

4. **Tesseract.js** (offline fallback)
   - If all APIs fail
   - Runs in Web Worker
   - Returns raw text (lower quality but no API calls)

5. **Structured Extraction** (sarvam-30b)
   - Input: Best OCR text from stages 1–4
   - Prompt: "Extract { doctor, hospital, date, medicines: [{name, dosage, frequency, timing, instructions}] }"
   - Output: Structured JSON

**Result Interface**:
```typescript
interface PrescriptionExtractionResult {
  success: boolean;
  doctor: string | null;
  hospital: string | null;
  date: string | null;
  medicines: ExtractedRxMedicine[];  // canonical English
  rawText: string;
  prescription_language: RxDetectedLanguage;
  confidence: 'high' | 'medium' | 'low';
  ocrSource: 'sarvam-document-intelligence' | 'pdfjs' | 'gemini-vision' | 'tesseract' | 'empty';
  usedHandwritingFallback: boolean;
  warnings: string[];
}
```

### SOS Pipeline

**File**: `src/services/sarvamSOSPipelineService.ts`

**7-Stage Process**:

1. **Voice Recording** → Browser MediaRecorder
2. **STT** → Sarvam `saarika:v2.5` (patient's language)
3. **Translation** → Sarvam Translate → English
4. **AI Triage** → sarvam-30b, classify urgency: HIGH | MED | LOW
5. **TTS Summary** → sarvam `bulbul:v3` (English summary)
6. **Audio Storage**
   - Strategy 1: `base64` → inline in Firestore doc as `audioBase64`
   - Strategy 2: `cloudinary` → CDN upload, store URL in `audioURL`
7. **Firestore Write** → New `sosEvents` doc with all extracted data

**Flow Diagram**:
```
Patient clicks SOS → Record voice in patient's language
↓
STT (Sarvam) → Transcription in original language
↓
Translate → English
↓
LLM Triage (sarvam-30b) → Urgency score + summary
↓
TTS (summary in English) + Audio storage
↓
Write sosEvents doc → Firestore
↓
Caregiver's SOSProvider subscription fires → Banner appears + sound plays
```

---

## Pages & UI Components

### Home (`pages/Home.tsx`)
**Features**:
- Live digital clock (updates every second)
- Next dose countdown timer with 3-segment display (HH:MM:SS)
- 4-slot day view: Morning (8am), Afternoon (1pm), Evening (6pm), Night (9pm)
- For each slot: show medicines due, one-tap mark taken, progress ring
- Adherence streak badge
- Quick shortcuts: Open Adherence Report, Open Nearby Care

**State**:
- `currentTime` (live update)
- `nextDoseText`, `countdown`
- Computed from `medications` + `logs` via `useMedication()`

**Key Interaction**: Tap dose button → `toggleDose()` → updates Firestore + UI

### Medicines (`pages/Medicines.tsx`)
**Features**:
- List all active medicines with edit/delete
- "Add Medicine" modal with 3 entry modes:
  1. **Manual**: Type name, dosage, frequency, select timing slots
  2. **Voice**: "Take 1 tablet of..." → auto-parse via Sarvam Chat
  3. **Scan**: Upload prescription → OCR → detect medicines → import
- Medicine info panel: click medicine → shows side effects, interactions (via AI)

**State**:
- `showAddModal`, `editingMed`, `selectedMed`
- Form state during entry

**Key Flows**:
- Manual: Fill form → validate → `addMedication()`
- Voice: Record → STT → parse → form pre-fill → user confirms → add
- Scan: Upload → OCR pipeline → show detected medicines → user selects → `addMedication()`

### Documents (`pages/Documents.tsx`)
**Features**:
- List uploaded prescriptions + reports with thumbnails
- "Upload" button → file picker → trigger OCR pipeline
- View extracted data: doctor, hospital, date, detected medicines
- Delete document
- Show raw extracted text

**State**:
- `documents` from `useMedication()`
- `selectedDoc`, `isProcessing`
- OCR progress

**Key Flow**:
1. User uploads file (PDF or image)
2. `prescriptionPipeline()` triggered
3. Progress updates (sarvam → gemini → tesseract)
4. Result: document added to Firestore + `documents` context updates
5. User sees extracted medicines, can click "Import to Schedule"

### AdherenceReport (`pages/AdherenceReport.tsx`)
**Features**:
- 7-day bar chart (each bar = daily adherence %)
- 30-day streak counter
- Missed doses list (with timestamps)
- Exportable PDF report

**Computation**:
- For each of last 7 days: count total doses scheduled vs. taken
- Streak: walk backward from today until first day < 100%

**State**:
- Entirely derived from `medications`, `logs`, `streak`, `adherenceRate` from context

### Assistant (`pages/Assistant.tsx`)
**Features**:
- Chat interface (messages bubble list)
- Input: text OR voice (mic button)
- Mode toggle: "General" vs. "Document" (if doc selected)
- General: Ask about medicines, side effects, interactions
- Document: Upload report → ask questions about that specific report (RAG)
- Voice input/output: Speak question → STT → AI response → TTS playback

**State**:
- `messages: Array<{role, content}>`
- `selectedDocument` (for RAG mode)
- `isLoading`, `isListening`
- Settings: `voiceFeedback`, language

**Key Service**: `SarvamChatService.completions()` with system prompt contextualizing the mode

### CaregiverLink (`pages/CaregiverLink.tsx`)
**Features**:
- Patient generates 6-digit invite code (stored in Firestore)
- Caregiver enters code → links to patient's UID
- Bidirectional update: patient's `linkedCaregiverIds` ↔ caregiver's `linkedPatientIds`

**State**:
- `inviteCode` (patient view)
- `enteredCode` (caregiver view), `isLinking`

**Security**: Firestore rules validate `caregiverId in patient.linkedCaregiverIds` before allow reads

### Appointments (`pages/Appointments.tsx`)
**Features**:
- Schedule appointments: date, time, doctor name, hospital, notes
- List upcoming appointments
- 24-hour before: TTS reminder in patient's language
- Browser push notification + audio alert

**State**:
- `appointments: Array<{id, date, time, doctor, hospital, notes}>`
- Firestore subcollection under patient

**Reminder**: On 24h boundary, `appointmentService` triggers TTS + notification

### NearbyCare (`pages/NearbyCare.tsx`)
**Features**:
- Leaflet map centered on user's location (if geolocation granted)
- Overpass API queries for:
  - Hospitals (`healthcare=hospital`)
  - Clinics (`healthcare=clinic`)
  - Pharmacies (`shop=pharmacy`)
- Filter chips to toggle visibility
- Click POI → Google Maps directions + call link

**State**:
- User location (lat, lon)
- `pois: Array<{name, lat, lon, type}>`
- Active filters
- Selected POI

**Service**: `overpassService.ts` builds Overpass QL query, parses XML response

### Profile (`pages/Profile.tsx`)
**Features**:
- Edit personal details: full name, DOB, blood group, height, weight
- Medical: allergies, chronic conditions (preset chips + custom)
- Emergency contact: name, phone, relationship
- Accessibility settings sidebar
- Export profile as JSON

**State**:
- Form state bound to `profile` from `useRole()`
- On save: `savePersonalDetails(patch)` → Firestore

---

## Data Flow Patterns

### Pattern 1: Medication Lifecycle

```
User adds medicine manually
  ↓
Medicines.tsx form submission
  ↓
useMedication().addMedication(medData)
  ↓
[If Firebase active]
  → addDoc(collection(db, medicationsPath), medData)
  → Firestore emits snapshot → MedicationContext updates
  → All consumers of useMedication() re-render
[If offline]
  → Update local state directly
  → Write to localStorage
```

### Pattern 2: Dose Toggle

```
User taps "Taken" on Home page
  ↓
toggleDose(date, medId, slot)
  ↓
[If Firebase + isOwnData]
  → setDoc(doc(db, `${logsPath}/${date}`), { [`${medId}_${slot}`]: newLog })
  → Firestore snapshot fires → logs state updates
  → Adherence recomputes → streak updates
[If offline]
  → Update local state + localStorage
```

### Pattern 3: OCR Document Upload

```
Documents.tsx upload button
  ↓
User picks file (PDF or image)
  ↓
prescriptionPipeline(file, userLanguage)
  ↓
Stage 1 (detect type) → Stage 2 (Sarvam DI) → Stage 3 (Gemini check)
  ↓ (or fallback to Stage 4: Tesseract)
  ↓
Stage 5 (extract structured JSON)
  ↓
useMedication().addDocument({
  name: 'Rx from Dr. X',
  medicines: extracted,
  doctor, hospital, date,
  extractedText: rawOcrText,
})
  ↓
Document added to Firestore
  ↓
MedicationContext snapshot fires → documents list updates
```

### Pattern 4: SOS Event

```
Patient clicks SOS button
  ↓
SOSButton.tsx → MediaRecorder → user speaks in their language
  ↓
sarvamSOSPipelineService.triggerSOS({audioBlob, patientId, caregiverId})
  ↓
Stage 1 (STT) → Stage 2 (Translate) → Stage 3 (Triage) → Stage 4 (TTS)
  → Stage 5 (Audio storage) → Stage 6 (Firestore write)
  ↓
New sosEvents doc created
  ↓
Caregiver's SOSProvider subscription fires
  ↓
SOSAlertBanner pops up + sound plays + notification shown
  ↓
Caregiver clicks "Acknowledge" in banner or history feed
  ↓
acknowledgeEvent(eventId) → update status + timestamp
  ↓
Banner disappears when status !== 'pending'
```

### Pattern 5: Caregiver Patient Switching

```
Caregiver account logs in
  ↓
RoleContext reads profile → role = 'caregiver'
  ↓
linkedPatients array populated (from linkedPatientIds)
  ↓
User clicks PatientSwitcher dropdown
  ↓
setActivePatientId(selectedPatientId)
  ↓
useActivePatient() recalculates paths
  ↓
MedicationContext re-subscribes to new patientId's medications/logs/docs
  ↓
All pages render that patient's data (read-only)
  ↓
Mutations blocked (canWrite = false when isCaregiverViewing)
```

---

## Firebase Integration

### Firestore Structure

```
firebaseProject/
├── /users/{uid}
│   ├── role: 'patient' | 'caregiver'
│   ├── displayName: string
│   ├── fullName: string  (NEW)
│   ├── dateOfBirth: string  (ISO YYYY-MM-DD)
│   ├── gender: 'male' | 'female' | ...
│   ├── bloodGroup: 'A+' | 'B-' | ...  (patient only)
│   ├── heightCm: number
│   ├── weightKg: number
│   ├── allergies: string[]
│   ├── conditions: string[]  (preset chips: Diabetes, Hypertension, etc.)
│   ├── conditionsNotes: string
│   ├── emergencyContact: { name, phone, relationship }
│   ├── phoneNumber: string
│   ├── linkedPatientIds: string[]  (caregiver)
│   ├── linkedCaregiverIds: string[]  (patient)
│   ├── activePatientId: string | null  (caregiver session state, not persisted)
│   ├── detailsCompletedAt: timestamp  (marks profile filled ≥ once)
│   │
│   ├── /medications/{medId}
│   │   ├── name: string
│   │   ├── dosage: string
│   │   ├── frequency: string
│   │   ├── timing: ['morning' | 'afternoon' | 'evening' | 'night']
│   │   ├── startDate: string  (ISO)
│   │   └── instructions: string
│   │
│   ├── /logs/{dateStr}  (ISO YYYY-MM-DD as doc id)
│   │   ├── `${medId}_morning`: { medId, medName, dosage, timeSlot, taken, takenAt }
│   │   ├── `${medId}_afternoon`: {...}
│   │   ├── `${medId}_evening`: {...}
│   │   └── `${medId}_night`: {...}
│   │
│   ├── /documents/{docId}
│   │   ├── name: string
│   │   ├── type: 'prescription' | 'report' | 'summary'
│   │   ├── date: string
│   │   ├── doctor: string
│   │   ├── hospital: string
│   │   ├── medicines: string[]  (extracted medicine names)
│   │   ├── fileUrl: string
│   │   ├── extractedText?: string
│   │   ├── uploadedAt: Timestamp
│   │   └── processedAt: Timestamp
│   │
│   └── /appointments/{apptId}
│       ├── date: string  (ISO)
│       ├── time: string  (HH:MM)
│       ├── doctor: string
│       ├── hospital: string
│       ├── notes: string
│       └── reminderSent: boolean
│
└── /sosEvents/{eventId}
    ├── patientId: string
    ├── patientName: string
    ├── caregiverId: string
    ├── timestamp: Timestamp
    ├── status: 'pending' | 'acknowledged' | 'resolved'
    ├── urgencyScore: 'HIGH' | 'MED' | 'LOW'
    ├── transcription: string  (original language)
    ├── translatedText: string  (English)
    ├── aiSummary: string
    ├── language: string  (ISO code, e.g., 'hi-IN')
    ├── audioBase64: string  (data: URI, if base64 strategy)
    ├── audioStoragePath: string  (legacy, unused)
    ├── audioURL: string  (CDN URL, if cloudinary strategy)
    ├── ttsAudioURL: string | null  (summary audio playback URL)
    ├── acknowledgedAt: Timestamp | null
    └── acknowledgedBy: string | null
```

### Security Rules

**File**: `firestore.rules`

Key enforcements:
- Users can only read/write their own `/users/{uid}` doc + subcollections
- Caregivers can read patient's data but only if linked
- Patients write SOS events with caregiver UID checked against `linkedCaregiverIds`
- No SOS deletion permitted (`allow delete: if false`)
- Status transitions limited (can't retroactively change timestamp)

### Authentication

- Email/password via Firebase Auth
- No phone auth (would need Firebase Phone Provider setup)
- Each app instance gets unique `user.uid` from Firebase

---

## AI/ML Integrations

### Sarvam AI

**Services Exposed**:
- **STT**: `saarika:v2.5` (Indic speech recognition)
- **TTS**: `bulbul:v3` (Indic speech synthesis)
- **Chat**: `sarvam-30b` (LLM for Q&A + extraction)
- **Document Intelligence**: Multilingual OCR (auto-zips images)
- **Translate**: Auto-translate to English (fallback)

**Language Support**:
```javascript
const languageMap = {
  hi: 'hi-IN',     // Hindi
  ta: 'ta-IN',     // Tamil
  gu: 'gu-IN',     // Gujarati
  mr: 'mr-IN',     // Marathi
  te: 'te-IN',     // Telugu
  bn: 'bn-IN',     // Bengali
  kn: 'kn-IN',     // Kannada
  ml: 'ml-IN',     // Malayalam
  en: 'en-IN',     // English
};
```

**API Key**: Set via environment variable `VITE_SARVAM_API_KEY` or runtime override via Settings page

### Google Gemini

**Service**: Handwritten prescription recognition (2.5 Flash Vision model)

**Trigger**: Only used when Sarvam OCR produces suspiciously short output (< 100 chars)

**Result**: If Gemini produces longer output → prefer it; otherwise keep Sarvam result

**API Key**: Set via environment variable `VITE_GEMINI_API_KEY` (optional)

### Tesseract.js

**Role**: Offline OCR fallback (no API key needed)

**Quality**: Lower than Sarvam/Gemini but zero-cost

**Activation**: If all API-based OCR fails

---

## Accessibility Architecture

### Design Principles

1. **Elder-First Defaults**
   - Font size: `large` (18–20px body text, up to 32px headings)
   - Tap targets: 48px minimum
   - Color contrast: WCAG AAA compliant
   - No cognitive overload: clear sections, large buttons

2. **Accessibility Settings** (in Layout sidebar)
   - Theme: Light (white bg), Dark (navy bg), High-Contrast (pure black/white)
   - Font Size: Small, Normal, Large (default), Extra-Large
   - Reduce Motion: Honors OS preference, disables animations
   - Voice Feedback: Toggle TTS for all AI responses
   - Sound Volume: 0–100% slider

3. **Implementation**
   - Settings stored in `localStorage`
   - Applied via `data-*` attributes on `<html>`
   - CSS variables in `index.css` keyed to these attributes
   - No JS re-renders needed for theme changes (all CSS)

### CSS Variable System

**File**: `src/index.css`

```css
:root {
  /* Light theme (default) */
  --bg-primary: #ffffff;
  --bg-secondary: #f4f7ff;
  --text-primary: #0a1428;
  --text-secondary: #6c757d;
  --accent: #7c3aed;
  --accent-hover: #6d28d9;
  /* ... more variables ... */
}

html[data-theme='dark'] {
  --bg-primary: #0a1428;
  --bg-secondary: #1a2332;
  --text-primary: #f4f7ff;
  --text-secondary: #b0b8c1;
  /* ... */
}

html[data-high-contrast='true'] {
  --bg-primary: #ffffff;
  --text-primary: #000000;
  /* Pure B&W */
}

html[data-font-size='large'] {
  --base-font-size: 18px;
  --h1-size: 32px;
  /* ... */
}

html[data-reduce-motion='true'] {
  animation: none !important;
  transition: none !important;
}
```

### ARIA Labels & Screen Readers

- All interactive elements: `aria-label` + `aria-describedby` as needed
- SOS button: Clearly labeled for voice recorders
- Dose toggles: Status announced via `aria-pressed`
- Notification banners: `role="alert"` for urgent SOS events

### Voice Feedback

When `voiceFeedback === true`:
- AI responses auto-play TTS
- Appointment reminders read aloud
- Navigation changes announced (optional via alert)

---

## Key Features Deep Dive

### 1. Medication Tracking

**Core Flow**:
```
User adds med: "Aspirin, 1 tablet, twice daily, morning & evening"
  ↓
Stored in Firestore:
  {
    id: "med_123",
    name: "Aspirin",
    dosage: "1 tablet",
    frequency: "Twice daily",
    timing: ["morning", "evening"],
    startDate: "2026-10-17",
    instructions: ""
  }
  ↓
Home page renders 4 slots; show Aspirin in morning + evening
  ↓
User taps "Taken" for morning dose at 8:30am
  ↓
Logged as: {
  "med_123_morning": {
    medId: "med_123",
    medName: "Aspirin",
    dosage: "1 tablet",
    timeSlot: "morning",
    taken: true,
    takenAt: "08:30"
  }
}
  ↓
Adherence recomputed: 1 of 2 doses today = 50%
  ↓
Streak: 0 (not 100% today)
```

### 2. Prescription OCR & Medicine Import

**Critical Path**:
```
Documents page → Upload button → User picks "Rx_Dr_Patel.jpg"
  ↓
prescriptionPipeline("Rx_Dr_Patel.jpg")
  ↓
[Stage 1] Detect image → preprocess (grayscale + contrast)
  ↓
[Stage 2] Sarvam DI on preprocessed image
  → Output: "Dr. Patel, Apollo Hospital, 15-Oct-2026, Paracetamol 1-0-1, ..."
  ↓
[Stage 3] Text length OK? → Skip Gemini; go to Stage 5
  ↓
[Stage 5] sarvam-30b JSON extraction prompt
  → Input: raw OCR text
  → Output: { doctor: "Patel", hospital: "Apollo", medicines: [{name: "Paracetamol", dosage: "1 tablet", frequency: "thrice daily", timing: ["morning", "afternoon", "evening"]}] }
  ↓
Documents page shows: "Paracetamol" + "Import to Schedule" button
  ↓
User clicks → addMedication() fires → medicine added to Medicines tab
```

### 3. SOS Emergency Pipeline

**Full Orchestration** (sarvamSOSPipelineService):

```
Patient (Hindi speaker) taps SOS button at home
  ↓
SOSButton.tsx opens modal, enables mic
  ↓
User records: "मुझे सांस लेने में परेशानी हो रही है" (~15 sec)
  ↓
STT (Sarvam saarika:v2.5 + hi-IN):
  → Output: "मुझे सांस लेने में परेशानी हो रही है"
  ↓
Translate (Sarvam translate):
  → Output: "I am having difficulty breathing"
  ↓
Triage (sarvam-30b):
  → Prompt: "Classify urgency: HIGH / MED / LOW"
  → Output: "HIGH"
  ↓
TTS (Sarvam bulbul:v3 + en-IN):
  → Output: Audio blob of "Patient reports: Difficulty breathing. Urgency: HIGH"
  ↓
Audio Storage (strategy = 'base64'):
  → Encode mic recording → data:audio/wav;base64,...
  → Encode TTS → data:audio/wav;base64,...
  ↓
Firestore write:
  {
    patientId: "patient_uid",
    caregiverId: "caregiver_uid",
    timestamp: serverTimestamp(),
    status: "pending",
    urgencyScore: "HIGH",
    transcription: "मुझे सांस लेने में परेशानी हो रही है",
    translatedText: "I am having difficulty breathing",
    aiSummary: "Patient reports: Difficulty breathing. Urgency: HIGH",
    language: "hi-IN",
    audioBase64: "data:audio/wav;base64,UklGRi4k...",
    ttsAudioURL: "data:audio/wav;base64,UklGRi4k..."
  }
  ↓
[Caregiver's phone, if online]
Caregiver's SOSProvider subscription fires
  ↓
SOSAlertBanner appears: red + siren sound
  ↓
Caregiver sees: "Patient Name — 15s ago — HIGH"
  ↓
Click banner → SOSHistoryFeed modal
  ↓
Play mic recording + TTS summary
  ↓
Click "Acknowledge" button
  ↓
acknowledgeEvent(eventId) → status = "acknowledged", acknowledgedAt = now
  ↓
Banner disappears
  ↓
Event moved to "Acknowledged" tab in history
```

### 4. Caregiver Patient Linking

**Bidirectional Setup**:

```
Patient account (Alice):
  1. Open Profile → "Generate Invite Code"
  2. System generates 6-digit code: "AB12CD"
  3. Firestore: users/alice_uid { linkedCaregiverIds: [] }

Caregiver account (Bob):
  1. Open CaregiverLink tab
  2. Enter code: "AB12CD"
  3. System verifies code (read from Firestore invite collection)
  4. Bidirectional link:
     - users/alice_uid { linkedCaregiverIds: ["bob_uid"] }
     - users/bob_uid { linkedPatientIds: ["alice_uid"] }
  ↓
Bob's next login:
  - RoleContext loads profile → role = "caregiver"
  - linkedPatients array = [{userId: "alice_uid", name: "Alice", ...}]
  - Bob sees PatientSwitcher dropdown
  ↓
Bob switches to Alice:
  - setActivePatientId("alice_uid")
  - useActivePatient() paths now point to alice's medicines/logs/docs
  - MedicationContext re-subscribes → Bob sees Alice's meds + adherence (read-only)
  ↓
Bob tries to edit a med:
  - isOwnData = false (alice's data)
  - canWrite = false (isOwnData check fails)
  - UI disables buttons, shows "View Only" badge
```

### 5. Accessibility in Practice

**Scenario**: 65-year-old patient with low vision

```
1. Open PULSE → Login page
  ↓
2. See "Accessibility" link in top-right
  ↓
3. Click → AccessibilitySettings sidebar opens
  ↓
4. Set:
   - Theme: "High Contrast"
   - Font Size: "Extra-Large"
   - Reduce Motion: "On"
   - Voice Feedback: "On"
  ↓
5. Settings saved to localStorage
  ↓
6. <html> now has data-theme="dark" data-high-contrast="true" data-fontSize="extra-large" data-reduceMotion="true"
  ↓
7. CSS variables trigger:
   - Pure black text on white background (AAA contrast)
   - All font sizes +2 steps (32px body text)
   - Animations removed
  ↓
8. User goes to Home
  ↓
9. Medicine boxes are now 56px tall (was 48px)
  ↓
10. "Taken" button is now 56px × 56px (was 48px)
  ↓
11. Click "Taken"
  ↓
12. No animation; instant state change
  ↓
13. AI provides TTS feedback: "Aspirin marked taken at 8:30am"
```

---

## Development Guidelines

### Adding a New Page

1. Create `src/pages/NewPage.tsx`
2. Export a React FC component
3. Add case in `App.tsx` renderActiveTab switch
4. Import in `App.tsx`
5. Add tab button to Layout bottom nav

### Adding a New Service

1. Create `src/services/newService.ts`
2. Export stateless functions or static class methods
3. Import + use in components or other services
4. Add error handling + console logs for debugging

### Adding Context State

1. Create `src/context/NewContext.tsx`
2. Define interface for context value
3. Create context + provider component
4. Export custom hook (e.g., `useNew()`)
5. Nest provider in `App.tsx` (respect provider order!)
6. Use hook in components: `const ctx = useNew()`

### Environment Variables

Create `.env` file in root:

```env
# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...

# Sarvam AI
VITE_SARVAM_API_KEY=...

# Gemini (optional)
VITE_GEMINI_API_KEY=...

# Audio storage strategy
VITE_AUDIO_STORAGE=base64  # or 'cloudinary'

# Cloudinary (if VITE_AUDIO_STORAGE=cloudinary)
VITE_CLOUDINARY_CLOUD_NAME=...
VITE_CLOUDINARY_UPLOAD_PRESET=...

# Demo mode (skips real API calls in SOS)
VITE_DEMO_MODE=false
```

### Testing Workflows

1. **Local dev**: `npm run dev`
   - Vite serves on `http://localhost:5173`
   - Test on mobile: `http://<your-ip>:5173` from phone on same network

2. **Demo mode**: Set `VITE_DEMO_MODE=true` + use fake auth
   - SOS pipeline uses deterministic demo events
   - No Sarvam API quota spent

3. **Production build**: `npm run build && npm run preview`

### Debugging

- **Contexts**: Check Redux DevTools equivalent or add console logs in provider effect
- **Firestore**: View live data in Firebase Console
- **Sarvam API**: Check `console.log` in services (e.g., STT language mapping)
- **OCR**: prescriptionPipeline logs stage progression to console

### Performance Tips

- Code split by page (Vite automatic)
- Lazy load large models (Tesseract via createWorker)
- Reuse Firestore listeners (don't open > 1 per context)
- Cache API responses client-side where possible (e.g., medicine list)

---

## Common Pitfalls & Solutions

| Pitfall | Solution |
|---------|----------|
| Caregiver writes patient data | Check `canWrite = isOwnData` guard at mutation sites |
| Offline data lost | Mirror to localStorage in MedicationContext |
| SOS banner stuck showing | Check `status !== 'pending'` in SOSAlertBanner conditional |
| OCR hangs on large PDF | Tesseract worker can timeout; add timeout handler |
| STT mismatch between languages | Always pass `languageCode` from `useSettings()` |
| Adherence streak not reset | Verify logs are keyed by ISO date string (YYYY-MM-DD) |
| API key override not working | Settings page must be open; restart if cached |

---

## Quick Reference Checklists

### Before Deploying

- [ ] `.env.production` configured with real keys
- [ ] `firestore.rules` deployed: `firebase deploy --only firestore:rules`
- [ ] `firestore.indexes.json` deployed
- [ ] Firebase Auth enabled (email/password)
- [ ] Firestore in production mode (not test mode)
- [ ] Sarvam AI API key active + quota sufficient
- [ ] PWA manifest correct + icons present

### Testing a New Feature

- [ ] Unit test (if critical business logic)
- [ ] Manual test on desktop (Chrome DevTools)
- [ ] Manual test on mobile (local network)
- [ ] Test with accessibility settings enabled
- [ ] Check console for warnings/errors
- [ ] Verify Firestore write (if applicable)
- [ ] Verify offline fallback (if applicable)

---

## Summary

PULSE is a sophisticated PWA architected around **context-based state management**, **multi-stage service pipelines** (OCR, SOS), and **role-based data isolation**. Key innovation areas:

1. **Accessibility-First Design**: Theme, font, motion, and voice settings deeply integrated
2. **Multilingual AI**: Sarvam-powered STT/TTS/Chat in 9 Indian languages
3. **Robust Prescription Handling**: 5-stage OCR with graceful fallbacks
4. **Emergency Coordination**: Real-time SOS pipeline with caregiver alerts
5. **Family-First Architecture**: Patient-caregiver linking with read-only views

All data flows through Firestore with strong security rules; UI responsiveness maintained via real-time listeners and localStorage resilience.

---

**Document Version**: 1.0  
**Last Updated**: 2026-10-17 15:34 IST  
**Maintainer**: PULSE Dev Team
