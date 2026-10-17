# Pulse Minimalist UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Pulse website UI to be clean, minimalistic, properly scaled (no oversized elements), powered by shadcn/ui primitives, Geist font, Hugeicons, transitions.dev-inspired minimal transitions, and a calming health-oriented palette (Medical Teal & Mint) with zero emojis or filler elements.

**Architecture:** Install required packages (`clsx`, `tailwind-merge`, `cva`, `hugeicons-react`, `@fontsource/geist-sans`, `@radix-ui/react-*`), establish the shadcn component primitive layer in `src/components/ui/`, normalize Tailwind scales and CSS variables in `src/index.css` & `tailwind.config.js`, refactor the navigation shell (`src/components/Layout.tsx`), and overhaul all core application views (`Home`, `Medicines`, `Vitals`, `Appointments`, `Documents`, `Assistant`, `Profile`) to replace hardcoded emojis, oversized cards/dials, and filler SVGs with crisp typography and semantic Hugeicons.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v3, Radix UI primitives, Hugeicons (`hugeicons-react`), Geist Sans (`@fontsource/geist-sans`), Vite.

**Spec:** [docs/superpowers/specs/2026-10-17-ui-redesign.md](file:///home/nithin/Projects/Pulse/docs/superpowers/specs/2026-10-17-ui-redesign.md)

## Global Constraints
- Root font size must be standard 16px (eliminate inflated 19px / 22px root sizes and 56px touch target bloat).
- Theme colors must use Medical Teal (`#0D9488` / `teal-600`) as primary and Mint/Emerald (`#10B981` / `emerald-500`) as adherence/success accent with soft slate neutrals.
- Primary font family must be Geist Sans (`font-sans`).
- All icons must use `hugeicons-react` (replace `lucide-react`).
- UI components must follow shadcn conventions (`src/components/ui/`).
- Zero hardcoded emojis in any UI labels, buttons, cards, or headings.
- Minimal transitions inspired by transitions.dev (`cubic-bezier(0.16, 1, 0.3, 1)`, 150ms-200ms duration).
- Maintain existing functional flows, Firebase bindings, and role logic (Patient & Caregiver).

---

### Task 1: Foundation Dependencies, Typography & Tailwind Normalization

**Files:**
- Create: `src/lib/utils.ts`
- Modify: `package.json`
- Modify: `src/main.tsx`
- Modify: `src/index.css`
- Modify: `tailwind.config.js`
- Modify: `index.html`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]): string` from `src/lib/utils.ts`
- Produces: Normalized CSS variables (`--color-primary`, `--color-accent`, standard font sizes, Geist font family)

- [ ] **Step 1: Install packages**
Run:
```bash
npm install clsx tailwind-merge class-variance-authority hugeicons-react @fontsource/geist-sans @radix-ui/react-dialog @radix-ui/react-slot @radix-ui/react-tabs
```

- [ ] **Step 2: Create `src/lib/utils.ts`**
Write `src/lib/utils.ts`:
```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 3: Import Geist font in `src/main.tsx` and configure `index.html`**
Add `@fontsource/geist-sans/400.css`, `@fontsource/geist-sans/500.css`, `@fontsource/geist-sans/600.css` in `src/main.tsx`.

- [ ] **Step 4: Update `src/index.css` and `tailwind.config.js`**
Update `tailwind.config.js` to set font family to `['"Geist Sans"', 'system-ui', 'sans-serif']`, restore standard Tailwind font sizes (`xs: 12px`, `sm: 14px`, `base: 16px`, `lg: 18px`, etc.), set up shadcn color aliases (`primary`, `secondary`, `destructive`, `muted`, `accent`, `card`, `background`, `border`, `input`, `ring`), and maintain backward compatibility for existing tokens. Normalize `src/index.css` root font size to standard 16px and add smooth transition utilities.

- [ ] **Step 5: Verify build passes**
Run: `npm run build`
Expected: Build succeeds with zero TypeScript errors.

