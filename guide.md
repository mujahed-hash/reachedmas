# SmartSafe – End‑to‑End Project Guide

**Purpose:** This document is a clear, professional, step‑by‑step guide to design, build, and launch **SmartSafe**, a privacy‑first vehicle contact platform for the ** first US market**.

SmartSafe enables people to contact a vehicle owner (parking issues, emergencies, safety alerts) **without exposing phone numbers**, using **QR + NFC tags**, while avoiding exaggerated claims and **designing safely around existing patents**.

---

## 1. Product Vision

### What SmartSafe Is

A **privacy‑first vehicle communication platform** that lets third parties contact a vehicle owner via **masked calls/messages**, initiated by scanning a QR code or tapping an NFC tag.

### What SmartSafe Is NOT

* Not a GPS tracker
* Not continuous location tracking
* Not surveillance tech

This clarity is important for **legal safety, trust, and patent avoidance**.

---

## 2. Target Market (Phase 1)

* United States (primary)
* Urban drivers, apartment residents, HOAs
* Fleet & property management (Phase 2 B2B)

---

## 3. Core Features (MVP – Must Have)

### 3.1 QR + NFC Vehicle Tag

* Physical sticker or plate
* NFC chip stores **only a URL**
* QR code mirrors the same URL

Example:

```
https://smartsafe.app/t/{tagId}
```

No personal data stored on the tag itself.

---

### 3.1.1 NFC Implementation Guide

#### Purpose
Use NFC tags to enable one-tap access to the SmartSafe vehicle contact page. The NFC tag does not store personal information and is fully patent-safe.

#### NFC Hardware
| Specification | Recommendation |
|--------------|----------------|
| **Type** | NTAG213 or NTAG215 |
| **Reason** | Low cost, standard, widely supported, passive |
| **Form factor** | Sticker, keyfob, or small plate |
| **Durability** | Weatherproof for outdoor vehicle placement |

#### Data Stored on NFC
Only a URL pointing to the SmartSafe server:
```
https://smartsafe.app/t/{shortCode}
```
* No phone numbers
* No logic
* No encrypted keys stored on the chip

#### How It Works
1. Vehicle owner registers the tag in SmartSafe app/web dashboard → assigns tag ID
2. Tag is placed on vehicle
3. Any smartphone with NFC enabled taps the tag
4. Phone automatically opens the URL → shows the public scan page (contact options)
5. All communication (call/message) is relayed through SmartSafe servers to protect privacy

**Notes:**
* QR code mirrors the same URL → ensures universal accessibility
* NFC interaction is passive, requires only the smartphone → no extra app needed

#### Security & Privacy
* **No data stored on tag** - Only a URL
* **Communication initiated only after tap/scan** - No background tracking
* **All calls/messages are masked** - Phone numbers are never exposed
* **US privacy compliant** - No tracking, no surveillance

#### Patent & Legal Safety
* NFC is used only to deliver a URL
* No encrypted payload, no telecom logic on-chip
* Behavior identical to QR scanning → avoids patent conflicts

---

### 3.2 Public Scan Page (No App Required)

When someone scans/taps:

* Confirmation: “This vehicle is registered with SmartSafe”
* One‑tap actions:

  * 🚗 Blocking driveway
  * ⏰ Parking issue / meter expiring
  * 💡 Lights left on
  * 🚨 Emergency

No free‑text by default → reduces abuse.

---

### 3.3 Masked Communication (Privacy Core)

#### Masked Calls

* Caller → temporary virtual number → owner
* Neither party sees the other’s real number

#### Masked Messaging

* Web form → backend → SMS / push / WhatsApp relay

**Providers:**

* Twilio (recommended for US)
* Plivo (backup option)

---

### 3.4 Owner Dashboard (Web)

* Register & activate tags
* Add vehicles
* Enable/disable contact
* Notification preferences
* View interaction history (time + city only)

---

### 3.5 Abuse Prevention (Critical for US)

* Rate limiting per tag
* CAPTCHA after repeated scans
* Auto‑block repeat abusers
* Emergency actions bypass CAPTCHA

---

## 4. Additional High‑Value Features (Strong Differentiators)

### 4.1 Emergency Escalation Mode

* Multiple call attempts
* SMS + push notification
* Optional emergency contact

---

### 4.2 Smart Auto‑Replies

Predefined replies such as:

