# 🍷 L'Aura Bistro & Bar — Full Stack Reservation Web App

A high-end, responsive restaurant landing page and table reservation system built with **HTML5, CSS3, Modern Vanilla JavaScript**, and **Supabase (PostgreSQL Database & Authentication)**.

Designed for instant deployment to **Vercel**.

---

## 🚀 Features

- **Artisan Culinary Experience**: Hero section, trust pillars, interactive menu category filters (Mains, Starters, Desserts & Cellar), storytelling, and guest experiences.
- **Modern Table Reservation Engine**:
  - Date picker constrained so visitors cannot pick past dates.
  - Multi-guest selector, dining time slots, occasion selector, and special request notes.
  - Hidden honeypot field (`website_url`) to silently deflect spam bots.
  - Asynchronous submission into Supabase PostgreSQL database.
  - Elegant toast notification popups for real-time guest feedback.
- **Staff / Admin Portal (`/admin` or `admin.html`)**:
  - Protected by **Supabase Authentication** (Email & Password).
  - Staff Sign In & Sign Up interfaces.
  - Live metric counters (Total Reservations, Today's Service, Pending Review, Confirmed Tables).
  - Search reservations in real-time by guest name or phone number.
  - Status filters (All, Pending, Confirmed, Cancelled).
  - Instant status update actions and record removal.
- **Production Ready for Vercel**: Clean URL routing (`/` and `/admin`) configured via `vercel.json`.

---

## 🛠️ Step-by-Step Supabase Setup (Beginner Friendly)

Follow these simple steps to connect your free database & authentication backend:

### 1. Create your Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and click **"Start your project"** (Sign in with GitHub or your email).
2. Click **"New Project"**.
3. Choose an organization, give your project a name (e.g. `laura-bistro`), set a database password, and choose the closest region.
4. Click **"Create new project"** (it takes about 1-2 minutes to spin up).

### 2. Create the Database Table with 1 Click
1. In your Supabase dashboard, click on **"SQL Editor"** (the `>_` icon on the left menu).
2. Click **"New query"**.
3. Open the file [`supabase_setup.sql`](./supabase_setup.sql) in this repository, copy all the code, and paste it into the Supabase SQL editor.
4. Click **"Run"** (green button at bottom right).
5. That's it! Your `reservations` table and security policies are created.

### 3. Copy your API Keys
1. In your Supabase dashboard, click the **Settings (gear icon)** at the bottom of the left sidebar.
2. Select **"API"**.
3. You will see:
   - **Project URL** (e.g., `https://abcdefghijkl.supabase.co`)
   - **Project API Keys** -> find the `anon` / `public` key (e.g., `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`)

### 4. Connect Keys in Code
Open [`js/supabase.js`](./js/supabase.js) and replace the placeholder strings:
```javascript
const SUPABASE_CONFIG = {
  url: "https://YOUR_ACTUAL_PROJECT_URL.supabase.co",
  anonKey: "YOUR_ACTUAL_ANON_PUBLIC_KEY"
};
```

---

## 💻 Running & Testing Locally

Since this project uses modern ES Modules (`type="module"`), it should be served via any local web server (instead of opening raw `file://`):

### Option A: VS Code Live Server (Easiest)
1. Open this folder in VS Code.
2. Right-click `index.html` and choose **"Open with Live Server"**.

### Option B: Python (Built into Windows/Mac/Linux)
Open PowerShell or Terminal in this folder and run:
```bash
python -m http.server 3000
```
Then visit `http://localhost:3000` in your browser.

---

## ☁️ Deploying to Vercel (Step-by-Step)

### Method 1: Using GitHub & Vercel Dashboard (Recommended)
1. Create a new repository on [GitHub](https://github.com) and push this project folder to it:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - L'Aura Bistro with Supabase"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```
2. Log into [vercel.com](https://vercel.com).
3. Click **"Add New..."** -> **"Project"**.
4. Import your GitHub repository.
5. In the project settings, **Framework Preset** can remain `Other` (Static).
6. Click **"Deploy"**.
7. In under 30 seconds, your site is live with a free `.vercel.app` domain!

### Method 2: Using Vercel CLI
1. Install Vercel CLI (if you have Node.js):
   ```bash
   npm i -g vercel
   ```
2. Run in the project directory:
   ```bash
   vercel
   ```
3. Follow the terminal prompts to deploy immediately.

---

## 📂 Project Structure

```
├── index.html          # Public restaurant landing page & table reservation form
├── admin.html          # Staff/Manager console (Supabase Auth & bookings table)
├── supabase_setup.sql  # SQL schema, RLS policies, and sample data
├── vercel.json         # Vercel static routing configuration
├── css/
│   ├── style.css       # Luxury modern styling, responsive layouts & animations
│   └── admin.css       # Staff portal dashboard & auth card styling
└── js/
    ├── supabase.js     # Supabase client initialization & key configuration
    ├── app.js          # Booking validation, honeypot, toast alerts, menu filters
    └── admin.js        # Supabase Auth login/logout, live data fetch & status actions
```

---

## 🔒 Security Highlights

- **Row Level Security (RLS)**: Public website visitors can only insert reservation requests. They cannot view or modify other guests' contact information or reservations.
- **Supabase Authentication**: Only authenticated staff members who sign in can inspect, confirm, or delete reservation records.
- **Honeypot Anti-Spam**: Invisible honeypot field captures automated spam bots before sending requests to the database.
