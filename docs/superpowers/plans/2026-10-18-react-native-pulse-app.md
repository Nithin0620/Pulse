# React Native PULSE Mobile App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, production-grade React Native (Expo) mobile application inside `/app` that mirrors the full-stack PULSE healthcare web app (`pulse.ssh.net.in`) with real-time Firebase sync, Sarvam AI voice/translation, Gemini Vision OCR, and 9 Indian languages.

**Architecture:** An Expo React Native application utilizing React Navigation (Bottom Tab + Native Stack) connecting directly to Firebase Firestore/Auth with AsyncStorage persistence. Reusable contexts manage state for Auth, Role, Medication schedules, SOS alerts, and 9-language Accessibility, while dedicated native services interface with Sarvam AI, Google Gemini, and OpenStreetMap Overpass.

**Tech Stack:** React Native 0.88, Expo 58, TypeScript, React Navigation v6, Firebase JS SDK v10 with AsyncStorage, Expo AV, Expo Location, Expo Image/Document Picker, React Native Maps, Sarvam AI REST API, Google Gemini Flash REST API.

**Spec:** `docs/superpowers/specs/2026-10-18-react-native-pulse-app-design.md`

## Global Constraints
- Target workspace directory: `/home/nithin/Projects/Pulse/app`
- Do NOT run `git commit` without explicit permission from user ("carefully dont commit without asking me ok ?")
- Strict TypeScript verification: All code must compile cleanly via `npx tsc --noEmit` in `/app`
- Shared Firebase configuration from root `.env` (`kunal-projects`)
- Dark navy theme styling tokens matching the web app (`#030712`, `#0B132B`, `#0F172A`, `#1E293B`, `#0D9488`, `#EF4444`)

---

### Task 1: Expo Foundation & Firebase Setup

**Files:**
- Create: `app/app.json`
- Create: `app/babel.config.js`
- Create: `app/tsconfig.json`
- Create: `app/src/config/env.ts`
- Create: `app/src/firebase.ts`

- [ ] **Step 1: Create Expo config (`app/app.json`)**
- [ ] **Step 2: Create Babel config (`app/babel.config.js`)**
- [ ] **Step 3: Create TypeScript config (`app/tsconfig.json`)**
- [ ] **Step 4: Create Environment Config (`app/src/config/env.ts`)** with credentials matching root `.env`
- [ ] **Step 5: Create Firebase initialization (`app/src/firebase.ts`)** with AsyncStorage auth persistence and Firestore instance

---

### Task 2: Type Definitions & State Management Contexts

**Files:**
- Create: `app/src/types/index.ts`
- Create: `app/src/context/SettingsContext.tsx` (9 Indic languages dictionary, themes, font sizes)
- Create: `app/src/context/FirebaseContext.tsx` (Firebase Auth observer, login, signup, logout)
- Create: `app/src/context/RoleContext.tsx` (Patient vs Caregiver role, linked patients, active patient switcher)
- Create: `app/src/context/MedicationContext.tsx` (Real-time Firestore sync for doses, schedule logging, adherence streaks)
- Create: `app/src/context/SOSContext.tsx` (Emergency alert subscription, trigger SOS, acknowledge/resolve)

- [ ] **Step 1: Write comprehensive TypeScript types for Medication, UserProfile, SOSAlert, Appointment, etc.**
- [ ] **Step 2: Implement SettingsContext with full 9-language translation dictionary**
- [ ] **Step 3: Implement FirebaseContext with AsyncStorage auth restoration**
- [ ] **Step 4: Implement RoleContext for patient & caregiver modes**
- [ ] **Step 5: Implement MedicationContext with real-time Firestore listeners**
- [ ] **Step 6: Implement SOSContext with active alert tracking**

---

### Task 3: Native Service Layer (Sarvam AI, Gemini Vision, Overpass, Vitals)

**Files:**
- Create: `app/src/services/sarvamService.ts` (STT, TTS with expo-av playback, Chat saaras/105b, Translation)
- Create: `app/src/services/geminiVisionService.ts` (Gemini 2.5 Flash prescription handwriting OCR)
- Create: `app/src/services/overpassService.ts` (Nearby hospitals, clinics, pharmacies API)
- Create: `app/src/services/vitalsService.ts` (Vitals logging, stats, normal ranges)

- [ ] **Step 1: Implement SarvamService for STT audio upload, TTS audio streaming via Expo AV Sound, Chat, and Translate**
- [ ] **Step 2: Implement GeminiVisionService for base64 image medical extraction**
- [ ] **Step 3: Implement OverpassService for geolocation-based medical POI fetching**
- [ ] **Step 4: Implement VitalsService for tracking BP, Sugar, SpO2, Heart Rate, Temp**

---

### Task 4: Navigation Structure & Reusable Global Modals

**Files:**
- Create: `app/src/components/Header.tsx`
- Create: `app/src/components/SOSAlertBanner.tsx`
- Create: `app/src/components/PatientSwitcherModal.tsx`
- Create: `app/src/components/AccessibilityModal.tsx`
- Create: `app/src/navigation/BottomTabNavigator.tsx`
- Create: `app/src/navigation/RootNavigator.tsx`

