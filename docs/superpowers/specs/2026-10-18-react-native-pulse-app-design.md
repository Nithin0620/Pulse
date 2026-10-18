# React Native Mobile App for PULSE — System Architecture & Design Spec

**Date:** 2026-10-18  
**Target Directory:** `/home/nithin/Projects/Pulse/app`  
**Reference Web App:** `pulse.ssh.net.in` (and root web project `/home/nithin/Projects/Pulse`)

---

## 1. Overview & Objectives

PULSE is an AI-powered, family-first medication tracking and emergency response platform built for India's elderly and their caregivers in 9 Indian languages. 
This specification outlines the end-to-end React Native (Expo) implementation housed in the `/app` subdirectory, achieving pixel-consistent visuals, identical interaction flows, and synchronized real-time data persistence with the web app.

### Key Objectives
1. **End-to-End Feature Parity**:
   - Authentication (Email/Password Login, Role selection: Patient & Caregiver).
   - Patient Dashboard: Daily 4-slot medicine schedules (Morning, Afternoon, Evening, Night), one-tap dose logging, adherence streak, next-dose timer, quick access cards.
   - Medicines Manager: Medicine list, dosage details, schedules, active reminders, add medicine with Sarvam Voice STT and manual form, medicine information modal.
   - Prescriptions / Documents: Camera/gallery upload via Expo, OCR pipeline (Sarvam & Gemini fallback), structured medicine extraction, one-tap import into medication schedule.
   - Vitals & Pulse Scanner: Real-time logging of BP, Blood Sugar, SpO2, Heart Rate, Temperature, Weight with historical charts and interactive vitals scan.
   - AI Health Assistant: Sarvam AI Indic chat (`saaras` / `sarvam-105b`), STT voice input, audio TTS response playback (`bulbul:v2`), localized suggestion chips, document Q&A mode.
   - SOS Emergency Pipeline: Instant emergency button, voice recording, Sarvam triage analysis (urgency rating HIGH/MED/LOW), real-time Firestore dispatch.
   - Caregiver Hub & Alerts: Unacknowledged SOS alert banner, audio playback of patient distress recording, resolve workflow, patient switcher, and read-only patient tracking.
   - Nearby Care: Map view using `react-native-maps` and list view querying the Overpass API for hospitals, clinics, and pharmacies within 5 km, with click-to-call and map navigation.
   - Appointments: Scheduling, list, and 24h voice reminders.
   - Multilingual & Accessibility: 9 Indian languages (Hindi, Tamil, Telugu, Gujarati, Marathi, Bengali, Kannada, Malayalam, English), high contrast, elder-friendly large typography.

2. **Real-time Backend Synchronization**:
   - Connect directly to the existing Firebase project (`kunal-projects`).
   - Identical collections: `medications`, `users`, `sos_alerts`, `appointments`, `prescriptions`, `patient_caregiver_links`.
   - Real-time Firestore snapshot listeners so updates on web instantly reflect in mobile and vice-versa.

---

## 2. Technical Stack & Dependencies

- **Framework**: React Native 0.88.0 + Expo ~58.0.14
- **Navigation**: `@react-navigation/native`, `@react-navigation/bottom-tabs`, `@react-navigation/native-stack`
- **Styling**: Native styling tokens mirroring Tailwind palette (`#030712`, `#0F172A`, `#1E293B`, `#0D9488`, `#EF4444`)
- **Backend & Auth**: Firebase v10 (`firebase/app`, `firebase/auth`, `firebase/firestore`) with `@react-native-async-storage/async-storage` persistence
- **Audio & Media**: `expo-av` for audio recording and audio streaming (TTS)
- **Files & Camera**: `expo-image-picker`, `expo-document-picker`, `expo-file-system`
- **Mapping & Location**: `react-native-maps`, `expo-location`
- **AI Integrations**:
  - Sarvam AI: STT (`saarika:v2.5`), TTS (`bulbul:v2`), Chat (`sarvam-105b`), Translate (auto -> `en-IN`)
  - Google Gemini: Gemini 2.5 Flash for vision OCR fallback

---

## 3. Directory Structure (`/app`)

```
/app
├── App.tsx                     # Root App entry with providers and NavigationContainer
├── app.json                    # Expo project configuration
├── babel.config.js             # Babel configuration
├── tsconfig.json               # TypeScript configuration
├── src/
│   ├── firebase.ts             # Firebase initialization & AsyncStorage persistence
│   ├── types/                  # Shared TypeScript interfaces (Medication, SOS, User, etc.)
│   ├── context/
│   │   ├── FirebaseContext.tsx # Auth state, user profile, login, signup, logout
│   │   ├── SettingsContext.tsx # Language (9 languages), translations, font sizing, theme
│   │   ├── RoleContext.tsx     # Role (patient vs caregiver), linked patients, active patient
│   │   ├── MedicationContext.tsx # Real-time medication state, log dose, add/edit/delete
│   │   └── SOSContext.tsx      # Real-time SOS alerts, trigger SOS, acknowledge/resolve
│   ├── services/
│   │   ├── sarvamService.ts    # STT, TTS, Chat, Translation APIs
│   │   ├── geminiVisionService.ts # Prescription OCR vision API
│   │   ├── overpassService.ts  # Nearby hospitals, clinics, pharmacies
│   │   └── vitalsService.ts    # Vitals history & analytics
│   ├── navigation/
│   │   ├── RootNavigator.tsx   # Stack Navigator for Auth vs Main flow
│   │   └── BottomTabNavigator.tsx # 5 primary tabs + header actions
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── MedicinesScreen.tsx
│   │   ├── VitalsScreen.tsx
│   │   ├── DocumentsScreen.tsx
│   │   ├── AssistantScreen.tsx
│   │   ├── AppointmentsScreen.tsx
│   │   ├── NearbyCareScreen.tsx
│   │   ├── CaregiverLinkScreen.tsx
│   │   ├── AdherenceReportScreen.tsx
│   │   └── ProfileScreen.tsx
│   └── components/
│       ├── Header.tsx          # Top bar with patient switcher, language quick toggle, user avatar
│       ├── SOSButton.tsx       # Emergency floating/card trigger with audio recorder
│       ├── SOSAlertBanner.tsx  # Caregiver real-time emergency banner
│       ├── PatientSwitcherModal.tsx
│       ├── AccessibilityModal.tsx
│       └── MedicineModal.tsx
```

---

## 4. Implementation Validation & Quality Gates
- TypeScript verification with `npx tsc --noEmit`
- Clean bundling test via `npx expo export --dry-run` or Metro bundler check
- Verification that all navigation routes render smoothly without crash
- Audio recording & TTS playback handling error safety for simulator/emulator
- Zero git commit without explicit user permission.
