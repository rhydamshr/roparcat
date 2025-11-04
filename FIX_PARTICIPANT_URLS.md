# 🔧 Fix: Participant URLs Not Working - Quick Solution

## The Problem

You're seeing **"Access Denied - Invalid team URL or team not found"** when trying to access participant URLs.

## The Solution

The database has Row Level Security (RLS) enabled, which blocks **public** (unauthenticated) access. We need to add public access policies.

## Step 1: Run the New Migration

1. **Go to** [supabase.com](https://supabase.com) → Your Project
2. **Click** "SQL Editor" in the left sidebar
3. **Click** "New Query"
4. **Open** the file: `supabase/migrations/20251026100943_add_public_access_policies.sql`
5. **Copy ALL the SQL code** from that file
6. **Paste** into Supabase SQL Editor
7. **Click** "Run" (green button at bottom right)
8. **Wait** for "Success" message

## Step 2: Verify It Works

1. **Restart** your dev server: `npm run dev`
2. **Go to** Teams page in your dashboard
3. **Click** the Share button (🔗) next to any team
4. **Open** the URL in a new tab
5. **You should see** the team's private page!

## If It Still Doesn't Work

### Check 1: Error Message
Look at the error message shown on the participant URL page. It will tell you:
- The team ID it's looking for
- The specific error from Supabase

### Check 2: Browser Console
1. **Press F12** to open Developer Tools
2. **Go to Console tab**
3. **Look for** any red error messages
4. **Share** the error message if you need help

### Check 3: Team Exists
1. **Go to** Teams page in dashboard
2. **Verify** the team exists
3. **Try** sharing the URL again

### Check 4: Database Connection
Make sure your `.env` file has correct Supabase credentials:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Check 5: Migration Ran
1. **Go to** Supabase → SQL Editor
2. **Check** if the migration ran successfully
3. **Verify** you see "Success" message

## Alternative: Disable RLS (Not Recommended)

If you can't run the migration, you can temporarily disable RLS:

1. **Go to** Supabase → SQL Editor
2. **Run** this (NOT recommended for production):
```sql
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE institutions DISABLE ROW LEVEL SECURITY;
ALTER TABLE adjudicators DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments DISABLE ROW LEVEL SECURITY;
ALTER TABLE rounds DISABLE ROW LEVEL SECURITY;
ALTER TABLE debates DISABLE ROW LEVEL SECURITY;
ALTER TABLE debate_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE debate_adjudicators DISABLE ROW LEVEL SECURITY;
ALTER TABLE speaker_scores DISABLE ROW LEVEL SECURITY;
```

**Note**: This disables all security. The migration above is the better solution.

## Why This Happened

- **RLS** (Row Level Security) is enabled by default
- **Original policies** only allowed authenticated users
- **Participant URLs** need public (unauthenticated) access
- **The new migration** adds public SELECT policies

## After Fixing

Once you run the migration:
- ✅ Participant URLs will work
- ✅ Public can view teams, rounds, debates
- ✅ Still secure (can't modify data)
- ✅ Admin controls remain protected

## Testing

After running the migration, test:
1. ✅ Go to Teams page
2. ✅ Click Share (🔗)
3. ✅ Open URL in new/incognito window
4. ✅ Should see team's private page with draws
5. ✅ Should see standings
6. ✅ Should see round history

---

**If you're still having issues after running the migration, check the browser console (F12) for the specific error message!**




