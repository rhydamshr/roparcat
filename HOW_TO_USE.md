# How to Use Tabbycat Clone - Step-by-Step Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click "New Project"
3. Create a project (name: "debate-tournament")
4. Wait for database setup (30 seconds)
5. Go to **Settings > API**
6. Copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon public key** (starts with `eyJ...`)

### Step 3: Create .env File

Create a file named `.env` in the project root:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```
*Replace with your actual values from Supabase*

### Step 4: Run Database Migration

1. In Supabase dashboard, click **SQL Editor**
2. Click **New Query**
3. Open file `supabase/migrations/20251026100942_create_debate_tournament_schema.sql`
4. Copy ALL the SQL code and paste into Supabase SQL Editor
5. Click **Run** (green button)
6. Wait for "Success" message

### Step 5: Start the App
```bash
npm run dev
```
Open `http://localhost:5173`

---

## 🎯 Creating Your First Tournament (10 minutes)

### Step 1: Create Admin Account

1. On the login page, click **Register**
2. Fill in:
   - Full Name: Your Name
   - Email: your@email.com
   - Password: (at least 6 characters)
   - **Role: Select "Admin"**
3. Click "Create Account"
4. You'll be redirected to dashboard

### Step 2: Add Institutions

1. Click **Institutions** in the sidebar
2. Click **Add Institution** button
3. Enter:
   - Name: "Harvard University"
   - Code: "HRV" (optional)
4. Click **Add**
5. Repeat for other institutions:
   - "Oxford University" (Code: "OXF")
   - "Cambridge University" (Code: "CAM")
   - "Yale University" (Code: "YAL")

### Step 3: Add Teams

1. Click **Teams** in sidebar
2. Click **Add Team**
3. For each team, enter:
   - **Team Name**: "Harvard A" (or "Harvard 1")
   - **Institution**: Select "Harvard University"
   - **Speakers**: Add names like "John Doe, Jane Smith"
4. Click **Add**
5. Repeat for all teams (minimum 4 teams per debate)

**Or use CSV import:**
1. Create Excel/Google Sheets with columns:
   - Team: Harvard A
   - Institution: Harvard University
   - Speakers: John Doe, Jane Smith
2. Save as CSV
3. Click **Import CSV** on Teams page
4. Select your CSV file

**Share Participant URLs:**
- After adding a team, click the **Share** button (🔗) next to the team
- Copy the unique URL
- Send to team members so they can view their:
  - Current draw and motion
  - Room assignment
  - Opponents
  - Overall standings
  - Round history

### Step 4: Add Adjudicators

1. Click **Adjudicators** in sidebar
2. Click **Add Adjudicator**
3. Enter:
   - **Name**: Judge's full name
   - **Institution**: (optional)
   - **Strength**: 1-10 (5 is average, 7+ is experienced)
   - **Email**: (optional)
4. Click **Add**
5. Add at least 3-4 adjudicators

### Step 5: Add Rooms

1. Click **Rooms** in sidebar
2. Click **Add Room**
3. Enter:
   - **Room Name**: "Room 101"
   - **Capacity**: 20 (default)
4. Click **Add**
5. Add enough rooms for your debates (1 room per debate)

### Step 6: Create Tournament

1. Click **Tournaments** in sidebar
2. Click **Create Tournament**
3. Fill in:
   - **Name**: "2024 Open Championship"
   - **Format**: Select "BP" (British Parliamentary)
   - **Start Date**: Today's date
   - **End Date**: Tomorrow or later
   - **Status**: "Setup"
4. Click **Create**

### Step 7: Create Rounds

1. Click **Tournaments** → select your tournament
2. Or go directly to **Rounds** page
3. Click **Create Round**
4. Fill in:
   - **Tournament**: Your tournament
   - **Round Number**: 1
   - **Round Name**: "Round 1" or "Preliminary 1"
   - **Motion**: "THW support universal basic income"
   - **Info Slide**: "Each team has 7 minutes to prepare"
   - **Status**: "Setup"
5. Click **Create**
6. Repeat to create more rounds (Round 2, Round 3, etc.)

---

## 🎲 Generating the Draw (Automated!)

### Step 1: Generate Pairings

1. Go to **Rounds** page
2. Find your round (e.g., "Round 1")
3. Click the **arrow** to expand the round
4. Click **"Generate Draw"** button
5. Confirm when prompted
6. The system will:
   - Pair teams by similar point totals
   - Assign positions (OG, OO, CG, CO)
   - Assign 3 adjudicators per debate
   - Allocate rooms

### Step 2: Review the Draw

- Expand the round to see all debates
- Each card shows:
  - **Room**: Where debate happens
  - **Teams**: All 4 teams with positions
  - **Judges**: Chair + Panelists
- Make adjustments if needed (manual edit coming in future versions)

---

## 📝 Entering Debate Results

### Step 1: Find Your Debate

1. Go to **Rounds** page
2. Expand the round (click arrow next to round name)
3. Find the debate you're tabbing
4. Click on the debate card

### Step 2: Enter Results

For each team in the debate:

1. **Points**: 
   - 1st place: **3 points**
   - 2nd place: **2 points**
   - 3rd place: **1 point**
   - 4th place: **0 points**
   
2. **Rank**: Enter 1, 2, 3, or 4

