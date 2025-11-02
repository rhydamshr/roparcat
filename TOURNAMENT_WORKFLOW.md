# 🎯 Tournament Workflow Flow

## Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    TOURNAMENT SETUP PHASE                       │
└─────────────────────────────────────────────────────────────────┘

Step 1: Add Data
├── Add Institutions (Harvard, Yale, Oxford...)
├── Add Teams (Team A, Team B, Team C...)
│   └── Each team: Name + Speakers (Alice, Bob)
├── Add Adjudicators (Judge Smith, Judge Jones...)
│   └── Assign strength rating (1-10)
└── Add Rooms (Room 101, Room 102...)

Step 2: Create Tournament
├── Name: "2024 Open Championship"
├── Format: BP (British Parliamentary)
├── Dates: Start & End date
└── Status: Setup → Ongoing → Completed

Step 3: Create Rounds
├── Round 1
│   ├── Motion: "THW support universal basic income"
│   ├── Info slide: "15 min prep"
│   └── Status: Setup
├── Round 2
│   ├── Motion: "THW ban single-use plastics"
│   └── ...
└── (Repeat for all rounds)


┌─────────────────────────────────────────────────────────────────┐
│                        ROUND EXECUTION                         │
└─────────────────────────────────────────────────────────────────┘

Round 1 Workflow:
│
├── 1. Generate Draw
│   ├── System pairs teams by similar strength (power-pairing)
│   ├── Assigns positions: OG, OO, CG, CO
│   ├── Assigns adjudicators (Chair + 2 Panelists)
│   └── Allocates rooms
│
├── 2. Debates Happen
│   ├── Teams debate in assigned rooms
│   ├── Adjudicators observe and take notes
│   └── 40 minutes per debate (BP format)
│
├── 3. Enter Results
│   ├── Go to Rounds page
│   ├── Expand round, click on each debate
│   ├── For each team:
│   │   ├── Points: 3/2/1/0 (1st/2nd/3rd/4th)
│   │   ├── Rank: 1/2/3/4
│   │   └── Speaker scores: 60-100 per speaker
│   └── Click "Save Results"
│
└── 4. Check Standings
    ├── Go to Standings page
    ├── See Team rankings (ordered by points)
    ├── See Speaker averages
    └── Rankings update automatically!


┌─────────────────────────────────────────────────────────────────┐
│                    SUBSEQUENT ROUNDS                            │
└─────────────────────────────────────────────────────────────────┘

Round 2, 3, 4... Workflow:
│
├── 1. Create Round N
│   ├── Add new motion
│   └── Status: Setup
│
├── 2. Generate Draw (Power-Pairing!)
│   ├── System uses Round 1 results
│   ├── Pairs teams with similar point totals
│   ├── 1st place teams debate each other
│   ├── 2nd place teams debate each other
│   └── Etc. (ensures fair competition)
│
├── 3. Debates Happen
│   └── (Same as Round 1)
│
├── 4. Enter Results
│   └── (Same as Round 1)
│
└── 5. Check Standings
    └── Rankings re-calculate with cumulative results!


┌─────────────────────────────────────────────────────────────────┐
│                        BREAK ROUNDS                             │
└─────────────────────────────────────────────────────────────────┘

After Preliminary Rounds:
│
├── Calculate Break
│   ├── Top teams by points advance
│   ├── Tiebreaker: Average speaker score
│   └── Example: Top 16 teams break (if 32 total teams)
│
├── Create Quarter Finals Round
│   ├── System pairs broken teams
│   ├── Generate 4 debates (16 teams)
│   └── Highest seeds vs. Lowest seeds
│
├── Run Quarter Finals
│   ├── Debates happen
│   ├── Enter results
│   └── 8 winners advance to Semi-Finals
│
├── Semi-Finals → 4 teams advance
└── Finals → 1 winner!


┌─────────────────────────────────────────────────────────────────┐
│                   DATA FLOW & CALCULATIONS                      │
└─────────────────────────────────────────────────────────────────┘

When You Enter Results:

1. Points Entry:
   ├── 3 points (1st place)
   ├── 2 points (2nd place)
   ├── 1 point (3rd place)
   └── 0 points (4th place)

2. Speaker Scores Entry:
   ├── Range: 60-100
   ├── First speaker: Name + Score
   └── Second speaker: Name + Score