- [ ] **Step 6: Commit**
```bash
git add package.json package-lock.json src/lib/utils.ts src/main.tsx src/index.css tailwind.config.js index.html
git commit -m "style: normalize typography with Geist, setup shadcn tokens and utility"
```

---

### Task 2: Build shadcn/ui Component Primitives

**Files:**
- Create: `src/components/ui/button.tsx`
- Create: `src/components/ui/card.tsx`
- Create: `src/components/ui/badge.tsx`
- Create: `src/components/ui/input.tsx`
- Create: `src/components/ui/dialog.tsx`
- Create: `src/components/ui/tabs.tsx`
- Create: `src/components/ui/progress.tsx`

**Interfaces:**
- Consumes: `cn` from `src/lib/utils.ts`, `@radix-ui/react-slot`, `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `class-variance-authority`
- Produces: `Button`, `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Badge`, `Input`, `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogTrigger`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`, `Progress`

- [ ] **Step 1: Create `src/components/ui/button.tsx`**
Implement standard shadcn button with variants (`default`, `destructive`, `outline`, `secondary`, `ghost`, `link`) and sizes (`default`, `sm`, `lg`, `icon`), using `cva` and `Slot`.

- [ ] **Step 2: Create `src/components/ui/card.tsx`**
Implement `Card`, `CardHeader`, `CardFooter`, `CardTitle`, `CardDescription`, `CardContent` with clean 1px border, subtle shadow, and responsive padding.

- [ ] **Step 3: Create `src/components/ui/badge.tsx`**
Implement `Badge` with variants (`default` teal, `secondary`, `destructive`, `outline`, `success` mint, `warning`).

- [ ] **Step 4: Create `src/components/ui/input.tsx`**
Implement `Input` with clean focus ring (`focus-visible:ring-1 focus-visible:ring-teal-500`) and standard `h-9` height.

- [ ] **Step 5: Create `src/components/ui/dialog.tsx`**
Implement `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogFooter`, `DialogTitle`, `DialogDescription`, `DialogClose` wrapping `@radix-ui/react-dialog` with backdrop blur and smooth transitions.

- [ ] **Step 6: Create `src/components/ui/tabs.tsx` and `src/components/ui/progress.tsx`**
Implement `Tabs` wrapping `@radix-ui/react-tabs` and `Progress` component with clean `h-2` bar and smooth fill transition.

- [ ] **Step 7: Verify TypeScript compilation**
Run: `npm run build`
Expected: Build succeeds with zero errors.

- [ ] **Step 8: Commit**
```bash
git add src/components/ui/
git commit -m "feat(ui): add core shadcn component primitives"
```

---

### Task 3: Refactor Shell & Navigation (`Layout.tsx` & Headers)

**Files:**
- Modify: `src/components/Layout.tsx`
- Modify: `src/components/SOSButton.tsx`
- Modify: `src/components/PatientSwitcher.tsx`
- Modify: `src/components/AccessibilitySettings.tsx`
- Modify: `src/components/SOSAlertBanner.tsx`

**Interfaces:**
- Consumes: `hugeicons-react`, `Button`, `Badge`, `Dialog`
- Replaces: All `lucide-react` icons in Layout with `hugeicons-react` (`DashboardSquare01Icon`, `Medicine01Icon`, `Activity01Icon`, `Calendar03Icon`, `File02Icon`, `AiChat02Icon`, `Location01Icon`, `UserIcon`, etc.)
- Normalizes: Slim header (`h-14`), clean desktop sidebar, streamlined mobile bottom nav, remove emojis from notification texts and menus.

- [ ] **Step 1: Replace Lucide with Hugeicons in `Layout.tsx`**
Swap all Lucide imports for Hugeicons counterparts.

- [ ] **Step 2: Streamline Header, Sidebar, and Mobile Nav**
Reduce header height to a crisp `h-14`. Refactor mobile navigation bar into a minimalist bottom bar with clean icons and 11px text labels. Ensure active tab highlights with Medical Teal.

- [ ] **Step 3: Refactor SOS Button and Modal in `src/components/SOSButton.tsx`**
Replace oversized trigger button with a sleek, minimalist emergency pill. Refactor modal to use shadcn dialog with clean typography and zero emojis.

