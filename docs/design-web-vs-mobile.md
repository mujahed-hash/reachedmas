# Web App vs Mobile App — Design Differences

This document describes how the **ReachMasked** web experience (Next.js / React) differs from the **mobile app** (Expo / React Native) in terms of design system, styling approach, and UX patterns.

---

## 1. Technology & styling model

| Aspect | Web (`src/`) | Mobile (`mobile/`) |
|--------|----------------|---------------------|
| **Framework** | Next.js 16 (App Router), React Server Components where applicable | Expo, React Native |
| **Styling** | **Tailwind CSS v4** + `@theme` in `globals.css`, utility classes on elements | **`StyleSheet.create()`** + theme tokens from `theme.ts` |
| **Component library** | **shadcn/ui** (Radix primitives, “new-york” style) — `components/ui/*` | **Primitive RN** — `View`, `Text`, `TextInput`, `TouchableOpacity`, `ScrollView`, etc. |
| **Icons** | `lucide-react` | `lucide-react-native` |
| **Global layout** | HTML document, full-width sections, `container`, responsive breakpoints | **Safe areas**, `KeyboardAvoidingView`, tab navigator, stack screens |

The web app is **CSS-first** (classes + design tokens in CSS variables). The mobile app is **JavaScript theme objects** passed into styles — no shared Tailwind bundle on native.

---

## 2. Design tokens & theming

### Web

- Tokens live in **`src/app/globals.css`** under `:root` (light) and `.dark` (dark).
- Semantic names: `--background`, `--foreground`, `--primary`, `--muted`, `--card`, `--radius`, etc.
- **Tailwind** maps these via `@theme inline` so components use `bg-background`, `text-primary`, `rounded-xl`, etc.
- Theme switching is typically **class-based** (`dark` on `<html>`) or equivalent.

### Mobile

- Tokens are defined in **`mobile/src/theme.ts`** as `lightTheme` / `darkTheme` objects (`background`, `text`, `primary`, `border`, …).
- **`ThemeProvider`** (`mobile/src/ThemeProvider.tsx`) resolves **system / light / dark** (persisted with AsyncStorage) and exposes `theme` + `isDark` via `useAppTheme()`.
- Screens call `createStyles(theme, isDark)` or inline `theme.primary` — **one source of truth per platform**, aligned to web colors where noted (e.g. primary `#2113FF`).

**Intent:** Brand colors align; **implementation** is different (CSS variables vs TS objects).

---

## 3. Visual language

### Web

- **Marketing & dashboard:** Large hero sections, blurred gradient orbs, full **container** width, typography scale from the font stack (e.g. Inter).
- **Density:** Suited to **mouse + keyboard** — smaller tap targets acceptable, hover states, links in paragraphs.
- **Components:** Cards with `Card`, `Button` variants, dropdowns, data tables — **desktop-first** layouts with responsive breakpoints.

### Mobile

- **Screen-based:** One primary focus per screen; **scroll** and **bottom tabs** as main navigation.
- **Touch:** Larger hit areas, `TouchableOpacity`, **tab bar** height and padding tuned for thumbs (`screenOptions` in `App.tsx`).
- **Density:** Fewer columns; lists and stacked layouts; **no hover** — feedback via opacity / navigation transitions.

---

## 4. Navigation & information architecture

| Web | Mobile |
|-----|--------|
| URL routes (`/`, `/dashboard`, `/settings`, …) | **Stack** + **Tab** navigators (Dashboard, Family, Notifications, Settings) |
| Header + footer, inline links | **Native header** + **tab icons** (`LayoutDashboard`, `Users`, `Bell`, `Settings`) |
| SEO-oriented landing, long-form content | Short titles; **badge** for unread notifications on tab icon |

---

## 5. Forms & inputs

- **Web:** `<input>`, shadcn form patterns, server actions, browser validation UI.
- **Mobile:** `TextInput`, `keyboardType`, `secureTextEntry`, `KeyboardAvoidingView`, `ScrollView` — tuned for **on-screen keyboard** and **safe area insets**.

---

## 6. Dark / light mode

- **Web:** Centralized in CSS (`:root` / `.dark`); components use semantic Tailwind classes.
- **Mobile:** Explicit `lightTheme` / `darkTheme` objects; **system** preference + user override; styles must **read** `theme` at runtime (no automatic class flip like `dark:` in Tailwind).

---

## 7. What stays aligned (brand)