- [ ] **Step 1: Implement Header component with role status, caregiver switcher button, and language quick toggle**
- [ ] **Step 2: Implement SOSAlertBanner with audio play preview for caregivers**
- [ ] **Step 3: Implement PatientSwitcherModal and AccessibilityModal**
- [ ] **Step 4: Implement BottomTabNavigator with 5 tabs (Home, Medicines, Vitals, Documents, Assistant)**
- [ ] **Step 5: Implement RootNavigator with Stack Navigation for Auth and auxiliary views**

---

### Task 5: Authentication & Profile Screens

**Files:**
- Create: `app/src/screens/LoginScreen.tsx`
- Create: `app/src/screens/OnboardingScreen.tsx`
- Create: `app/src/screens/ProfileScreen.tsx`

- [ ] **Step 1: Implement LoginScreen with Email/Password, role toggle, demo quick-fill, and language selector**
- [ ] **Step 2: Implement OnboardingScreen for initial user setup (role, medical conditions, emergency contacts)**
- [ ] **Step 3: Implement ProfileScreen with personal info, conditions, and signout**

---

### Task 6: Patient Dashboard & SOS Experience

**Files:**
- Create: `app/src/screens/DashboardScreen.tsx`
- Create: `app/src/components/SOSButton.tsx`
- Create: `app/src/screens/AdherenceReportScreen.tsx`

- [ ] **Step 1: Implement SOSButton with pressing animation, audio recording via expo-av, Sarvam triage API, and Firestore alert creation**
- [ ] **Step 2: Implement DashboardScreen with greeting, next-dose countdown card, 4-slot daily dosage checklist, adherence streak, and quick action cards**
- [ ] **Step 3: Implement AdherenceReportScreen with 7-day adherence charts and history**

---

### Task 7: Medication Management

**Files:**
- Create: `app/src/screens/MedicinesScreen.tsx`
- Create: `app/src/components/MedicineModal.tsx`
- Create: `app/src/components/MedicineDetailSheet.tsx`

- [ ] **Step 1: Implement MedicinesScreen with active/inactive medication cards, time-slot filters, and dosage info**
- [ ] **Step 2: Implement MedicineModal with manual entry form and voice input button (Sarvam STT voice parse)**
- [ ] **Step 3: Implement MedicineDetailSheet with indications, instructions, and delete action**

---

### Task 8: Vitals & Pulse Scanner Screen

**Files:**
- Create: `app/src/screens/VitalsScreen.tsx`

- [ ] **Step 1: Implement VitalsScreen with log forms for BP, Blood Sugar, Heart Rate, SpO2, Temperature**
- [ ] **Step 2: Implement interactive pulse scanner simulation / camera feed visual and historical trends list**

---

### Task 9: Prescriptions & Document Intelligence Screen

**Files:**
- Create: `app/src/screens/DocumentsScreen.tsx`

- [ ] **Step 1: Implement DocumentsScreen with camera capture (expo-image-picker) and PDF/Document picker (expo-document-picker)**
- [ ] **Step 2: Wire multi-engine OCR extraction (Sarvam / Gemini fallback) to auto-extract doctor, diagnosis, and medicines**
- [ ] **Step 3: Implement one-tap import into medication schedule with confirmation**

---

### Task 10: AI Health Assistant Screen

**Files:**
- Create: `app/src/screens/AssistantScreen.tsx`

- [ ] **Step 1: Implement AssistantScreen with general medical chat and document Q&A modes**
- [ ] **Step 2: Implement voice mic input with Sarvam STT and audio reply button using Sarvam TTS with Expo AV**
- [ ] **Step 3: Add localized suggested prompts in Hindi, Tamil, and English**

---

### Task 11: Appointments Screen & Nearby Care Map

**Files:**
- Create: `app/src/screens/AppointmentsScreen.tsx`
- Create: `app/src/screens/NearbyCareScreen.tsx`

- [ ] **Step 1: Implement AppointmentsScreen with booking form, upcoming list, and TTS reminder trigger**
- [ ] **Step 2: Implement NearbyCareScreen with `react-native-maps` and list view, querying Overpass API for hospitals/clinics/pharmacies within 5km, with tap-to-call and map navigation**

---

### Task 12: Caregiver Link Screen & Root Integration

**Files:**
- Create: `app/src/screens/CaregiverLinkScreen.tsx`
- Create: `app/App.tsx`
- Create: `app/index.ts`

- [ ] **Step 1: Implement CaregiverLinkScreen with invite code generator for patients and code linker for caregivers**
- [ ] **Step 2: Create root `app/App.tsx` nesting all Providers (Accessibility, Settings, Firebase, Role, Medication, SOS) inside NavigationContainer**
- [ ] **Step 3: Register root entry in `app/index.ts`**

---

### Task 13: TypeScript & Bundling Verification

- [ ] **Step 1: Run `npx tsc --noEmit` in `/app` and resolve any type errors**
- [ ] **Step 2: Run verification checks to confirm clean dependencies and package structure**
- [ ] **Step 3: Summarize completed implementation for the user without running git commit**
