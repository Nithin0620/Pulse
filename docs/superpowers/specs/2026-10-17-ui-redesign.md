# Pulse UI Redesign Specification

## 1. Overview and Objectives
Redesign the user interface of Pulse to deliver a modern, clean, minimalist, healthcare-focused aesthetic with proper responsive scaling, standard typography, shadcn-based component primitives, Hugeicons, and smooth micro-transitions.

### Core Goals
- **Clean & Responsive Sizing**: Normalize all oversized components (eliminate 19px base font bloat, oversized 200px dials, and massive buttons) to standard responsive web sizing (`16px` rem root, `h-9`/`h-10` interactive heights, balanced card paddings).
- **Health-Oriented Minimalist Palette**: Adopt a calming, clinical **Medical Teal & Mint** theme with soft slate/zinc neutrals, subtle 1px borders, and high legibility.
- **Iconography**: Migrate from `lucide-react` to **Hugeicons** (`hugeicons-react`) with consistent sizing (`18px`/`20px`) and stroke weights.
- **Typography**: Set primary font to **Geist Sans** across headings, body, and labels.
- **Component Architecture**: Build a standard **shadcn/ui** primitive set (`Button`, `Card`, `Badge`, `Input`, `Dialog`, `Tabs`, `Separator`, etc.) leveraging Radix UI and Tailwind CSS (`cn` utility).
- **Minimal Transitions**: Implement micro-interactions inspired by *transitions.dev* using smooth easing (`cubic-bezier(0.16, 1, 0.3, 1)`) and 150–200ms durations.
- **Eliminate Emojis & Filler Elements**: Strip all hardcoded emojis and 3D filler illustration SVGs in favor of crisp typography, semantic badges, and functional Hugeicons.

---

## 2. Design Tokens & Styling Architecture

### 2.1 Typography
- **Font**: Geist Sans (`font-sans`) as primary font family, loaded via Google Fonts / `@fontsource/geist-sans` or package `geist`.
- **Root Scale**: `1rem = 16px` (standard browser root).
- **Type Scale**:
  - `text-xs`: `0.75rem` / `12px` (line-height: `1rem`)
  - `text-sm`: `0.875rem` / `14px` (line-height: `1.25rem`)
  - `text-base`: `1rem` / `16px` (line-height: `1.5rem`)
  - `text-lg`: `1.125rem` / `18px` (line-height: `1.75rem`)
  - `text-xl`: `1.25rem` / `20px` (line-height: `1.75rem`)
  - `text-2xl`: `1.5rem` / `24px` (line-height: `2rem`)
  - `text-3xl`: `1.875rem` / `30px` (line-height: `2.25rem`)

### 2.2 Color Palette (Medical Teal & Mint)
- **Primary (Medical Teal)**:
  - Default: `hsl(173 80% 36%)` / `#0D9488` (Teal 600)
  - Foreground: `hsl(0 0% 100%)`
  - Subtle hover: `hsl(173 80% 30%)`
- **Secondary / Success (Mint / Emerald)**:
  - Default: `hsl(160 84% 39%)` / `#10B981` (Emerald 500)
  - Light Surface: `hsl(160 84% 97%)` (Emerald 50)
- **Destructive**: `hsl(0 84% 60%)` / `#EF4444` (Rose/Red 500)
- **Warning**: `hsl(38 92% 50%)` / `#F59E0B` (Amber 500)
- **Neutrals (Light Theme)**:
  - Background: `hsl(210 20% 98%)` (Clean porcelain)
  - Card: `hsl(0 0% 100%)` (Pure white)
  - Border: `hsl(214 32% 91%)` (Subtle divider)
  - Text Primary: `hsl(222 47% 11%)` (Deep slate)
  - Text Secondary: `hsl(215 16% 47%)` (Muted slate)
- **Neutrals (Dark Theme)**:
  - Background: `hsl(222 47% 7%)`
  - Card: `hsl(222 47% 11%)`
  - Border: `hsl(217 33% 17%)`
  - Text Primary: `hsl(210 40% 98%)`
  - Text Secondary: `hsl(215 20% 65%)`

### 2.3 Transitions & Micro-interactions
- Timing function: `cubic-bezier(0.16, 1, 0.3, 1)`
- Duration: `150ms` for buttons/toggles, `200ms` for modals/dialogs/sheets
- Smooth scale on tap/hover (`hover:-translate-y-0.5`, `active:scale-[0.98]`)
- Respects `prefers-reduced-motion` and accessibility reduce-motion settings.

---

## 3. Component Architecture (`src/components/ui/`)

Using standard shadcn/ui patterns with `cn` (`clsx` + `tailwind-merge`):

1. **`Button`**:
   - Variants: `default` (teal), `secondary` (subtle slate), `outline` (border), `ghost`, `destructive` (danger).
   - Sizes: `sm` (h-8 px-3 text-xs), `default` (h-9 px-4 py-2 text-sm), `lg` (h-10 px-6 text-sm), `icon` (h-9 w-9).