3. **Speaker Names**: 
   - Type first speaker name
   - Enter their score (60-100)
   - Type second speaker name
   - Enter their score

### Step 3: Save Results

1. Click **"Save Results"** button at top of debate card
2. Results are saved and standings update automatically!
3. Repeat for all debates in the round

---

## 📊 Viewing Standings

1. Click **Standings** in sidebar
2. Switch between tabs:
   - **Teams**: Overall tournament rankings
   - **Speakers**: Individual speaker rankings
   - **Adjudicators**: Judge statistics
3. Rankings update in real-time as you enter results!
4. Click **Export CSV** to download spreadsheet

---

## 🎯 Complete Tournament Workflow

### Preparation Phase
1. ✅ Add all institutions
2. ✅ Register all teams with speakers
3. ✅ Add all adjudicators
4. ✅ Setup all rooms
5. ✅ Create tournament
6. ✅ Create Round 1

### Round 1
1. Click "Generate Draw" for Round 1
2. Print or share draw with teams
3. Debates happen
4. Enter all results
5. Check standings

### Round 2
1. Create Round 2 (different motion)
2. Generate draw - system uses Round 1 results for power-pairing!
3. Run debates
4. Enter results
5. Standings update

### Rounds 3, 4, 5...
Repeat the same process! After each round, standings auto-update.

### Finals
1. After all prelim rounds complete
2. Create "Quarter Finals" round
3. System pairs highest-ranked teams
4. Generate draws (usually 4 debates = 16 teams)
5. Enter results
6. Continue with Semi-Finals, Finals

---

## 🔗 Participant URLs - Private Access for Teams

### What are Participant URLs?

Each team gets a **unique private URL** where they can access:
- ✅ Their current round draw and motion
- ✅ Room assignment and position
- ✅ Opponent teams
- ✅ Adjudicator panel
- ✅ Their rank and stats
- ✅ Overall tournament standings
- ✅ Round history

**This is private - only that team can see their specific information!**

### How to Share URLs

1. **Go to Teams page**
2. **Click the Share button (🔗)** next to any team
3. **URL is copied to clipboard**
4. **Send to team via WhatsApp, email, etc.**

Example URL: `https://yoursite.com/team/abc123xyz`

### What Participants See

When they open their URL:
- **Header**: Their team name, institution, speakers, current rank, points, average speaks
- **Current Round**: Motion, room, position (OG/OO/CG/CO), opponents, judges
- **Standings**: Overall tournament rankings with their position highlighted
- **History**: List of all rounds they've competed in

### Security

- ✅ URLs are unique per team
- ✅ No login required (convenient for participants)
- ✅ Teams can only see their own draws (not other team's private info)
- ✅ Standings are public to all participants (for transparency)
- ✅ Works on mobile devices (responsive design)

### Distributing URLs

**Option 1: Manual**
- Share each team's URL individually via messaging

**Option 2: Bulk Export**
- Export teams to CSV
- Add a "Participant URL" column
- Use formula: `=CONCATENATE("https://yoursite.com/team/", team_id_column)`
- Share CSV with team captains

**Option 3: Email Campaign**
- Copy all URLs
- Send tournament update emails with unique links

## 💡 Tips & Tricks

### Motion Ideas
- **Motion**: Always start with "THW" (This House Would)
- Examples:
  - "THW support universal basic income"
  - "THW ban single-use plastics"
  - "THW implement wealth tax for billionaires"
  - "THW provide free university education"

### Speaker Scores
- Range: 60-100
- Typical scores:
  - 63-67: Below average
  - 68-72: Average
  - 73-77: Good
  - 78-82: Very good
  - 83+: Excellent

### Break Calculation
After all preliminary rounds, teams break based on:
1. **Total Points** (primary)
2. **Average Speaker Score** (tiebreaker)
3. **Total Speaker Score** (if still tied)

---

## 🆘 Common Issues & Solutions

### "Missing Supabase environment variables"
- Create `.env` file in project root
- Add your Supabase URL and key

### "Error creating profile"
- Make sure SQL migration ran successfully in Supabase

### "Can't generate draw"
- Need minimum 4 teams
- Need at least 1 room
- Need at least 1 adjudicator

### "Results not saving"
- Make sure you're logged in
- Check browser console for errors
- Verify database permissions

### "CSV import failed"
- Check CSV has these columns: Team, Institution, Speakers
- Institution names must match existing institutions
- Speakers should be comma-separated

---

## 🎬 Quick Start Demo (30 seconds)

**Pre-setup Tournament:**
1. Login as admin
2. Click "Institutions" → Add "Demo University"
3. Click "Teams" → Add "Team A" with speakers "Alice, Bob"
4. Click "Teams" → Add "Team B" with speakers "Charlie, Dave"  
5. Click "Rooms" → Add "Room 1"
6. Click "Adjudicators" → Add "Judge Smith" (strength: 8)
7. Click "Tournaments" → Create "Demo Tournament" (BP format)
8. Click "Rounds" → Create Round 1
9. Click "Generate Draw"
10. Click arrow to expand → See debate paired!
11. Click debate → Enter results → Click "Save Results"
12. Click "Standings" → See rankings!

**That's it! You're running a tournament! 🎉**

---

## 📞 Need Help?

- Check browser console for error messages
- Verify all database migrations ran
- Make sure you're logged in as Admin
- Ensure Supabase project is active

**Happy Debating! 🏆**

