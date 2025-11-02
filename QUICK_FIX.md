# 🚨 QUICK FIX - Participant URLs Not Working

## The Problem

Your participant URLs show "Access Denied" because the database blocks public access by default.

## 3-Step Fix (2 minutes)

### Step 1: Open Supabase
Go to [supabase.com](https://supabase.com) → Your Project → SQL Editor

### Step 2: Run This SQL
Click "New Query", paste this, click "Run":

```sql
-- Add public access policies for participant URLs
CREATE POLICY "Public can view teams" ON teams FOR SELECT TO public USING (true);
CREATE POLICY "Public can view institutions" ON institutions FOR SELECT TO public USING (true);
CREATE POLICY "Public can view adjudicators" ON adjudicators FOR SELECT TO public USING (true);
CREATE POLICY "Public can view rooms" ON rooms FOR SELECT TO public USING (true);
CREATE POLICY "Public can view tournaments" ON tournaments FOR SELECT TO public USING (true);
CREATE POLICY "Public can view rounds" ON rounds FOR SELECT TO public USING (true);
CREATE POLICY "Public can view debates" ON debates FOR SELECT TO public USING (true);
CREATE POLICY "Public can view debate_teams" ON debate_teams FOR SELECT TO public USING (true);
CREATE POLICY "Public can view debate_adjudicators" ON debate_adjudicators FOR SELECT TO public USING (true);
CREATE POLICY "Public can view speaker_scores" ON speaker_scores FOR SELECT TO public USING (true);
```

### Step 3: Test
1. Refresh your browser
2. Go to Teams page → Click Share (🔗)
3. Open the URL → Should work!

---

## Also: Draws Not Showing

If you can't see draws as admin:

1. **Check if draws exist**:
   - Go to Rounds page
   - Click arrow to expand round
   - If empty → Generate draw

2. **To generate a draw**:
   - Need at least 4 teams
   - Need at least 1 room
   - Need at least 1 adjudicator
   - Then click "Generate Draw" button

3. **If button doesn't work**:
   - Open browser console (F12)
   - Look for errors
   - Share the error message

---

## Start Dev Server (PowerShell)

```powershell
cd D:\BOLA\DEBSOC\meow-main
npm run dev
```

(Don't use && in PowerShell - use ; instead)

---

## Need More Help?

- Detailed fix: [FIX_PARTICIPANT_URLS.md](./FIX_PARTICIPANT_URLS.md)
- Troubleshooting: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
- Full guide: [HOW_TO_USE.md](./HOW_TO_USE.md)


