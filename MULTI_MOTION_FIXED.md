# ✅ Multi-Motion Feature Implemented!

## What's Been Done

### 1. Database Schema Updated ✅
- Added `motion_1`, `motion_2`, `motion_3` columns to `rounds` table
- Added `motion_used` column to `debates` table
- Created migration: `supabase/migrations/20251026100944_add_motions_to_rounds_and_draws.sql`

### 2. Types Updated ✅
- Updated Round type to include motion_1, motion_2, motion_3
- Updated Debate type to include motion_used
- Updated Supabase types

### 3. Forms Updated ✅
- Round creation/edit form now has **3 motion fields**
- Motion 1 is required
- Motion 2 and 3 are optional
- Added helpful tips

### 4. Draw Generation Updated ✅
- When generating draws, system randomly assigns one of the 3 motions to each debate
- Each debate gets a different motion (for variety)
- Motion stored in `motion_used` field

### 5. Display Updated ✅
- Admin view shows **assigned motion for each debate**
- Shows **all teams clearly** with their positions (OG, OO, CG, CO)
- Shows **who is against who** - each debate card shows all 4 teams
- Shows adjudicators with roles

### 6. Participant URLs Updated ✅
- Shows **exact opposing teams** with their names and positions
- Shows **assigned motion** for their specific debate (not all motions, just theirs)
- Clear visual display of opponents

---

## What You Need to Do

### Step 1: Run the Migration
Go to Supabase → SQL Editor → Run this:

```sql
-- Add support for 3 motions per round and motion assignment to debates

ALTER TABLE rounds 
ADD COLUMN IF NOT EXISTS motion_1 text,
ADD COLUMN IF NOT EXISTS motion_2 text,
ADD COLUMN IF NOT EXISTS motion_3 text;

ALTER TABLE debates
ADD COLUMN IF NOT EXISTS motion_used text;

UPDATE rounds SET motion_1 = motion WHERE motion IS NOT NULL;
```

### Step 2: Test It Out

1. **Go to Rounds page**
2. **Create a new round** (or edit existing)
3. **You'll see 3 motion fields:**
   - Motion 1 (required): "THW support universal basic income"
   - Motion 2 (optional): "THW ban single-use plastics"
   - Motion 3 (optional): "THW implement wealth tax"
4. **Save the round**
5. **Generate draw**
6. **Expand the round** → See debates with:
   - ✅ Assigned motion for each debate
   - ✅ All 4 teams (OG, OO, CG, CO) clearly shown
   - ✅ Which team is against which team
   - ✅ Room and adjudicators
7. **Share a team's URL** → They see:
   - ✅ Their assigned motion (their specific debate's motion)
   - ✅ Their exact opponents with positions
   - ✅ Room and judges

---

## Example: What It Looks Like

### When You Generate Draws:

**Debate 1 (Room 101):**
- Motion: "THW support universal basic income"
- Teams:
  - OG: Harvard A
  - OO: Yale B
  - CG: Stanford C
  - CO: Oxford D
- Judges: Judge Smith (Chair), Judge Jones, Judge Lee

**Debate 2 (Room 102):**
- Motion: "THW ban single-use plastics" (different motion!)
- Teams:
  - OG: Princeton A
  - OO: Columbia B
  - CG: MIT C
  - CO: Caltech D
- Judges: Judge Brown (Chair), Judge White, Judge Green

---

## For Each Team (Participant URL):

When Harvard A opens their URL, they see:
- **Motion**: "THW support universal basic income" (their specific motion!)
- **Position**: OG
- **Room**: 101
- **Opponents**:
  - OO: Yale B
  - CG: Stanford C
  - CO: Oxford D
- **Judges**: Judge Smith (Chair), Judge Jones, Judge Lee

They DON'T see:
- ❌ Motion 2 or Motion 3 (unless those are assigned to other debates)
- ✅ Only THEIR assigned motion

---

## Key Features

✅ **3 Motions Per Round**: Add up to 3 different motions for variety  
✅ **Random Assignment**: Each debate gets randomly assigned ONE motion  
✅ **Clear Display**: Admin and participants see exactly which motion each debate has  
✅ **Show Opponents**: Both admin and participants see WHO is AGAINST WHO  
✅ **Position Clarity**: Shows OG, OO, CG, CO positions for each team  
✅ **Participant URLs**: Show exact opponents with names and positions  

---

## What You Asked For

✅ For each round when generating draws, private URLs show which team EXACTLY they're against  
✅ Each round can have 3 motions  
✅ In admin route, you can see draws for this round (which team vs which team, which room, which motion)  

**ALL DONE!** 🎉

---

## How to Use

1. Create a round with 3 motions
2. Generate draw
3. Each debate gets randomly assigned one motion
4. Admin sees all debates with motion, opponents, room, judges
5. Participants see their specific debate with motion, opponents, room, judges

Test it now!


