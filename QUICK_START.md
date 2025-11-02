# ⚡ Quick Start Guide - 5 Minutes to Your First Tournament

## Prerequisites
- Node.js installed
- Supabase account (free tier)

---

## Setup (5 minutes)

### 1. Get Supabase Credentials
```bash
# Go to supabase.com
# Create account → New Project
# Copy: Project URL & anon key
```

### 2. Create .env File
```bash
# In project root, create .env:
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### 3. Run Database Setup
```bash
# In Supabase SQL Editor, run:
# File: supabase/migrations/20251026100942_create_debate_tournament_schema.sql
# Click "Run"
```

### 4. Start App
```bash
npm install
npm run dev
# Open http://localhost:5173
```

---

## Create Tournament (2 minutes)

1. **Register as Admin**
   - Click Register
   - Role: **Admin**
   - Create account

2. **Add Demo Data** (for testing)
   - Institutions → Add "Harvard"
   - Teams → Add "Harvard A" (speakers: "Alice, Bob")
   - Teams → Add "Harvard B" (speakers: "Charlie, Dave")
   - Teams → Add "Yale A" (speakers: "Eve, Frank")
   - Teams → Add "Yale B" (speakers: "Grace, Henry")
   - Adjudicators → Add "Judge Smith" (strength: 8)
   - Rooms → Add "Room 1"
   - Rooms → Add "Room 2"

3. **Create Tournament**
   - Tournaments → Create Tournament
   - Name: "Demo Tournament"
   - Format: BP
   - Create

4. **Add Round**
   - Rounds → Create Round
   - Round #: 1
   - Name: "Round 1"
   - Motion: "THW support universal basic income"
   - Create

5. **Generate Draw**
   - Click arrow to expand Round 1
   - Click "Generate Draw"
   - Confirm
   - ✓ See debates created!

6. **Enter Results** (click any debate)
   - Team 1: 3 points, rank 1, Speaker "Alice" 78, Speaker "Bob" 75
   - Team 2: 2 points, rank 2, Speaker "Charlie" 73, Speaker "Dave" 70
   - Team 3: 1 point, rank 3, Speaker "Eve" 68, Speaker "Frank" 65
   - Team 4: 0 points, rank 4, Speaker "Grace" 63, Speaker "Henry" 60
   - Click "Save Results"

7. **Check Standings**
   - Click Standings
   - ✓ See rankings update!

**You're done! 🎉**

---

## Next Steps

- Read [HOW_TO_USE.md](./HOW_TO_USE.md) for detailed instructions
- Add more teams and rounds
- Generate draws for Round 2 (power-pairing based on Round 1 results)
- Export standings to CSV

---

## Common Commands

```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Check code
```

---

## Need Help?

- Full guide: [HOW_TO_USE.md](./HOW_TO_USE.md)
- Setup issues? Check README.md
- Database errors? Re-run SQL migration


