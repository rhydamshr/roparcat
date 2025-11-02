# ✅ Converted to Asian Parliamentary Format

## What Changed

### 1. Database Updates
**File**: `supabase/migrations/20251026100945_convert_to_asian_parliamentary.sql`

**Run this migration in Supabase SQL Editor:**
```sql
-- Convert from British Parliamentary (BP) to Asian Parliamentary (AP) format
ALTER TABLE debate_teams DROP CONSTRAINT IF EXISTS debate_teams_position_check;
ALTER TABLE debate_teams ADD CONSTRAINT debate_teams_position_check 
  CHECK (position IN ('government', 'opposition', 'OG', 'OO', 'CG', 'CO'));

ALTER TABLE rounds ADD COLUMN IF NOT EXISTS speakers_per_team integer DEFAULT 3;
UPDATE rounds SET speakers_per_team = 3 WHERE speakers_per_team IS NULL;
```

### 2. Updated Features

#### Team Registration
- ✅ **3 speakers per team** (default, required for AP)
- ✅ Form shows "Speaker 1 (First)", "Speaker 2 (Second)", "Speaker 3 (Third)"
- ✅ Indicates when ready for Asian Parliamentary

#### Draw Generation
- ✅ **2 teams per debate** (Government vs Opposition)
- ✅ **No more 4 teams per debate** (was OG, OO, CG, CO in BP)
- ✅ Each debate pairs exactly 2 teams
- ✅ Automatically assigns: "government" and "opposition"

#### Admin View (Draws)
- ✅ Shows **2 teams per debate** clearly
- ✅ Color-coded: 🟢 Green = Government, 🔴 Red = Opposition
- ✅ Shows exact matchup: "Government: Team A" vs "Opposition: Team B"
- ✅ Shows motion assigned to each debate

#### Participant URLs
- ✅ Shows **"You Are GOVERNMENT"** or **"You Are OPPOSITION"** 
- ✅ Large banner showing your side
- ✅ Shows your **exact opponent** (the other team)
- ✅ Shows which side they are (Government or Opposition)
- ✅ Shows assigned motion for your debate
- ✅ Shows room and judges

#### Tournament Default
- ✅ Default format is now **Asian Parliamentary (AP)**
- ✅ BP format still available as option

---

## How It Works Now

### Example Debate Structure:

**Old (BP):** 4 teams per debate
- OG: Harvard
- OO: Yale  
- CG: Stanford
- CO: Oxford

**New (AP):** 2 teams per debate
- 🏛️ GOVERNMENT: Harvard
- ⚖️ OPPOSITION: Yale

### Participant URL Display:

**If you're Government:**
- Large green banner: "🏛️ GOVERNMENT"
- "You Are GOVERNMENT"
- "You propose the motion"
- Shows opponent: "⚖️ OPPOSITION: Yale"

**If you're Opposition:**
- Large red banner: "⚖️ OPPOSITION"  
- "You Are OPPOSITION"
- "You oppose the motion"
- Shows opponent: "🏛️ GOVERNMENT: Harvard"

---

## Before vs After

| Feature | Old (BP) | New (AP) |
|---------|----------|----------|
| Teams per debate | 4 | 2 |
| Speakers per team | 2 | 3 |
| Positions | OG, OO, CG, CO | Government, Opposition |
| Participant sees | Position (OG/OO/CG/CO) | Side (Gov/Opp) + Opponent |
| Scoring points | 3-2-1-0 | Win/Loss |
| Draw pairing | Power-paired by 4s | Power-paired by 2s |

---

## What You Need to Do

### Step 1: Run Migration
Go to Supabase → SQL Editor → Run:
```sql
ALTER TABLE debate_teams DROP CONSTRAINT IF EXISTS debate_teams_position_check;
ALTER TABLE debate_teams ADD CONSTRAINT debate_teams_position_check 
  CHECK (position IN ('government', 'opposition', 'OG', 'OO', 'CG', 'CO'));
```

### Step 2: Test Everything

1. **Add teams** (will require 3 speakers now)
2. **Create tournament** (defaults to AP format)
3. **Create round** with 3 motions
4. **Generate draw** (creates 2-team debates)
5. **Check admin view** (see Government vs Opposition)
6. **Share participant URL** (see "You Are Government/Opposition")

---

## Key Changes Summary

✅ **3 speakers per team** (was 2)  
✅ **2 teams per debate** (was 4)  
✅ **Positions: Government/Opposition** (was OG/OO/CG/CO)  
✅ **Participant URLs show your side clearly**  
✅ **Shows exact opponent** (the other team)  
✅ **Default format: AP** (was BP)  
✅ **Draw generation updated** (pairs 2 teams)  
✅ **Admin view shows Gov vs Opp clearly**  

**Everything is now configured for Asian Parliamentary format!** 🎉

