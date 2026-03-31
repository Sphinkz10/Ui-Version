# PerformTrack / V-Login2

This is the core repository for **PerformTrack / V-Login2**. The original design is available at [Figma](https://www.figma.com/design/BXldmHTk0QIcaVoRIKFuZ3/V-Login).

PerformTrack/V-Login2 is a comprehensive AI & Automation platform designed to manage and optimize athletic performance data. It provides seamless data integration, automated decision-making through rule engines, and a responsive frontend portal for athletes and staff.

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend/Auth:** Supabase, Hono
- **Mobile:** Capacitor
- **CI/CD:** GitHub Actions, Vercel

## Prerequisites

Before you begin, ensure you have met the following requirements:
- Node.js (v18 or higher recommended)
- npm, yarn, pnpm, or bun (npm recommended)
- Git

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *Note: If you encounter dependency conflicts, use the `--legacy-peer-deps` flag: `npm install --legacy-peer-deps`.*

3. **Environment Setup:**
   Copy the `.env.example` file to `.env` and fill in the required variables (e.g., Supabase credentials).
   ```bash
   cp .env.example .env
   ```
   You will need to set up variables like `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc., based on your Supabase project.

4. **Run the development server:**
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3000/`.

## Scripts

- `npm run dev`: Starts the development server.
- `npm run build`: Builds the app for production.
- `npm run type-check`: Validates TypeScript.
- `npm run preview`: Locally preview the production build.
