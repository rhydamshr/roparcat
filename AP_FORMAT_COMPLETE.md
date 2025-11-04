# ✅ Asian Parliamentary Format - Complete Implementation

## What's Now Working

### Participant URLs Show ALL 3 Motions ✅

When a participant opens their private URL, they see:

```
Motions
├── Motion 1: "THW support universal basic income" ✓ Your motion
├── Motion 2: "THW ban single-use plastics"
└── Motion 3: "THW implement wealth tax"
```

**The motion assigned to their specific debate is marked with "✓ Your motion"**

---

## Complete Feature Set

### 1. 3 Motions Per Round ✅
- Admin adds 3 motions when creating rounds
- Motion 1 is required, Motion 2 and 3 are optional
- All 3 motions visible to participants

### 2. Asian Parliamentary Format ✅
- **3 speakers per team** (default)
- **2 teams per debate** (Government vs Opposition)
- **Not 4 teams** (was BP: OG, OO, CG, CO)

### 3. Participant URLs ✅
Shows:
- ✅ All 3 motions with labels
- ✅ Your motion marked with green badge
- ✅ **"You Are GOVERNMENT"** or **"You Are OPPOSITION"** banner
- ✅ Your exact opponent (the other team)
- ✅ Which side your opponent is (Gov/Opp)
- ✅ Room and judges
- ✅ Personal stats (rank, points, avg speaks)
- ✅ Overall standings

### 4. Admin Draws View ✅
Shows:
- ✅ All debates with assigned motion
- ✅ Government teams in green 🟢
- ✅ Opposition teams in red 🔴
- ✅ 2 teams per debate clearly
- ✅ Room assignment
- ✅ Adjudicator panel

### 5. Database Changes Needed ✅

**Run this SQL in Supabase:**

```sql
-- Run migration for 3 motions per round
ALTER TABLE rounds 
ADD COLUMN IF NOT EXISTS motion_1 text,
ADD COLUMN IF NOT EXISTS motion_2 text,
ADD COLUMN IF NOT EXISTS motion_3 text;

ALTER TABLE debates
ADD COLUMN IF NOT EXISTS motion_used text;

UPDATE rounds SET motion_1 = motion WHERE motion IS NOT NULL;

-- Run migration for AP format
ALTER TABLE debate_teams DROP CONSTRAINT IF EXISTS debate_teams_position_check;
ALTER TABLE debate_teams ADD CONSTRAINT debate_teams_position_check 
  CHECK (position IN ('government', 'opposition', 'OG', 'OO', 'CG', 'CO'));

ALTER TABLE rounds ADD COLUMN IF NOT EXISTS speakers_per_team integer DEFAULT 3;
UPDATE rounds SET speakers_per_team = 3 WHERE speakers_per_team IS NULL;

-- Enable public access for participant URLs
CREATE POLICY IF NOT EXISTS "Public can view teams" ON teams FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "Public can view institutions" ON institutions FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "Public can view adjudicators" ON adjudicators FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "Public can view rooms" ON rooms FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "Public can view tournaments" ON tournaments FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "Public can view rounds" ON rounds FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "Public can view debates" ON debates FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "Public can view debate_teams" ON debate_teams FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "Public can view debate_adjudicators" ON debate_adjudicators FOR SELECT TO public USING (true);
CREATE POLICY IF NOT EXISTS "Public can view speaker_scores" ON speaker_scores FOR SELECT TO public USING (true);
```

---

## How to Use

### For Admin:

1. **Add teams** (3 speakers each)
2. **Create tournament** (defaults to AP format)
3. **Create round** with 3 motions:
   - Motion 1: (required) "THW support UBI"
   - Motion 2: (optional) "THW ban plastics"
   - Motion 3: (optional) "THW tax billionaires"
4. **Generate draw** → Creates 2-team debates
5. **See draws** → Government (green) vs Opposition (red)
6. **Share URLs** → Click Share button next to team

### For Participants:

1. **Open your private URL**
2. **See "You Are GOVERNMENT"** or **"You Are OPPOSITION"** banner
3. **See all 3 motions** with labels
4. **See your specific motion** marked
5. **See your exact opponent** (other team)
6. **See whether they're Gov or Opp**
7. **See room and judges**
8. **See your rank and stats**

---

## Visual Example

### Admin View:
```
Round 1 Debates:

┌─────────────────────────────────┐
│ Room 101 - Motion: "THW support UBI" │
├─────────────────────────────────┤
│ 🟢 GOVERNMENT: Harvard A        │
│ 🔴 OPPOSITION: Yale B           │
│ Judges: Smith (Chair), Jones    │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│ Room 102 - Motion: "THW ban plastics" │
├─────────────────────────────────┤
│ 🟢 GOVERNMENT: Princeton A      │
│ 🔴 OPPOSITION: Stanford B       │
│ Judges: Brown (Chair), White    │
└─────────────────────────────────┘
```

### Participant URL View:
```
🏛️ YOU ARE GOVERNMENT

Motions:
├── Motion 1: "THW support UBI" ✓ Your motion
├── Motion 2: "THW ban plastics"
└── Motion 3: "THW tax billionaires"

Your Opponents:
└── ⚖️ OPPOSITION: Yale B

Room: 101
Judges: Smith (Chair), Jones
```

---

## Everything is Ready! ✅

Just run the migrations and you're set!