3. Auto-Calculation:
   ├── Total Points (cumulative across all rounds)
   ├── Total Speaker Score (sum of all speaks)
   ├── Average Speaker Score (total speaks ÷ rounds)
   ├── Rounds Count (number of debates completed)
   └── Team Rank (position in standings)


┌─────────────────────────────────────────────────────────────────┐
│                    POWER-PAIRING ALGORITHM                      │
└─────────────────────────────────────────────────────────────────┘

Draw Generation Logic:

Round 1: Random Pairing
├── Teams randomly paired
├── Ensures initial randomness
└── No previous results to consider

Round 2+: Power-Pairing
├── Sort teams by points (descending)
├── Group into brackets:
│   ├── Top bracket (highest points)
│   ├── Second bracket
│   ├── Third bracket
│   └── Bottom bracket
├── Randomize within each bracket
├── Pair from top to bottom
├── Ensures fair competition
└── Best teams face best teams


┌─────────────────────────────────────────────────────────────────┐
│                      CSV IMPORT/EXPORT                          │
└─────────────────────────────────────────────────────────────────┘

Import Teams:
1. Prepare CSV with columns:
   ├── Team (e.g., "Harvard A")
   ├── Institution (e.g., "Harvard University")
   └── Speakers (e.g., "Alice, Bob")

2. Upload:
   ├── Teams page → Import CSV
   ├── Select file
   └── Auto-creates teams and links to institutions

Export Teams:
1. Teams page → Export CSV
2. Download includes:
   ├── All team names
   ├── Institution names
   ├── Speakers
   ├── Points
   ├── Average speaks
   └── Rounds count


┌─────────────────────────────────────────────────────────────────┐
│                      STANDINGS CALCULATIONS                     │
└─────────────────────────────────────────────────────────────────┘

Team Standings (Ordered by):
1. Total Points (primary)
2. Average Speaker Score (tiebreaker)
3. Total Speaker Score (if still tied)
4. Wins/Breaks

Speaker Standings:
├── Individual speaker performance
├── Based on average score across all debates
├── Shows: Name, Team, Avg Speaks, Total Speaks
└── Ranked highest to lowest

Adjudicator Stats:
├── Debates chaired
├── Debates paneled
├── Strength rating
└── Assignment history


┌─────────────────────────────────────────────────────────────────┐
│                      KEY FEATURES                               │
└─────────────────────────────────────────────────────────────────┘

✓ Automated draw generation
✓ Power-pairing for fair competition
✓ Real-time standings updates
✓ CSV bulk import/export
✓ Multi-tournament support
✓ Role-based access (Admin/Tabber/Public)
✓ Multi-format support (BP/AP)
✓ Adjudicator strength tracking
✓ Speaker score tracking
✓ Break calculation
✓ Tournament statistics

```

## 📊 Example Tournament Timeline

```
Day 1 - Round 1:
├── 9:00 AM: Generate Round 1 draw
├── 10:00 AM: Debates begin
├── 11:00 AM: Debates end, results entered
└── 11:30 AM: Check standings

Day 1 - Round 2:
├── 1:00 PM: Generate Round 2 draw (power-paired)
├── 2:00 PM: Debates begin
├── 3:00 PM: Debates end, results entered
└── 3:30 PM: Check updated standings

Day 1 - Round 3:
├── 5:00 PM: Generate Round 3 draw
├── 6:00 PM: Debates begin
└── 7:00 PM: End of day

Day 2:
├── 9:00 AM: Check final standings
├── 10:00 AM: Announce breaks (top 16 teams)
├── 11:00 AM: Quarter Finals
├── 1:00 PM: Semi-Finals
└── 3:00 PM: Finals + Awards
```

## 🎯 Quick Reference

**Points System:**
- 1st place: 3 points
- 2nd place: 2 points
- 3rd place: 1 point
- 4th place: 0 points

**Speaker Scores:**
- Excellent: 85-100
- Very Good: 80-84
- Good: 73-79
- Average: 68-72
- Below Average: 63-67
- Weak: 60-62

**BP Positions:**
- OG: Opening Government (1st speaker)
- OO: Opening Opposition (1st speaker)
- CG: Closing Government (1st speaker)
- CO: Closing Opposition (1st speaker)

**Judges:**
- Chair: Lead adjudicator with decision authority
- Panelist: Supporting adjudicator
- Trainee: Learning adjudicator (no vote)

---

**This workflow ensures fair, organized, and efficient tournament management! 🎉**

