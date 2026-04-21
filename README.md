# 🚀 AdFlow Pro — Pakistan's #1 Sponsored Listings Platform

**[🌐 View Live Site](https://adflow-pro-project.vercel.app/)**

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

> **Advertise Smarter, Reach Further.** 
> Post, manage, and grow your listings with AdFlow Pro's powerful moderation pipeline, verified payments, and intelligent ranking system.

---

## ✨ Key Features

- 🛠️ **Full Ad Lifecycle Management** — Create, edit, and track ads from draft to publication.
- 🛡️ **Moderation Pipeline** — Rigorous review process for all submissions ensuring quality and safety.
- 💳 **Verified Payments** — Manual payment submission and verification workflow for premium/featured slots.
- 🤖 **AI-Powered Analytics** — Intelligent ranking scores based on freshness, package weight, and user verification.
- 📊 **Insightful Dashboards** — Distinct experiences for Clients, Moderators, and Admins.
- 📱 **Fully Responsive** — Seamless experience across desktop, tablet, and mobile devices.
- 🔍 **Advanced Search** — High-performance filtering by categories, cities, pricing, and features.

---

## 📸 Screenshots Space

<!-- These are placeholders for project screenshots to showcase the UI/UX -->

<div align="center">
  <img width="800" height="800" alt="image" src="https://github.com/user-attachments/assets/3176fef2-32e9-4233-962c-48ad220f3e72" />
  <br />
  <img src="https://via.placeholder.com/800x450/1e1b4b/cbd5e1?text=Marketplace+Explore+View" alt="Explore View" width="800" />
  <br />
  <img src="https://via.placeholder.com/800x450/1e1b4b/cbd5e1?text=Admin+Moderation+Queue" alt="Admin Panel" width="800" />
</div>

---

## 🔐 Demo Credentials

Use the following credentials to explore the different roles within the platform.  
**Note:** All demo accounts use the standard password requested by the developer.

| Role | Email | Password |
| :--- | :--- | :--- |
| **🚀 Super Admin** | `admin@gmail.com` | `123456` |
| **🛡️ Moderator** | `moderator@gmail.com` | `123456` |
| **👤 Client/User** | `user@gmail.com` | `123456` |

---

## 🛠️ Technology Stack

- **Frontend:** Next.js 16/19 (App Router), React 19, Tailwind CSS 4
- **Backend:** Next.js API Routes (Serverless)
- **Database:** PostgreSQL (via Supabase)
- **Authentication:** JWT (JSON Web Tokens) with `bcryptjs` hashing
- **State Management:** React Hooks (useState/useEffect)
- **Validation:** Zod Schema Validation
- **Charts:** Recharts for Business Intelligence
- **AI Integration:** Google Generative AI (@google/generative-ai)
- **Icons:** Lucide React

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database (or a Supabase project)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/adflow-pro.git
   cd adflow-pro
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` file in the root directory and add the following:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_google_ai_key
   ```

4. **Database Schema:**
   Run the provided `schema.sql` in your database manager to initialize tables and indexes.

5. **Seed Demo Data:**
   Run the `seed-demo.sql` script to populate the marketplace with initial ads and categories.

6. **Run the Development Server:**
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 📂 Project Structure

```bash
adflow-pro/
├── public/           # Static assets (SVG logos, images)
├── scripts/          # Database seeding and utility scripts
├── src/
│   ├── app/          # Next.js App Router (Pages & API Routes)
│   ├── components/   # Reusable UI components
│   └── lib/          # Database clients, auth helpers, and shared logic
├── .env.local        # Environment variables (secret)
├── schema.sql        # Core database schema
└── seed-demo.sql     # Marketplace demo data
```

---

## 📄 License & Contact

Developed with ❤️ for the Pakistani Marketplace.  
For support or inquiries, please contact the repository owner.

---

<div align="center">
  <b>© 2026 AdFlow Pro. All rights reserved.</b>
</div>