2. **`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`**:
   - Clean 1px border, rounded-xl (`12px`), soft shadow (`shadow-sm`).
3. **`Badge`**:
   - Variants: `default` (teal), `secondary` (muted), `outline`, `success` (mint/emerald), `destructive` (rose), `warning` (amber).
   - Pill radius, uppercase tracking option for metadata.
4. **`Input` & `Textarea`**:
   - Standard h-9 height for inputs, rounded-md, focus-visible ring in teal-500.
5. **`Dialog` & `Sheet`**:
   - Radix dialog primitive with backdrop blur (`backdrop-blur-sm bg-black/40`), smooth fade-in and scale-in animation.
6. **`Tabs`**:
   - Clean pill or underline tab headers with smooth active tab transition.
7. **`Progress`**:
   - Slim height (`h-2`), rounded-full, smooth transition fill.

---

## 4. Icon Migration (`hugeicons-react`)

All instances of `lucide-react` will be replaced with corresponding `hugeicons-react` icons:
- Navigation & Core:
  - Dashboard: `DashboardSquare01Icon`
  - Medicines: `Medicine01Icon` / `PillIcon`
  - Vitals: `Activity01Icon`
  - Appointments: `Calendar03Icon`
  - Prescriptions / Documents: `File02Icon`
  - AI Assistant: `AiChat02Icon` / `SparklesIcon`
  - Nearby Care / Maps: `Location01Icon`
  - Profile / User: `UserIcon` / `UserGroupIcon`
- Actions & Statuses:
  - Add / Plus: `PlusSignIcon`
  - Check / Completed: `CheckmarkCircle02Icon` / `Tick02Icon`
  - Time / Clock: `Clock01Icon`
  - Arrow / Navigation: `ArrowRight01Icon`, `ArrowLeft01Icon`
  - Audio / Mic: `Mic01Icon`, `VolumeHighIcon`
  - Emergency / Alert: `AlertCircleIcon`, `Call02Icon`

---

## 5. Screen Refactoring Details

### 5.1 Layout & Shell (`src/components/Layout.tsx`)
- Header: Slim `h-14` header bar with patient switcher, language selection, notifications, and profile menu.
- Sidebar (Desktop): Minimalist 64px collapsed / 240px expanded navigation with smooth hover states.
- Mobile Nav: Sleek bottom bar with icons and clear labels, properly padded for mobile safe areas.
- Emergency SOS button: Compact, clear pill button in header/mobile bar rather than screen-blocking banner.

### 5.2 Dashboard (`src/pages/Home.tsx`)
- Sizing cleanup:
  - Remove 200px oversized SVG ring; replace with a clean, modern card combining adherence percentage, remaining doses, and a slim progress bar.
  - Replace huge stat cards with a clean responsive grid (`grid-cols-2 lg:grid-cols-4`).
  - Next dose banner: Compact card with time badge and medicine details.
  - Slots: Clean 4-column dose schedule with one-click checkmarks.

### 5.3 Medicines (`src/pages/Medicines.tsx`)
- Clean grid of medicine cards with dosage badges, frequency chips, and quick action buttons.
- Dialog for adding new medication styled with shadcn inputs and timing chips.

### 5.4 Vitals (`src/pages/Vitals.tsx`)
- Multi-metric dashboard (Heart Rate, SpO2, Respiration, HRV) in a 2x2 or 4-metric grid.
- Live camera scanner with clean viewport overlay (no oversized control buttons).
- Waveform preview in a sleek card.

### 5.5 Appointments (`src/pages/Appointments.tsx`)
- Clean timeline / calendar list using shadcn `Card` and `Badge` components.
- Booking modal with standard input sizing and doctor specializations.

### 5.6 Documents & Prescriptions (`src/pages/Documents.tsx`)
- Clean document upload dropzone and prescription card grid.
- Modal preview with PDF/OCR details cleanly formatted.

### 5.7 Assistant & Profile (`src/pages/Assistant.tsx`, `src/pages/Profile.tsx`)
- Chat interface: Crisp bubbles, sticky bottom input bar with mic toggle and instant suggestions.
- Profile: Tabular settings and clean form fields for personal & emergency contact details.

---

## 6. Implementation Stages
1. **Foundation & Dependencies**: Install `hugeicons-react`, `geist`, `clsx`, `tailwind-merge`, `class-variance-authority`, `@radix-ui/react-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-slot`, etc.
2. **Design System & Primitives**: Setup `src/lib/utils.ts` (`cn`), `src/components/ui/`, update `src/index.css` & `tailwind.config.js`.
3. **Shell & Navigation**: Refactor `src/components/Layout.tsx` with Hugeicons and Geist.
4. **Core Dashboard & Pages**: Refactor `Home.tsx`, `Medicines.tsx`, `Vitals.tsx`, `Appointments.tsx`, `Documents.tsx`, `Assistant.tsx`, `Profile.tsx`.
5. **Verification & Cleanup**: Test responsive resizing across mobile/tablet/desktop, verify build, verify zero emojis and no oversized elements.
