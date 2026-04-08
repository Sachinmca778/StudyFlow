# 🚀 StudyFlow - Quick Setup Guide (हिंदी में)

## ⚡ पहले यह करो (MANDATORY)

### Step 1: Node.js Install करो

अगर Node.js install नहीं है तो पहले यह करो:

**Option A - Homebrew से (Recommended):**
```bash
brew install node
```

**Option B - Website से:**
1. Visit करो: https://nodejs.org/
2. Download करो LTS version
3. Install करो
4. Verify करो:
```bash
node --version
npm --version
```

---

### Step 2: Supabase Account बनाओ

1. **Sign Up करो:**
   - जाओ: https://supabase.com
   - Free account बनाओ

2. **New Project बनाओ:**
   - "New Project" click करो
   - Password set करो (strong रखो)
   - Region select करो: **Singapore** (India के closest)

3. **API Keys निकालो:**
   - Project Settings > API में जाओ
   - ये 3 keys copy करो:
     ```
     Project URL → https://xxxxx.supabase.co
     anon/public key → eyJhbGc...
     service_role key → eyJhbGc... (ये secret है, share मत करना!)
     ```

4. **Database Schema Run करो:**
   - SQL Editor में जाओ
   - `supabase-schema.sql` file का सारा content copy करो
   - SQL Editor में paste करो
   - "Run" button dabao
   - Success message आएगा ✅

5. **Google Auth Setup (Optional but Recommended):**
   - Authentication > Providers में जाओ
   - Google enable करो
   - Google Cloud Console से OAuth credentials लो
   - Redirect URL add करो: `https://your-project.supabase.co/auth/v1/callback`

---

### Step 3: Project Setup करो

Terminal open करो और ये commands run करो:

```bash
# Project folder में जाओ
cd /Users/sachin/study_planner/studyflow

# Dependencies install करो
npm install

# Environment file copy करो
cp .env.local.example .env.local

# File edit करो
open .env.local
```

---

### Step 4: `.env.local` File Edit करो

`.env.local` file में अपने Supabase credentials डालो:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Firebase (बाद में configure कर सकते हो)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### Step 5: App Run करो 🎉

```bash
npm run dev
```

Browser में जाओ: **http://localhost:3000**

**अगर सब सही है तो:**
- Landing page दिखेगा ✨
- "Get Started Free" click करो
- Google से login करो या email से sign up करो
- Onboarding flow complete करो
- Dashboard access करोगे! 🎊

---

## 📱 Features Testing

### 1. Onboarding Flow Test करो:
- Class level select करो
- Board type select करो
- Target exam select करो
- Subjects add करो (Physics, Chemistry, Maths, etc.)
- Daily study goal set करो

### 2. Study Planner Test करो:
- "AI Generate Weekly Plan" button click करो
- Automatic study plan generate होगा
- Plans customize कर सकते हो

### 3. Time Tracker Test करो:
- Subject select करो
- "Start Session" click करो
- Timer चलने लगेगा ⏱️
- "Stop" click करो
- Session save होगा

### 4. Calendar View करो:
- Monthly calendar दिखेगा
- Plans, assignments, exams show होंगे

### 5. Dashboard देखो:
- Weekly stats
- Subject-wise breakdown
- Progress charts

---

## 🎨 Customization (Optional)

### Colors Change करना हो:

`tailwind.config.js` file edit करो:

```javascript
colors: {
  primary: {
    // अपन primary color palette
  },
  accent: {
    // अपनaccent color palette
  },
}
```

---

## 🚢 Production में Deploy करो

### Vercel पर Deploy (Free):

1. **GitHub पर Push करो:**
```bash
git init
git add .
git commit -m "StudyFlow initial setup"
git remote add origin https://github.com/your-username/studyflow.git
git push -u origin main
```

2. **Vercel पर Deploy:**
   - जाओ: https://vercel.com
   - "New Project" click करो
   - GitHub repo select करो
   - Environment variables add करो (`.env.local` से)
   - "Deploy" click करो

3. **Custom Domain (Optional):**
   - Domain खरीदो (GoDaddy/Namecheap से ~₹500/year)
   - Vercel settings में domain add करो
   - DNS records update करो

---

## 💰 Paisा Kमाना शुरू करो

### Pricing Model:
- **Free Tier:** हमेशा free रहेगा (basic features)
- **Pro Tier:** ₹100/month (या ₹999/year)

### Payment Integration (बाद में add करना):
- Razorpay (India-specific)
- Stripe (international)
- UPI payments

---

## 📊 Important Numbers Track करो

### Week 1:
- [ ] 50+ signups
- [ ] 10+ active users
- [ ] Feedback collect करो

### Month 1:
- [ ] 100+ users
- [ ] 20+ daily active users
- [ ] Bug fixes

### Month 3:
- [ ] 500+ users
- [ ] ₹10K+ MRR
- [ ] 5+ testimonials

---

## ⚠️ Common Issues & Solutions

### Issue: "npm command not found"
**Solution:** Node.js install नहीं है। Step 1 follow करो।

### Issue: "Supabase connection error"
**Solution:**
- `.env.local` check करो
- Supabase URL और keys correct हैं?
- Supabase project active है?

### Issue: "Authentication not working"
**Solution:**
- Browser console में errors देखो
- Supabase dashboard में redirect URLs check करो
- Auth providers enabled हैं?

### Issue: "Database queries failing"
**Solution:**
- SQL schema run किया?
- RLS policies set हैं?
- User authenticated है?

---

## 📞 Help चाहिए?

### Resources:
- Supabase Docs: https://supabase.com/docs
- Next.js Docs: https://nextjs.org/docs
- TailwindCSS: https://tailwindcss.com/docs

### Community:
- r/IndianStudents (Reddit)
- r/JEE_Mains (Reddit)
- Telegram groups

---

## ✅ Launch Checklist

- [ ] Node.js installed
- [ ] Supabase account created
- [ ] Database schema run हो गया
- [ ] `.env.local` setup हो गया
- [ ] `npm install` success
- [ ] `npm run dev` चल रहा है
- [ ] Localhost पर app काम कर रहा है
- [ ] Auth working (Google/Email)
- [ ] Onboarding flow test हो गया
- [ ] All dashboard features काम कर रहे हैं
- [ ] Mobile responsive check कर लिया
- [ ] GitHub push हो गया
- [ ] Vercel deploy हो गया (optional)

---

## 🎯 Next Steps

1. ✅ यह setup complete करो
2. ✅ App test करो
3. ✅ 10 students से feedback लो
4. ✅ Bugs fix करो
5. ✅ Polish UI/UX
6. ✅ Launch करो!

---

**बस हो गया! अब बस app run करो और testing शुरू करो! 🚀**

*अगर कुछ समझ नहीं आए तो मुझे बताना!* 😊
