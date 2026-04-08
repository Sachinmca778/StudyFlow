# ⚡ Quick Start Checklist - StudyFlow

## ✅ Pre-Launch Checklist (Complete These in Order)

### Phase 1: Setup (30 minutes)

- [ ] **Install Node.js**
  ```bash
  brew install node
  # Verify:
  node --version
  npm --version
  ```

- [ ] **Create Supabase Account**
  - Visit: https://supabase.com
  - Sign up (free)
  - Create new project
  - Set strong password
  - Select region: Singapore

- [ ] **Get Supabase API Keys**
  - Go to: Project Settings → API
  - Copy these 3 values:
    - [ ] Project URL
    - [ ] anon/public key
    - [ ] service_role key

- [ ] **Run Database Schema**
  - Go to: SQL Editor in Supabase
  - Open: `supabase-schema.sql` file
  - Copy entire content
  - Paste in SQL Editor
  - Click "Run"
  - Verify: Should see "Success. No rows returned"

- [ ] **Setup Environment Variables**
  ```bash
  cd /Users/sachin/study_planner/studyflow
  cp .env.local.example .env.local
  ```
  - [ ] Open `.env.local` in text editor
  - [ ] Add your Supabase URL
  - [ ] Add your Supabase anon key
  - [ ] Add your Supabase service role key

---

### Phase 2: Install & Run (5 minutes)

- [ ] **Install Dependencies**
  ```bash
  npm install
  ```
  Wait for installation to complete (~2-3 minutes)

- [ ] **Start Development Server**
  ```bash
  npm run dev
  ```
  Should see: "Ready in Xms"

- [ ] **Open in Browser**
  - Go to: http://localhost:3000
  - Should see: StudyFlow landing page ✨

---

### Phase 3: Test All Features (30 minutes)

- [ ] **Test Landing Page**
  - Scroll through all sections
  - Check features, pricing, testimonials

- [ ] **Test Authentication**
  - Click "Get Started Free"
  - Try Google login OR
  - Create email account
  - Verify email received (check inbox)

- [ ] **Complete Onboarding**
  - Select class level
  - Select board type
  - Select target exam
  - Add 3-4 subjects (Physics, Chemistry, Maths, etc.)
  - Set daily study goal
  - Complete onboarding

- [ ] **Test Dashboard**
  - Should see empty dashboard
  - Check stats cards show 0

- [ ] **Test Study Planner**
  - Click "AI Generate Weekly Plan"
  - Should create multiple study plans
  - Try adding manual plan
  - Mark a plan as complete

- [ ] **Test Time Tracker**
  - Click on a subject to start session
  - Watch timer count up
  - Stop session
  - Verify session saved

- [ ] **Test Calendar**
  - Navigate to Calendar tab
  - Should see current month
  - Verify plans show on calendar

- [ ] **Test Assignments**
  - Add a test assignment
  - Set due date
  - Update status
  - Try adding an exam

- [ ] **Test Focus Timer**
  - Start timer
  - Test pause/resume
  - Test reset
  - Try skipping to break

- [ ] **Test Settings**
  - Update profile name
  - Add/remove subjects
  - Check notification toggles

---

### Phase 4: Customize (Optional - 1 hour)

- [ ] **Change Colors** (if desired)
  - Edit: `tailwind.config.js`
  - Modify primary/accent colors

- [ ] **Update Branding**
  - Change app name if needed
  - Update logo (optional)
  - Modify testimonials with real ones

- [ ] **Add Your Domain** (if ready)
  - Buy domain from GoDaddy/Namecheap
  - Setup in Vercel later

---

### Phase 5: Deploy (15 minutes)

- [ ] **Push to GitHub**
  ```bash
  git init
  git add .
  git commit -m "StudyFlow MVP - Initial commit"
  git remote add origin https://github.com/YOUR_USERNAME/studyflow.git
  git push -u origin main
  ```

- [ ] **Deploy to Vercel**
  - Go to: https://vercel.com
  - Sign in with GitHub
  - Click "New Project"
  - Import studyflow repository
  - Add environment variables (from .env.local)
  - Click "Deploy"
  - Wait for build (~2-3 minutes)

- [ ] **Test Production URL**
  - Open Vercel-provided URL
  - Test login/signup
  - Verify all features work

- [ ] **Add Custom Domain** (optional)
  - Go to Vercel Settings → Domains
  - Add your domain
  - Update DNS records as instructed

---

### Phase 6: Launch Prep (1-2 days)

- [ ] **Get Beta Testers**
  - Share with 10 friends/classmates
  - Get their feedback
  - Note any bugs or issues

- [ ] **Fix Critical Bugs**
  - Address any showstopper issues
  - Test fixes thoroughly

- [ ] **Add Privacy Policy & Terms**
  - Create simple pages (use templates online)
  - Add to footer links

- [ ] **Prepare Marketing**
  - Write Reddit posts
  - Prepare Telegram messages
  - Create social media posts

---

### Phase 7: LAUNCH! 🚀

- [ ] **Announce on Social Media**
  - Reddit: r/IndianStudents, r/JEE_Mains, r/NEET
  - Telegram groups
  - WhatsApp status
  - Instagram story

- [ ] **Share with Personal Network**
  - Message 20 classmates
  - Share in school/college groups
  - Ask friends to share

- [ ] **Track First Users**
  - Monitor signups daily
  - Engage with early users
  - Collect feedback

- [ ] **Iterate Fast**
  - Fix bugs within 24 hours
  - Add requested features
  - Keep users updated

---

## 📊 Success Checklist

### Week 1 Goals:
- [ ] 50+ signups
- [ ] 10+ active users
- [ ] 5+ feedback messages
- [ ] 0 critical bugs

### Month 1 Goals:
- [ ] 100+ users
- [ ] 20+ daily active users
- [ ] First paying user
- [ ] 5+ testimonials

### Month 3 Goals:
- [ ] 500+ users
- [ ] ₹10K+ MRR
- [ ] 10+ testimonials
- [ ] Product-market fit validated

---

## 🎯 Quick Reference Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Check for linting errors
npm run lint

# Install new package
npm install package-name
```

---

## ⚠️ Troubleshooting Quick Fixes

| Problem | Solution |
|---------|----------|
| `npm: command not found` | Install Node.js first |
| `Supabase connection error` | Check `.env.local` keys |
| `Port 3000 already in use` | Kill process or use different port |
| `Module not found` | Run `npm install` again |
| `Auth not working` | Check Supabase auth providers enabled |
| `Database errors` | Re-run SQL schema |

---

## 📞 Need Help?

**Check These Files:**
1. `README.md` - Full documentation
2. `SETUP_GUIDE.md` - Hindi/English guide
3. `PROJECT_SUMMARY.md` - Complete overview

**External Resources:**
- Supabase Docs: https://supabase.com/docs
- Next.js Learn: https://nextjs.org/learn
- TailwindCSS Docs: https://tailwindcss.com/docs

---

## ✅ You're Ready!

**If you've completed all checkboxes above, you're ready to launch!**

**Now go make it happen! 🚀📚**

---

*Last updated: April 2026*
