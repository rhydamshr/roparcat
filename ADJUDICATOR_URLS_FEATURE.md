# Adjudicator Private URLs Feature

## Overview
This feature allows adjudicators to access a private URL where they can view their debate assignments and enter speaker scores and results.

## Features

### 1. **Adjudicator Dashboard**
- Each adjudicator gets a unique URL: `/adjudicator/:adjudicatorId`
- Shows current/upcoming debate assignment
- Displays:
  - Round name
  - Room assignment
  - All 3 motions
  - Teams participating (Government & Opposition)
  - Speaker names for each team

### 2. **Score Entry**
- Adjudicators can enter speaker scores (60-100) for each speaker
- Input fields displayed next to each speaker's name
- Scores entered in real-time

### 3. **Winner Selection**
- Adjudicators select the winning team (Government or Opposition)
- Visual toggle buttons for selection
- Required before submission

### 4. **Result Submission**
- When "Submit Results" is clicked:
  - Speaker scores saved to `speaker_scores` table
  - Team points (Win=1, Loss=0) saved to `debate_teams`
  - Total speaks calculated and saved
  - Team rankings assigned (1 or 2)
  - Debate marked as "completed"
  - **Standings automatically updated** via database trigger

### 5. **Standings Integration**
The database has an automatic trigger that updates team standings when debate results are submitted:
- Total points calculated from all debate wins
- Total speaks aggregated across all rounds
- Rounds count maintained
- These updates automatically reflect in the Standings page

## URL Generation

### For Admins
1. Navigate to **Adjudicators** page in dashboard
2. Click the blue **Share** button (📤) next to any adjudicator
3. URL is copied to clipboard
4. Send URL to the adjudicator

### For Adjudicators
1. Receive their unique URL from admin
2. Open in browser
3. View their debate assignment
4. Enter scores and submit results

## Technical Implementation

### Files Modified/Created

1. **`src/pages/participant/AdjudicatorDebate.tsx`** (NEW)
   - Adjudicator interface component
   - Displays debate info and accepts score input
   - Handles result submission

2. **`src/App.tsx`**
   - Added route: `/adjudicator/:adjudicatorId`

3. **`src/pages/dashboard/Adjudicators.tsx`**
   - Added "Share URL" button with copy functionality
   - Shows checkmark when URL is copied

4. **`supabase/migrations/20251026100946_update_speaker_scores_for_ap.sql`**
   - Updates `speaker_scores` table to support 3 positions (AP format)

### Database Changes

**Automatic Standings Update:**
A database trigger (`update_team_standings`) automatically updates the `teams` table when `debate_teams` is updated with:
- `total_points`: Sum of all points from debates
- `total_speaks`: Sum of all speaker scores
- `rounds_count`: Number of debates participated in

This ensures standings are always up-to-date without manual intervention.

## Usage Flow

1. **Admin generates draws** in Rounds page
2. **Admin shares adjudicator URLs** from Adjudicators page
3. **Adjudicators receive URLs** and open them
4. **Adjudicators enter scores** and select winner
5. **Adjudicators submit results**
6. **Standings update automatically** for everyone to see

## Security

- Adjudicator URLs are public (no authentication required)
- Anyone with the URL can access and submit results
- Only pending/current debates are shown
- Completed debates are not shown

## Limitations

- Currently shows only the most recent pending debate
- No history of past debates shown
- No ability to edit submitted results (would require additional feature)


