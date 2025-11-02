# 🔧 Troubleshooting Guide

Common issues and solutions for Tabbycat Clone.

## 🚨 Setup Issues

### Issue: "Missing Supabase environment variables"

**Symptoms:**
- Error message appears at startup
- App won't load

**Solution:**
1. Create `.env` file in project root
2. Add these lines:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Get credentials from Supabase → Settings → API
4. Restart dev server (`npm run dev`)

---

### Issue: "Error creating profile on signup"

**Symptoms:**
- Can't create account
- Error about profiles table

**Solution:**
1. Go to Supabase SQL Editor
2. Verify the migration ran successfully
3. Check if `profiles` table exists
4. If not, run the migration again:
   - File: `supabase/migrations/20251026100942_create_debate_tournament_schema.sql`
   - Copy all code → Paste in SQL Editor → Run

---

### Issue: "Cannot connect to database"

**Symptoms:**
- Data doesn't load
- Empty pages

**Solution:**
1. Check `.env` file has correct Supabase URL and key
2. Verify Supabase project is active (not paused)
3. Check browser console for specific error
4. Make sure network allows connections to Supabase

---

## 🐛 Runtime Issues

### Issue: "Can't generate draw - not enough teams"

**Symptoms:**
- Generate Draw button doesn't work
- Error about minimum teams

**Solution:**
1. Need at least **4 teams** for BP format
2. Need at least **1 room**
3. Need at least **1 adjudicator**
4. Check Teams, Rooms, and Adjudicators pages

---

### Issue: "CSV import failed"

**Symptoms:**
- Import button does nothing
- Error message on import

**Solution:**
1. Check CSV format has these columns:
   - Team
   - Institution
   - Speakers
2. Institution names must match existing institutions (case-sensitive)
3. Speakers should be comma-separated: "Alice, Bob"
4. Save CSV with UTF-8 encoding
5. Check browser console for specific error

**Correct CSV format:**
```csv
Team,Institution,Speakers
Harvard A,Harvard University,"Alice, Bob"
Harvard B,Harvard University,"Charlie, Dave"
```

---

### Issue: "Results not saving"

**Symptoms:**
- Click Save but data doesn't persist
- No confirmation message

**Solution:**
1. Check browser console for errors
2. Verify you're logged in (not logged out)
3. Make sure all required fields filled:
   - Points (0-3)
   - Rank (1-4)
   - Speaker scores (60-100)
4. Check network tab in DevTools for failed requests
5. Refresh page and try again

---

### Issue: "Standings not updating"

**Symptoms:**
- Results saved but standings don't change
- Rankings are old

**Solution:**
1. Standings update automatically via database trigger
2. If not updating:
   - Refresh the Standings page
   - Check if trigger exists in database
   - Re-run the migration SQL
3. Check browser console for errors

---

## 🔍 Database Issues

### Issue: Tables don't exist

**Symptoms:**
- 404 errors when loading pages
- "Relation does not exist" error

**Solution:**
1. Go to Supabase → SQL Editor
2. Run the migration file:
   - Location: `supabase/migrations/20251026100942_create_debate_tournament_schema.sql`
3. Verify all tables were created
4. Check if RLS policies are enabled

---

### Issue: Permission denied errors

**Symptoms:**
- Can't insert/update data
- "Row Level Security" errors

**Solution:**
1. Make sure you're logged in
2. Verify your profile exists in `profiles` table
3. Check that your role is 'admin' for admin actions
4. Go to Supabase → Authentication → Users
5. Verify your user account exists

---

## 🎨 UI Issues

### Issue: Pages not loading / blank screen

**Symptoms:**
- White screen
- No content loads

**Solution:**
1. Check browser console for JavaScript errors
2. Clear browser cache
3. Try incognito mode
4. Verify `npm run dev` is running
5. Check that all dependencies installed: `npm install`

---

### Issue: Styles not applied

**Symptoms:**
- Unstyled or broken layout
- Missing colors

**Solution:**
1. Run `npm install` to ensure Tailwind is installed
2. Restart dev server
3. Clear browser cache
4. Check that `index.css` imports Tailwind directives

---

## 🔐 Authentication Issues

### Issue: Can't log in

**Symptoms:**
- "Invalid credentials" error
- Login button doesn't work

**Solution:**
1. Check email/password are correct
2. Try register again if first time
3. Check Supabase Auth is enabled
4. Verify .env has correct credentials
5. Clear browser cookies/local storage

---

### Issue: Logged out unexpectedly

**Symptoms:**
- Work lost
- Need to re-login frequently

**Solution:**
1. This is normal if session expires
2. Session lasts 7 days by default
3. Check if `.env` file was modified
4. Clear cookies and re-login

---

## 📊 Data Issues

### Issue: Can't see other users' data

**Symptoms:**
- Empty pages despite having data
- Different users see different things

**Solution:**
1. This might be expected behavior due to RLS
2. Each user should see their own data
3. Admin users see all data
4. Check your user role in Supabase

---

### Issue: Duplicate data appearing

**Symptoms:**
- Same teams/adjudicators appear twice
- Count is wrong

**Solution:**
1. Check for duplicate records in database
2. Use delete function to remove duplicates
3. Re-import CSV if needed (de-duplicate first)
4. Be careful with CSV imports - they don't check duplicates

---

## 🚀 Performance Issues

### Issue: App is slow

**Symptoms:**
- Slow page loads
- Laggy typing

**Solution:**
1. This is normal on Supabase free tier (shared DB)
2. Upgrade to paid tier for better performance
3. Reduce number of concurrent users
4. Optimize by limiting data fetched

---

### Issue: Too many database requests

**Symptoms:**
- "Rate limit" errors
- Quota exceeded

**Solution:**
1. You're on free tier which has limits
2. Wait a few minutes and retry
3. Upgrade to paid tier for higher limits
4. Optimize code to reduce database calls

---

## 🛠️ Development Issues

### Issue: TypeScript errors

**Symptoms:**
- Red squiggly lines in editor
- Type errors in build

**Solution:`
1. Run `npm run typecheck`
2. Fix any type errors shown
3. Make sure all imports are correct
4. Check that types match Supabase schema

---

### Issue: ESLint errors

**Symptoms:**
- Code quality warnings
- Build fails due to linting

**Solution:**
1. Run `npm run lint`
2. Fix errors automatically if possible
3. Or disable specific rules if needed
4. Check that code follows React best practices

---

## 📞 Still Having Issues?

If none of these solutions work:

1. **Check Browser Console**
   - Press F12 → Console tab
   - Look for red error messages
   - Share error with support

2. **Check Network Tab**
   - F12 → Network tab
   - Look for failed requests (red)
   - Click to see error details

3. **Verify Database**
   - Go to Supabase dashboard
   - Check if tables exist
   - Verify data is there

4. **Re-run Setup**
   - Follow QUICK_START.md from scratch
   - Make sure all steps completed
   - Verify .env file exists

5. **Check Documentation**
   - HOW_TO_USE.md for usage questions
   - README.md for setup details
   - IMPLEMENTATION.md for technical info

---

## 💡 Prevention Tips

✅ Always create `.env` file before starting  
✅ Run SQL migration immediately after setup  
✅ Create admin account first (not tabber)  
✅ Test with small data first (2-4 teams)  
✅ Keep browser console open during development  
✅ Use Chrome DevTools for debugging  
✅ Check Supabase logs in dashboard  

**Happy debugging! 🐛→✅**

