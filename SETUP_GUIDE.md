# ✅ DL Enterprises – Complete Setup Guide (Supabase)
=======================================================

## WHAT YOU GET
- 🔐 Secure login system
- 📄 GST invoice creator with auto-calculation
- 💾 All data saved in Supabase cloud database
- 👥 Customer directory with GSTIN validation
- 📊 Dashboard with revenue chart
- ⬇️  Download invoices as professional PDF
- 📱 Send invoice via WhatsApp (1 click)
- 📧 Email invoices to customers
- ⚙️  Settings for your business details + bank info

---

## STEP 1 — CREATE SUPABASE PROJECT (Free, 5 minutes)

1. Go to https://supabase.com → Click "Start your project"
2. Sign up with GitHub or Email
3. Click "New Project"
4. Fill in:
   - Organization: Personal (or create new)
   - Project name: dl-enterprises
   - Database password: (create a strong password, save it)
   - Region: Southeast Asia (Singapore) — closest to India
5. Click "Create new project" → Wait 2 minutes

---

## STEP 2 — RUN THE DATABASE SQL (2 minutes)

1. In Supabase dashboard → Left menu → "SQL Editor"
2. Click "New query"
3. Open the file: supabase_setup.sql (included in this project)
4. Copy ALL the contents
5. Paste into the SQL editor
6. Click "Run" (green button)
7. You should see: "Success. No rows returned"

---

## STEP 3 — CREATE YOUR LOGIN USERS (1 minute)

1. In Supabase → Left menu → "Authentication"
2. Click "Users" tab
3. Click "Invite user" or "Add user"
4. Enter your email and password
5. Repeat for anyone else who needs access (up to 5 recommended)
   ⚠️  These email+password are what you use to LOGIN to the app

---

## STEP 4 — GET YOUR SUPABASE KEYS (1 minute)

1. In Supabase → Left menu → "Settings" (gear icon at bottom)
2. Click "API"
3. You will see:
   - "Project URL" → looks like: https://xyzxyz.supabase.co
   - "Project API keys" → "anon public" → a long key
4. Copy both values

---

## STEP 5 — ADD KEYS TO THE APP (1 minute)

Open the file: src/supabase/config.js

Change these two lines:
  const SUPABASE_URL      = 'YOUR_SUPABASE_URL';
  const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

Replace with your actual values:
  const SUPABASE_URL      = 'https://xyzxyz.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIs...';

---

## STEP 6 — RUN LOCALLY TO TEST (2 minutes)

Open terminal/command prompt in the project folder:

  npm install
  npm start

Open browser → http://localhost:3000
Login with the email + password you created in Step 3 ✅

---

## STEP 7 — DEPLOY TO VERCEL (Free, 5 minutes)

### Option A: Using terminal (easiest)
  npm install -g vercel
  vercel login
  vercel --prod

### Option B: Using GitHub + Vercel website
1. Go to github.com → Create new repository → Upload project files
2. Go to vercel.com → New Project → Import from GitHub
3. Click Deploy
4. ✅ Your site is live at https://dl-enterprises.vercel.app

### Add Environment Variables in Vercel (keeps keys secure):
1. Vercel dashboard → Your project → Settings → Environment Variables
2. Add:
   - Name: REACT_APP_SUPABASE_URL     Value: your project URL
   - Name: REACT_APP_SUPABASE_ANON_KEY  Value: your anon key
3. Deployments → Redeploy

---

## STEP 8 — SET UP EMAIL (Optional, Free)

200 free emails/month via EmailJS:
1. Go to emailjs.com → Sign up free
2. Email Services → Add Service → Connect your Gmail
3. Email Templates → Create Template with body:
   Subject: Invoice {{inv_no}} from {{company}}
   Body:
     Dear {{to_name}},
     Your invoice {{inv_no}} dated {{inv_date}} is ready.
     Amount Due: {{total}}
     Due Date: {{inv_due}}
     Thank you! – {{company}}
4. Account → Copy your Public Key
5. In the app → Settings page → Fill in Service ID, Template ID, Public Key

---

## HOW TO USE THE APP

First time setup:
  1. Login → Go to Settings
  2. Fill in: Business name, GSTIN, Address, Phone, Email
  3. Fill in: Bank name, Account number, IFSC
  4. Click Save

Creating invoices:
  1. Customers → Add your customers (with GSTIN if they have one)
  2. Create Invoice → Select customer → Add items → Set GST % → Save
  3. Invoices list → Click Download PDF or WhatsApp button

Tracking payments:
  - In Invoices list → Change status to "Paid" when received
  - Dashboard shows total revenue, collected, and pending automatically

---

## GST RATES REFERENCE
  0%  → Exempt items (food grains, fresh vegetables)
  5%  → Essential goods
  12% → Standard goods
  18% → Most services, electronics, packaged food
  28% → Luxury items, cars, tobacco

---

## TROUBLESHOOTING

"Invalid login credentials"
  → Go to Supabase → Authentication → Users → Check your email is listed

"relation does not exist" error
  → You haven't run the SQL yet. Do Step 2 again.

"Network error" or blank screen
  → Check src/supabase/config.js has correct URL and key

PDF not downloading
  → Allow popups in your browser settings

WhatsApp not opening
  → Allow popups, or copy the link manually

---

## PROJECT FILES EXPLAINED

src/supabase/config.js    → Your Supabase URL and key (edit this)
src/supabase/services.js  → All database operations (don't touch)
src/pages/Login.js        → Login screen
src/pages/Dashboard.js    → Main dashboard with chart
src/pages/Invoices.js     → Invoice list + PDF + WhatsApp + Email
src/pages/CreateInvoice.js → Create new GST invoice
src/pages/Customers.js    → Customer management
src/pages/Settings.js     → Business info + EmailJS setup
src/utils/helpers.js      → GST calc, GSTIN validation
src/utils/pdfGenerator.js → Professional PDF generation
supabase_setup.sql        → Run this in Supabase SQL Editor
vercel.json               → Vercel deployment config

---
Built with React + Supabase + jsPDF + EmailJS