- [ ] **Step 4: Refactor PatientSwitcher & AccessibilitySettings**
Update dialogs and menus to use shadcn primitives, standard input sizing, and Hugeicons.

- [ ] **Step 5: Verify build passes**
Run: `npm run build`
Expected: Build succeeds with zero errors.

- [ ] **Step 6: Commit**
```bash
git add src/components/Layout.tsx src/components/SOSButton.tsx src/components/PatientSwitcher.tsx src/components/AccessibilitySettings.tsx src/components/SOSAlertBanner.tsx
git commit -m "refactor(shell): modernize Layout and navigation with Hugeicons and shadcn primitives"
```

---

### Task 4: Redesign Home Dashboard (`src/pages/Home.tsx`)

**Files:**
- Modify: `src/pages/Home.tsx`
- Modify: `src/components/CaregiverEnterCodeCard.tsx`
- Modify: `src/components/SOSHistoryFeed.tsx`
- Modify: `src/components/NearbyCareCard.tsx`

**Interfaces:**
- Consumes: `Card`, `Button`, `Badge`, `Progress` from `src/components/ui/`, Hugeicons
- Eliminates: 200px oversized ring SVG, hardcoded emojis, oversized stat banners
- Produces: Clean responsive dashboard with compact adherence summary, next dose countdown card, and 4-column responsive medicine slot schedule.

- [ ] **Step 1: Replace Lucide with Hugeicons**
Import `CheckmarkCircle02Icon`, `Clock01Icon`, `Calendar03Icon`, `ArrowRight01Icon`, `FireIcon` / `EnergyIcon` from `hugeicons-react`.

- [ ] **Step 2: Replace oversized adherence ring with minimalist progress card**
Replace the 200px SVG circular gauge with a modern, compact adherence card featuring a clean percentage display, dose counts, and a slim shadcn `Progress` bar.

