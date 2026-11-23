# NAADANSMASH — Kochi Badminton Community Platform

> **COME PLAY. CONNECT. REPEAT.**  
> Kochi, Kerala, India • [@naadansmash.co](https://instagram.com/naadansmash.co) • [+91 83048 83872](https://wa.me/918304883872)

NAADANSMASH is a production-ready, full-stack web application designed for Kochi's grassroots badminton collective. Built with React 18, TypeScript, Tailwind CSS, Vite, and Supabase / PostgreSQL.

---

## 🏸 Overview & Core Features

### 1. Participant Experience
- **Interactive Registration Flow:** Atomic court booking with real-time slot decrementing, skill level selection, and deduplication.
- **Dynamic Payment Instructions:** UPI QR code generation, instant clipboard copy for Organiser UPI ID (`naadansmash@upi`), and mobile tap-to-pay deep-link.
- **4 Distinct Communication & Notification States:**
  - **Registration Received:** Confirms roster hold, displays unique registration number (`NS-YYMM-XXXXXX`), and prompts UPI payment.
  - **Payment Submitted:** Displays under-review note and submitted 12-digit UTR reference.
  - **Payment Verified:** `"YOU'RE IN!"` digital court pass with match timings and game-day essentials checklist (Racket, sports shoes, water bottle, dry-fit sportswear).
  - **Payment Rejected:** Prominently displays the administrator's rejection reason, direct WhatsApp appeal button, and an inline form to re-submit corrected payment references.
- **Secure Participant Ticket Lookup:** Strict 1-to-1 lookup requiring Registration Number + sanitized WhatsApp Phone Number. Enforces Row Level Security (RLS) to prevent unauthorized enumeration.
- **Direct WhatsApp Messaging:** Prefilled message deep-links for registration enquiries, payment verification, event info, and racket loaner requests to official organiser Sivaram (`+91 83048 83872`).

### 2. Organizer & Coach Portal
- **Court Check-in & Roster Management:** Real-time player list with search filtering, attendance toggling (`Present`, `Registered`, `Absent`), and metric counters.
- **3-Way Payment Controls:** Verify (`✓ Paid`), hold (`Pending`), or reject (`✗ Reject`) with preset reason dialogs.
- **Payment & Attendance Audit History:** Immutable chronological activity log for every participant.
- **CSV Roster Export:** One-click download of the complete court roster as RFC-4180 compliant CSV.
- **Session & Event Management:** Toggle between open registration and *"Next Game Coming Soon"* scheduling banners, edit court timings, update fees, or create new badminton sessions.
- **Communications Configuration:** In-app setup for Resend API keys, sender address, and organiser WhatsApp contact.

---

## 🛠 Technology Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling & Motion:** Tailwind CSS, PostCSS, Framer Motion, Lucide React
- **Database & Auth:** Supabase (PostgreSQL with Row Level Security & atomic RPC functions)
- **Transactional Email:** Resend API integration (Registration Received, Payment Verified, Payment Rejected)
- **Direct Messaging:** WhatsApp official universal deep-links (`wa.me`)

---

## 🚀 Installation & Local Development

### Prerequisites
- Node.js (v18.0.0 or higher)
- npm (v9.0.0 or higher)
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/your-username/naadansmash.git
cd naadansmash
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-publishable-key

# Optional Resend Email (can also be configured in Admin Portal UI)
VITE_RESEND_API_KEY=re_your_resend_api_key
VITE_RESEND_FROM_EMAIL=NAADANSMASH <onboarding@resend.dev>

# Official Organiser Contacts
VITE_WHATSAPP_NUMBER=918304883872
VITE_INSTAGRAM_HANDLE=naadansmash.co
VITE_CONTACT_EMAIL=sivaram@naadansmash.com
```

### 4. Run the Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### 5. Production Build & Verification
```bash
# Type check and build optimized bundle
npm run build

# Preview production build locally
npm run preview
```

---

## 🗄 Database & Supabase Setup

1. Create a new project in the [Supabase Dashboard](https://supabase.com/).
2. Open the **SQL Editor** in your Supabase project.
3. Copy and execute the contents of [`supabase/schema.sql`](supabase/schema.sql).
4. This sets up:
   - `events`, `registrations`, `profiles`, `payment_settings`, and `contact_inquiries` tables.
   - Row Level Security (RLS) policies protecting participant privacy.
   - The `register_for_event` atomic transaction function with row-locking (`FOR UPDATE`) to prevent overselling and duplicate bookings.
   - The `lookup_registration` secure lookup RPC.

---

## 🌐 Production Deployment

### Option A: Vercel (Recommended)
1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com/) and click **Add New Project**.
3. Import your `naadansmash` repository.
4. Framework Preset: **Vite**.
5. Add Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_WHATSAPP_NUMBER`
   - `VITE_INSTAGRAM_HANDLE`
   - `VITE_CONTACT_EMAIL`
6. Click **Deploy**.

### Option B: Netlify
1. Import repository on [Netlify](https://netlify.com/).
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Configure environment variables in **Site configuration $\rightarrow$ Environment variables**.
5. Click **Deploy Site**.

---

## 🔒 Security Principles

- **Zero Secrets Committed:** `.env` and `.env.*` files are strictly excluded via `.gitignore`.
- **Public Key Safety:** Only public anon keys are used in the client. Database `service_role` keys are never exposed.
- **Participant Privacy:** Public users cannot enumerate participant tables. Access is strictly scoped via Row Level Security and 1-to-1 credential verification.
- **Concurrency & Deduplication:** Row-level locking on database transactions guarantees that registrations never oversell court capacity.

---

## 📞 Community & Support

- **Lead Organiser:** Sivaram
- **WhatsApp Support:** [+91 83048 83872](https://wa.me/918304883872)
- **Instagram:** [@naadansmash.co](https://instagram.com/naadansmash.co)
- **Locations:** Kochi, Kerala (Fitness Soul Kakkanad, Cochin Sports Arena Edappally, Flymate Hub)
