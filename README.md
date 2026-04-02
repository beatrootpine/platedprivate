# Plated Private — Private Chef Marketplace

South Africa's premier private chef marketplace. Built with React + Vite.

## Quick Start (Local Development)

```bash
# 1. Unzip and navigate to the project
cd plated-private

# 2. Install dependencies
npm install

# 3. Start development server
npm run dev

# Opens at http://localhost:5173
```

## Deploy to Vercel (Production)

### Option A: GitHub + Vercel (Recommended)
```bash
# 1. Create a new repo on GitHub
# Go to github.com/new → name it "plated-private"

# 2. Push the code
cd plated-private
git init
git add .
git commit -m "Initial commit - Plated Private marketplace"
git branch -M main
git remote add origin https://github.com/beatrootpine/plated-private.git
git push -u origin main

# 3. Connect to Vercel
# Go to vercel.com → Import Project → Select "plated-private" repo
# Framework: Vite
# Build Command: npm run build
# Output Directory: dist
# Click Deploy
```

### Option B: Vercel CLI (Quick Deploy)
```bash
npm install -g vercel
cd plated-private
vercel
# Follow the prompts
```

### Option C: GitHub Web Editor (Mo's preferred workflow)
1. Create new repo at github.com/beatrootpine/plated-private
2. Upload all files via the GitHub web interface
3. Connect to Vercel and deploy

## Project Structure

```
plated-private/
├── public/
│   └── logo.png              # Plated Private logo (actual brand asset)
├── src/
│   ├── components/
│   │   ├── UI.jsx            # Shared components (Logo, buttons, inputs, cards, badges)
│   │   ├── Nav.jsx           # Navigation bar with mobile hamburger
│   │   └── Footer.jsx        # Footer with brand and links
│   ├── data/
│   │   └── constants.js      # Mock data, specialities, areas, platform fee
│   ├── pages/
│   │   ├── HomePage.jsx      # Landing page with hero, how it works, featured chefs
│   │   ├── BrowseChefsPage.jsx  # Chef directory with search & filter
│   │   ├── BookingPage.jsx   # Smart booking form → matching → 3 results → confirm
│   │   ├── ChefSignup.jsx    # 8-step chef onboarding wizard
│   │   └── AdminDashboard.jsx # Revenue stats, deals table, chef management
│   ├── App.jsx               # Router setup
│   ├── main.jsx              # React entry point
│   └── index.css             # Global styles, CSS variables, responsive breakpoints
├── index.html                # HTML entry
├── package.json
├── vite.config.js
├── vercel.json               # SPA routing config for Vercel
└── .gitignore
```

## Features

### Client Side
- **Smart Booking Flow**: Fill in event details → animated matching screen → 3 chef matches → select & confirm
- **Browse Chefs**: Filter by cuisine, area, search by name
- **Chef Profile Cards**: Specialities, rate, min hours, ratings, areas, qualification type, verified status

### Chef Side
- **8-Step Sign-Up Wizard**: Fun, broken into digestible parts with progress bar
  1. Basic info (name, email, phone)
  2. Specialities (tag picker, max 3)
  3. Bio / story
  4. Rate setting (with live net-after-commission calculator)
  5. Service areas
  6. Qualifications (formal vs self-taught)
  7. Document uploads (ID + certs/portfolio)
  8. Profile review & submit

### Admin Dashboard
- Revenue & commission stats at a glance
- All bookings table with status badges
- Chef management (suspend, reactivate, remove)

## Tech Stack
- **React 18** + **Vite** (fast dev & build)
- **React Router** (SPA routing)
- **CSS Variables** (consistent theming)
- **Responsive** (mobile-first with breakpoints)
- **Vercel** ready (vercel.json included)

## Next Steps (Supabase Integration)
When ready to go live, wire up:
1. **Supabase** for database (chefs, bookings, users)
2. **Supabase Auth** for chef/client login
3. **Supabase Storage** for document/photo uploads
4. **Paystack** for payment processing
5. **SendGrid/Twilio** for email/WhatsApp notifications

## Brand
- **Company**: Branded SA Corporation (Pty) Ltd t/a Plated Private
- **Gold**: #C9A84C
- **Platform Fee**: 15%
- **Font Display**: Playfair Display
- **Font Body**: DM Sans