- [ ] **Step 3: Redesign Next Dose card and Today's schedule grid**
Refactor the dose slots (`morning`, `afternoon`, `evening`, `night`) into a clean responsive grid (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`) with shadcn `Card`s, minimalist badges, and one-tap completion toggles.

- [ ] **Step 4: Polish Caregiver cards & SOS history**
Update `CaregiverEnterCodeCard`, `SOSHistoryFeed`, and `NearbyCareCard` to use shadcn `Card`, `Badge`, and `Button`, eliminating all emojis.

- [ ] **Step 5: Verify build and layout**
Run: `npm run build`
Expected: Build succeeds with zero errors.

- [ ] **Step 6: Commit**
```bash
git add src/pages/Home.tsx src/components/CaregiverEnterCodeCard.tsx src/components/SOSHistoryFeed.tsx src/components/NearbyCareCard.tsx
git commit -m "refactor(home): redesign dashboard with minimalist shadcn cards, Hugeicons, and responsive slots"
```

---

### Task 5: Redesign Medicines & Vitals Pages

**Files:**
- Modify: `src/pages/Medicines.tsx`
- Modify: `src/components/MedicineInfoPanel.tsx`
- Modify: `src/pages/Vitals.tsx`

**Interfaces:**
- Consumes: `Card`, `Button`, `Badge`, `Dialog`, `Input`, `Tabs` from `src/components/ui/`, Hugeicons
- Replaces: Lucide icons, hardcoded emojis, oversized buttons and dials
- Produces: Minimalist medicine catalog with clean timing chips and dosage badges; 4-metric vitals dashboard with streamlined camera monitor and waveform card.

- [ ] **Step 1: Redesign `Medicines.tsx`**
Replace Lucide icons with Hugeicons. Refactor medication list into a crisp responsive grid of shadcn `Card`s with clean dosage badges, schedule tags, and streamlined delete/edit actions. Replace add-medicine form with shadcn `Dialog` and clean `Input` fields. Remove all emojis.

- [ ] **Step 2: Redesign `MedicineInfoPanel.tsx`**
Update side panel/dialog to use shadcn `Card` and clean typography.

- [ ] **Step 3: Redesign `Vitals.tsx`**
Replace Lucide icons with Hugeicons (`Activity01Icon`, `Heart01Icon`, `LungsIcon`, `WavesIcon`). Redesign the 4 metric cards (Heart Rate, SpO2, Respiration, HRV) in a balanced responsive grid with clean trend indicators. Streamline the camera video preview box and controls to fit comfortably within the viewport without oversized buttons. Remove emojis.

- [ ] **Step 4: Verify build passes**
Run: `npm run build`
Expected: Build succeeds with zero errors.

- [ ] **Step 5: Commit**
```bash
git add src/pages/Medicines.tsx src/components/MedicineInfoPanel.tsx src/pages/Vitals.tsx
git commit -m "refactor(meds,vitals): modernize medicines and vitals pages with shadcn UI and Hugeicons"
```

---

### Task 6: Redesign Appointments, Documents, Assistant, Profile & Onboarding

**Files:**
- Modify: `src/pages/Appointments.tsx`
- Modify: `src/pages/Documents.tsx`
- Modify: `src/pages/Assistant.tsx`
- Modify: `src/pages/Profile.tsx`
- Modify: `src/pages/NearbyCare.tsx`
- Modify: `src/pages/Onboarding.tsx`
- Modify: `src/pages/Login.tsx`

**Interfaces:**
- Consumes: shadcn UI primitives, Hugeicons
- Replaces: Remaining Lucide icons, emojis, oversized form controls and filler elements across all remaining views.

- [ ] **Step 1: Redesign `Appointments.tsx` and `NearbyCare.tsx`**
Replace Lucide with Hugeicons. Style appointment cards, doctor list, and booking dialog with shadcn `Card`, `Badge`, and `Button`. Ensure clean responsive maps/list layout.

- [ ] **Step 2: Redesign `Documents.tsx`**
Replace Lucide with Hugeicons. Style upload dropzone and document cards with shadcn primitives. Clean up PDF/OCR extraction drawer with minimalist typography.

- [ ] **Step 3: Redesign `Assistant.tsx`**
Replace Lucide with Hugeicons (`SparklesIcon`, `AiChat02Icon`, `Mic01Icon`, `Send01Icon`). Refactor chat bubbles into clean, minimalist speech cards with subtle background contrast, and style the sticky bottom prompt bar with shadcn `Input` and `Button`.

- [ ] **Step 4: Redesign `Profile.tsx`, `Onboarding.tsx`, and `Login.tsx`**
Style forms, role switches, and emergency contact lists with shadcn components. Eliminate all remaining emojis.

- [ ] **Step 5: Verify build passes**
Run: `npm run build`
Expected: Build succeeds with zero errors.

- [ ] **Step 6: Commit**
```bash
git add src/pages/Appointments.tsx src/pages/Documents.tsx src/pages/Assistant.tsx src/pages/Profile.tsx src/pages/NearbyCare.tsx src/pages/Onboarding.tsx src/pages/Login.tsx
git commit -m "refactor(views): modernize appointments, documents, assistant, and auth pages with shadcn UI"
```

---

### Task 7: Final Polish, Sizing Verification & Cleanup

**Files:**
- Modify: `src/App.css`
- Modify: `src/index.css`
- Remove: Unused filler SVG illustration assets or references if any
- Verify: Full test build, responsive resizing, zero emojis

- [ ] **Step 1: Check for remaining emojis across codebase**
Run: `grep -r -P '[\x{1F300}-\x{1F9FF}]' src/`
Fix any lingering emojis in source text or labels.

- [ ] **Step 2: Verify responsive resizing and layout**
Confirm on mobile, tablet, and desktop viewports that elements scale naturally and no component overflows or appears oversized.

- [ ] **Step 3: Run full TypeScript check and build**
Run: `npm run build`
Expected: Clean build with no warnings or errors.

- [ ] **Step 4: Final commit**
```bash
git add -A
git commit -m "chore: final cleanup and verification of minimalist UI redesign"
```
