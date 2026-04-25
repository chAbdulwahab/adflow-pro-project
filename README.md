# AdFlow Pro — Pakistan's Premium Sponsored Listings Marketplace

**[🌐 Live Demo](https://adflow-pro-project.vercel.app/)**

[![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Recharts](https://img.shields.io/badge/Recharts-22b5bf?style=for-the-badge&logo=data:image/svg+xml;base64,)](https://recharts.org/)

> **Advertise Smarter. Reach Further.**
> A full-stack, production-grade marketplace platform built with Next.js 15 App Router, Supabase PostgreSQL, JWT authentication, real-time chat, AI-powered content generation, and a complete multi-role admin ecosystem.

---

<div align="center">
  <img width="1600" height="733" alt="AdFlow Pro — Homepage" src="https://github.com/user-attachments/assets/3176fef2-32e9-4233-962c-48ad220f3e72" />
</div>

---

## 🔐 Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| 🚀 **Super Admin** | `admin@gmail.com` | `123456` |
| 🛡️ **Moderator** | `moderator@gmail.com` | `123456` |
| 👤 **Client** | `user@gmail.com` | `123456` |

---

## ✨ Feature Overview

### 🏪 Marketplace
- **Public Browse** — Explore all live listings with filters for category, city, price range, featured status, and sort order
- **Ad Detail Pages** — Rich media viewer (images + YouTube embeds), thumbnail strip, seller card, WhatsApp direct chat, related listings
- **Smart Search** — Full-text search with URL-persistent query params

### 📋 Ad Lifecycle (State Machine)
Ads move through a strict, enforced state machine:
```
draft → submitted → under_review → payment_pending → payment_submitted → published → expired
                 ↘ rejected ↗
```
- Clients create ads as **drafts**, submit them for moderation
- Moderators **approve or reject** with notes
- Approved ads enter a **payment flow** (receipt upload)
- Admins **verify payments** and trigger publication
- **Cron jobs** auto-publish scheduled ads and auto-expire old ones

### 👁️ Seller Analytics Dashboard
- **View tracking** — Every ad visit is recorded (deduplicated per hour per IP, privacy-safe hashed)
- **KPI cards** — Total ads, live ads, total views, period views, expiring-soon alerts
- **4 live charts** (Recharts): daily views timeline, top ads by views, views by day of week, ad status breakdown
- **Per-ad breakdown table** — Views, period delta, status, expiry warnings, quick actions

### 💬 Real-Time Chat
- **Buyer ↔ Seller messaging** per ad listing
- Conversation inbox with **unread badges** (polled every 5s)
- Chat initiated directly from the ad detail page ("Chat with Seller")
- Mobile: full-screen panel navigation (list view ↔ chat view)

### 🤖 AI Assistant
- **Gemini-powered** floating chat assistant embedded site-wide
- **AI ad copy generator** — Generates title + description from a short prompt
- Context-aware responses about the marketplace

### 🛡️ Multi-Role Access Control

| Feature | Client | Moderator | Admin |
|---|:---:|:---:|:---:|
| Post & manage own ads | ✅ | — | ✅ |
| Review queue (approve/reject) | — | ✅ | ✅ |
| Verify payments | — | — | ✅ |
| Delete any ad | — | — | ✅ |
| Admin analytics dashboard | — | — | ✅ |
| Manage users | — | — | ✅ |

### 📊 Admin Analytics Dashboard
- Platform-wide KPIs: live ads, pending review, pending payments, total revenue, total clients, ads this week
- **5 charts**: revenue over time, new ads over time, ad status distribution, top categories, top cities
- Configurable time period: 7 / 30 / 90 days

### 🎨 UI/UX
- **Dark & Light theme** — System-level toggle, persisted in `localStorage`, no flash-of-unstyled-content
- **Glassmorphism design** — Backdrop blur, gradient accents, micro-animations
- **Fully responsive** — Every page, chart, table, and panel adapts to mobile/tablet/desktop
- **Premium Recharts** — Dark-styled tooltips, multi-color palettes, animated transitions

### 🔒 Security & Auth
- **JWT authentication** — 7-day tokens, `bcryptjs` password hashing
- **Role-based guards** on every API route (`requireAuth`, `requireRole`)
- **Audit logs** — Every status transition and admin action is recorded
- **WhatsApp & call gating** — Contact info blurred/blocked for unauthenticated visitors

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router, Server Components) |
| **Language** | TypeScript |
| **Database** | PostgreSQL via Supabase |
| **Auth** | JWT + bcryptjs |
| **Styling** | Vanilla CSS (custom design system with CSS variables) |
| **Charts** | Recharts |
| **AI** | Google Generative AI (Gemini) |
| **Validation** | Zod |
| **Media** | Cloudinary + YouTube embed normalisation |
| **Deployment** | Vercel (with cron job support) |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project (free tier works)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/chAbdulwahab/adflow-pro.git
cd adflow-pro

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.local.example .env.local
# Fill in SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, GEMINI_API_KEY

# 4. Run migrations in your Supabase SQL editor
#    → schema.sql        (core tables)
#    → scratch/ad_views_migration.sql  (view tracking)

# 5. Seed demo data (optional)
#    → seed-demo.sql

# 6. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
adflow-pro/
├── src/
│   ├── app/
│   │   ├── (public pages)    # /, /explore, /ads/[id], /packages, /faq …
│   │   ├── dashboard/        # Client dashboard, analytics, chat, profile
│   │   ├── admin/            # Admin ads, users, payments, analytics
│   │   ├── moderator/        # Review queue
│   │   └── api/              # All API routes (auth, ads, chat, AI, cron …)
│   ├── components/           # Navbar, Footer, AiAssistant
│   ├── context/              # ThemeContext (light/dark)
│   ├── lib/                  # Supabase client, auth helpers, validators,
│   │                         #   status-machine, slug, media, rank
│   ├── constants/            # Roles, FAQ content
│   └── types/                # Shared TypeScript types
├── scratch/                  # SQL migrations and dev utilities
├── schema.sql                # Core database schema
└── seed-demo.sql             # Marketplace demo data
```

---

## 🗺️ Roadmap

- [ ] **Saved Ads / Favourites** — Bookmark listings with a heart toggle
- [ ] **Transactional Emails** — Approval, rejection, and receipt emails via Resend
- [ ] **Advanced Search Filters** — Price range slider, date filters, has-media toggle
- [ ] **Seller Ratings & Reviews** — Star ratings flowing through moderation
- [ ] **Web Push Notifications** — Instant browser push for status changes
- [ ] **Ad Renewal** — One-click renew for expiring ads
- [ ] **Subscription Billing** — Recurring Starter/Pro/Business plans via Stripe

---

## 📄 License

Developed with ❤️ for the Pakistani marketplace by **chAbdulwahab**.

<div align="center">
  <b>© 2026 AdFlow Pro. All rights reserved.</b>
</div>