- **Primary indigo** (`#2113FF`) and related neutrals are intended to match between web (`globals.css`) and mobile (`theme.ts`).
- **Logo / wordmark:** The full **Signal Tag** mark (shield + goggles + QR + padlock + **NFC** waves from `public/nfc.svg`) is implemented on web as **`SignalTagLogo`** (`src/components/signal-tag-logo.tsx`). NFC uses a **darker stroke gradient** (`sig-nfc-stroke-*`), **no blur filter** (Gaussian glow looked soft/bloomed when zoomed), **`translate(0,2)`** to reduce top padding, and placement **`translate(22,6) → translate(91,46.6) scale(2.120875)`** (NFC waves scaled **0.95²** vs 2.35; inner y **46.6**; inner x **91**, −2.5% viewBox width vs 94). (~4% clearance from shield). **Favicon / app icon:** `src/app/icon.svg`.
- **Mobile:** **`mobile/src/components/SignalLogo.tsx`** — React Native SVG aligned to the same design; assets under `mobile/assets` as needed for native builds.

---

## 8. What differs by platform (summary)

| Topic | Web | Mobile |
|-------|-----|--------|
| Styling entry | `globals.css` + Tailwind | `theme.ts` + `StyleSheet` |
| UI primitives | shadcn/Radix | React Native core + custom components |
| Layout | Flow, grid, wide screens | Safe area, tabs, stacks |
| Theme API | CSS variables + `dark` class | `useAppTheme()` + AsyncStorage |
| Interaction | Hover, focus rings, links | Tap, swipe, keyboard |

---

## 9a. Dark theme accent (mobile only)

In **Settings → Appearance**, below **System / Light / Dark**, **Dark theme color** lets users pick:

- **Sky** — default fresh sky / cyan blues (`darkThemeSky` in `mobile/src/theme.ts`).
- **Deep blue** — deeper **true blue** (blue-700 family), **not** the light-mode brand purple (`#2113FF`). Stored as `dark_accent` in AsyncStorage (`sky` | `deepBlue`).

Light mode is unchanged and always uses web brand **`#2113FF`**.

---

## 9. For designers & developers

- **Do not assume** Tailwind classes or shadcn markup work on mobile — **reimplement** with RN primitives and theme tokens.
- When updating **brand colors**, update **both** `globals.css` (and Tailwind theme if needed) **and** `mobile/src/theme.ts`.
- For **new screens**, follow mobile patterns: `SafeAreaView`, theme-driven `createStyles`, test in **light and dark** on a device or simulator.

---

## 10. Dashboard (mobile ↔ web parity)

The **Home / Dashboard** tab (`mobile/src/screens/DashboardScreen.tsx`) is aligned to the web dashboard (`src/app/dashboard/page.tsx`) for structure and visual language:

| Area | What was redesigned / matched |
|------|------------------------------|
| **Top bar** | Same row as web: **“My Tags” + count pill**, **Family** (ghost-style) + **Add** primary — mirrors web title row + `AddAssetDialog` entry. |
| **Subtitle** | **“Manage your assets and tags”** above the stat grid (same copy and hierarchy). |
| **Stat cards** | **Horizontal StatCard layout**: uppercase label, large numeric value, **icon in rounded box on the right**; **2-column row** for Total Assets / Total Scans, **full-width highlighted** row for **Active Tags** (uses **Tag** icon like web, not Shield). |
| **Stats semantics** | **Active Tags** = count of assets that have **at least one tag** (same as web). API: `GET /api/mobile/dashboard` returns `stats.activeTags` accordingly. |
| **Empty state** | **Rounded card** (`~2rem`), **Package** in circular **primary-tint** background, title **“No tags active”**, body copy from web, **Add** CTA. |
| **Asset cards** | **Large radius (~2rem)**, padding like web `AssetCard`; **green “Active”** pill; **QR row** with bordered icon tile + **Tag Code**; footer **View History** + **Preview** + **Options →** (web-style labels). |
| **Messages & Alerts** | **Always shown** (not only when notifications exist); **card shell** with empty state: **MessageCircle**, **“No messages yet”**, helper text from web. |
| **Scan History** | **New on mobile** to match web: second card under a **“Scan History”** heading; rows with **vertical bar**, action label, asset name, date/time; **“No activity yet”** when empty. Data from `recentActivity` on `GET /api/mobile/dashboard`. |

---

*Last updated to reflect the ReachMasked monorepo layout (`/` = Next.js app, `/mobile` = Expo app).*