* “I’ll move the vehicle in 5 minutes.”
* “Thanks, issue resolved.”

No direct conversation required.

---

### 4.3 Scan Transparency (Honest Tracking)

* Show scan timestamp + city
* No fake GPS or real‑time tracking claims
* Optional scan heatmap for owner only

---

### 4.4 Tow‑Prevention Mode (US‑Focused)

* Tow operator scans tag
* Owner receives timestamped alert
* Log proves attempt to notify

Strong legal & consumer value.

---

### 4.5 HOA / Apartment Mode (Phase 2)

* Admin dashboard
* Resident vehicle registry
* Visitor temporary tags

---

## 5. Technology Stack (Recommended)

### 5.1 Frontend – Web

* **Next.js (App Router)**
* **TypeScript**
* **Tailwind CSS**
* **shadcn/ui** (mandatory)
* Framer Motion (subtle animations)

**Design goals:**

* Minimal
* Professional
* High contrast
* Accessibility (WCAG)

---

### 5.2 Mobile Apps (iOS + Android)

**Option A (Recommended):**

* **React Native (Expo)**
* Shared logic with web

**Option B (Later):**

* Swift (iOS)
* Kotlin (Android)

MVP can be **web‑only**.

---

### 5.3 Backend

* **Node.js + NestJS**
* PostgreSQL (primary DB)
* Redis (rate limits & sessions)

---

### 5.4 Infrastructure

* AWS (US regions only)

  * ECS or Lambda
  * RDS
  * S3
  * CloudFront
* Secrets Manager

---

### 5.5 Telecom & Notifications

* Twilio: Calls + SMS
* Firebase Cloud Messaging (push)
* WhatsApp Business API (optional)

---

## 6. UI / UX Guidelines (Very Important)

### Visual Style

* Calm, safety‑oriented
* No flashy marketing language
* Neutral colors (Slate / Blue / Emerald)

### Components

* shadcn/ui cards, dialogs, alerts
* Clear action hierarchy
* One‑tap actions

### Branding

* App Name: **SmartSafe**
* Tagline: *“Contact without compromise.”*

---

## 7. Data Privacy & Security

* Encrypt phone numbers at rest
* TLS everywhere
* Short data retention (e.g., 30–60 days logs)
* No selling data
* No ads

US‑friendly privacy posture.

---

## 8. Patent Safety & Design‑Around Strategy

> ⚠️ Not legal advice – but strong engineering precautions.

### Key Principles

* No claims of GPS tracking
* No claims of continuous monitoring
* NFC stores **only a URL**
* Communication is user‑initiated
* Platform acts as a relay, not a telecom provider

### Language Matters

Avoid:

* “Tracking system”
* “Vehicle surveillance”

Use:

* “Contact platform”
* “User‑initiated communication”

### Architecture Safety

* Generic QR/NFC usage
* Standard call masking via third‑party APIs
* No proprietary telecom algorithms

This minimizes patent risk.

---

## 9. Monetization (Clean & Honest)

* One‑time tag purchase ($15–25)
* Optional premium:

  * Emergency escalation
  * Multiple vehicles
  * HOA dashboard

No forced subscriptions.

---

## 10. Delivery Plan (Agency Timeline)

| Phase                     | Duration |
| ------------------------- | -------- |
| UX + Design               | 2 weeks  |
| Backend APIs              | 2 weeks  |
| Web App                   | 2 weeks  |
| Telecom integration       | 1 week   |
| Security & abuse controls | 1 week   |
| QA & Launch               | 1 week   |

**Total:** ~8–9 weeks

---
## 11. Definition of Done (For Antigravity)

* Fully functional QR + NFC flow
* Masked calls/messages working in US
* Abuse prevention implemented
* Professional UI using shadcn/ui
* Privacy policy & ToS drafted
* No misleading claims in UI or marketing

---

## 12. Final Note

SmartSafe wins not by hype, but by:

* Trust
* Privacy
* Honest design
* US‑specific problems solved properly

This document is intentionally **agency‑ready**.

---

**Owner:** Mohammed Mujahed Ahmed
**Product:** SmartSafe

---

## 13. Technical Appendix (Developer Spec)

This section details the technical implementation requirements to ensure the project is "Agency-Ready" for immediate execution.

### 13.1 Database Schema (PostgreSQL)

The database should use a relational model to ensure data integrity.

