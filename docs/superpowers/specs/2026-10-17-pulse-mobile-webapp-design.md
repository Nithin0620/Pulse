# Design Spec: Pulse Mobile Web App & Native Packaging

**Date:** 2026-10-17  
**Status:** Approved  
**Constraint:** Maintain visual identity and UI design completely. Only perform responsiveness fixes, ergonomic mobile improvements, and native mobile packaging.

---

## 1. Objectives & Guiding Principles

1. **Zero UI Disruption:** Preserve all existing colors (Navy/Teal accents), typography, elder-friendly high-contrast tokens, icons, and card layouts. No unsolicited visual redesigns.
2. **End-to-End Responsiveness:** Ensure every screen in Pulse renders flawlessly on mobile viewports (360px–420px), tablets (768px), and desktops (1024px+).
3. **Ergonomic Mobile Navigation:** Add a thumb-friendly bottom navigation bar on mobile matching existing design tokens, while keeping desktop sidebar untouched.
4. **Resilient Firebase Mobile Integration:** Enable offline Firestore persistence, Firebase Storage for documents & audio, and FCM push notifications for emergency SOS alerts.
5. **Capacitor Android Packaging:** Provide a native Android APK build using Capacitor while maintaining a single shared codebase.

---

## 2. Phase Breakdown

### Phase 1: Responsiveness Fixes & Layout Ergonomics
- **Navigation & Layout (`src/components/Layout.tsx`):**
  - Add a sticky mobile bottom navigation bar on screens `< 1024px` for quick access to primary tabs: Home, Medicines, Documents, Assistant, and Care.
  - Fix FAB collisions: Re-position Voice Add FAB and SOS Emergency button to prevent overlap on narrow screens (`< 380px`).
  - Top header on mobile: Keep app brand, language selector, and profile avatar aligned in a single line without wrapping.
  - Safe-area insets: Add `env(safe-area-inset-top)` and `env(safe-area-inset-bottom)` to prevent content hiding behind device notches and home bars.
- **Home Dashboard (`src/pages/Home.tsx`):**
  - Switch adherence progress ring (200px) and past 7-day bar chart from desktop multi-column side-by-side to a vertical stack on mobile screens.
  - Ensure 4-slot daily schedule cards (Morning, Afternoon, Evening, Night) use responsive flex/grid layouts with touch-friendly 48px tap targets.
- **Medicines Screen (`src/pages/Medicines.tsx`):**
  - Adjust "Add Medicine" modal dialog into a mobile bottom-sheet style container so inputs and dropdowns are fully visible when the virtual keyboard is open.
  - Fix time-slot chips and schedule filters to wrap cleanly without horizontal viewport overflow.
- **Documents Screen (`src/pages/Documents.tsx`):**
  - Optimize prescription upload area and camera capture preview for mobile screen widths.
  - Structured extraction preview badges (dosage, frequency, timing) wrap cleanly on small screens.
- **AI Assistant Screen (`src/pages/Assistant.tsx`):**
  - Ensure message stream uses dynamic viewport height (`dvh`) and stays pinned above the input bar when mobile keyboard opens.
- **Nearby Care Map (`src/pages/NearbyCare.tsx`):**
  - On mobile screens, provide a clean "Map / List" toggle view so users can switch between the interactive Leaflet map and the clinic/pharmacy card list without excessive vertical scrolling.
- **Appointments & Profile (`src/pages/Appointments.tsx`, `src/pages/Profile.tsx`):**
  - Ensure appointment cards, date pickers, and caregiver link forms fit comfortably within 360px viewports.

### Phase 2: Web App & PWA Enhancements
- Audit `index.html` and manifest settings: ensure `viewport-fit=cover`, mobile theme colors, and touch icons are properly linked.
- Smooth scrolling and touch action tuning to avoid unintended double-tap zooms on interactive buttons.

### Phase 3: Firebase Mobile Services
- **Cloud Firestore Offline Cache:**
  - Configure `persistentLocalCache` and `persistentMultipleTabManager` in `src/firebase.ts`.
  - Enables instant offline loading of medicines, logs, and user profile data.
- **Firebase Storage Integration:**
  - Add `getStorage` helper for uploading prescription images/PDFs and SOS audio recordings to Firebase Storage buckets.
- **Security & Storage Rules:**
  - Add Firebase Storage security rules protecting patient documents and SOS audio.

### Phase 4: Capacitor Android Setup & Packaging
- Install `@capacitor/core`, `@capacitor/cli`, and `@capacitor/android`.
- Configure `capacitor.config.ts` (App ID: `com.pulse.medtracker`, App Name: `Pulse`).
- Add Android platform: `npx cap add android`.
- Configure Android permissions in `AndroidManifest.xml`:
  - `android.permission.CAMERA`
  - `android.permission.RECORD_AUDIO`
  - `android.permission.POST_NOTIFICATIONS`
  - `android.permission.SCHEDULE_EXACT_ALARM`
- Build and verify Android debug `.apk`.

---

## 3. Testing & Verification Plan

1. **Responsiveness Testing:**
   - Chrome DevTools device mode testing at 360px (Galaxy S8 / small Android), 390px (iPhone 12/13/14), 768px (iPad/Tablet), and 1440px (Desktop).
   - Zero horizontal overflow (`overflow-x`) on any screen.
   - All interactive touch targets strictly $\ge 48\text{px}$.
2. **Build Verification:**
   - `npm run build` passes with zero TypeScript or Vite errors.
   - `npm run lint` passes without errors.
3. **Offline Sync Verification:**
   - Simulate offline mode in DevTools Network tab: verify medicine schedule loads from local cache and dose status can still be viewed.