**1. Users (`users`)**
*   `id`: UUID (Internal Primary Key) - **NEVER EXPOSED**
*   `public_id`: String (NanoID/CUID - e.g., `usr_8x92...`) - Used in APIs/URLs
*   `email`: String (Unique, Indexed)
*   `password_hash`: String (Argon2/Bcrypt)
*   `phone_encrypted`: String (AES-256 encrypted at rest)
*   `created_at`: Timestamp
*   `role`: Enum ('owner', 'admin')

**2. Vehicles (`vehicles`)**
*   `id`: UUID (Internal Primary Key) - **NEVER EXPOSED**
*   `public_id`: String (NanoID/CUID - e.g., `veh_92ks...`) - Used in APIs/URLs
*   `owner_id`: UUID (Foreign Key -> users.id)
*   `license_plate_hash`: String (Hashed for search/indexing without storing raw text optionally)
*   `model`: String
*   `color`: String
*   `is_active`: Boolean

**3. Tags (`tags`)**
*   `id`: UUID (Internal Primary Key) - **NEVER EXPOSED**
*   `public_id`: String (NanoID/CUID - e.g., `tag_73js...`) - Used in APIs/URLs
*   `vehicle_id`: UUID (Foreign Key -> vehicles.id)
*   `short_code`: String (Unique, 6-8 chars, e.g., `ABC1234`) - Used in QR URLs
*   `nfc_payload`: String (The full URL written to the NFC chip)
*   `status`: Enum ('active', 'disabled', 'flagged')

**4. Interactions (`interactions`)**
*   `id`: UUID (Primary Key)
*   `tag_id`: UUID (Foreign Key -> tags.id)
*   `action_type`: Enum ('scan_view', 'contact_sms', 'contact_call')
*   `timestamp`: Timestamp
*   `ip_hash`: String (For abuse rate limiting, salt + hash)
*   `user_agent`: String (Analytics)

### 13.2 API Contract (Core Endpoints)

**Public Endpoints (No Auth Required)**
*   `GET /t/:shortCode`
    *   **Purpose**: Resolve a QR scan.
    *   **Response**: Returns vehicle alias (e.g., "Red Toyota"), allowed actions, and public safety warnings. **NEVER** returns owner phone/PII.
*   `POST /api/v1/contact/:shortCode`
    *   **Body**: `{ "action": "blocking_driveway", "method": "sms" }`
    *   **Purpose**: Initiates the masked communication flow.
    *   **Response**: `{ "status": "sent", "messageId": "..." }`

**Owner Endpoints (Authenticated)**
*   `GET /api/v1/vehicles`
    *   **Purpose**: List my registered vehicles and their tags.
*   `POST /api/v1/vehicles`
    *   **Body**: `{ "plate": "...", "model": "..." }`
    *   **Purpose**: Register a new vehicle.
*   `PATCH /api/v1/tags/:tagId/status`
    *   **Body**: `{ "status": "disabled" }`
    *   **Purpose**: Temporarily turn off a tag (e.g., while on vacation).

**Webhooks**
*   `POST /api/webhooks/twilio`
    *   **Purpose**: Handle call status changes (completed, busy) and SMS replies.

### 13.3 Security Best Practices (Crucial)

*   **ID Exposure**: NEVER expose database primary keys (`id`) in URLs or API responses. Always use `public_id` or `short_code`.
*   **Enumeration Prevention**: Custom IDs should be non-sequential (random strings like NanoID or CUID).

### 13.4 Environment Variables

The application requires the following configuration. Create a `.env.local` or `.env` file.

```bash
# Core
PORT=3000
NODE_ENV=development
DATABASE_URL="postgresql://user:password@localhost:5432/smartsafe"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# Authentication
JWT_SECRET="super-secret-key-change-in-prod"
JWT_EXPIRATION="7d"

# Twilio (Communications)
TWILIO_ACCOUNT_SID="AC..."
TWILIO_AUTH_TOKEN="..."
TWILIO_PHONE_NUMBER="+15550000000"

# Security & Limits
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
RATE_LIMIT_MAX_REQUESTS=10  # Max scans per IP per window
```

### 13.4 Local Development

1.  **Prerequisites**: Node.js v18+, Docker (for Postgres/Redis).
2.  **Setup**:
    ```bash
    npm install
    docker-compose up -d # Starts DB
    npx prisma migrate dev # Apply schema
    npm run dev
    ```
