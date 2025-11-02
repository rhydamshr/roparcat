# 🔗 Finding Participant URLs - Quick Guide

## Where to Find Participant URLs

### Option 1: Teams Page (Recommended)

1. **Login** to the dashboard (as Admin)
2. **Click** "Teams" in the sidebar
3. **Find** the team you want to share
4. **Click** the **Share button (🔗)** in the Actions column
5. **URL is copied** to your clipboard automatically
6. **Paste and send** to the team via WhatsApp, email, etc.

### Option 2: Manual URL Construction

If you know the team ID, you can construct the URL:

```
http://localhost:5173/team/[TEAM_ID]
```

To find the team ID:
1. Go to Teams page
2. Open browser DevTools (F12)
3. Inspect the table row
4. Or check the database in Supabase

### Option 3: From Database

1. **Go to** [supabase.com](https://supabase.com)
2. **Select** your project
3. **Go to** Table Editor → teams table
4. **Find** the team
5. **Copy** the `id` field (UUID)
6. **Construct** URL: `https://yoursite.com/team/[team_id]`

## Bulk Export URLs

To get all participant URLs at once:

1. **Go to** Teams page
2. **Export CSV** (Export CSV button at top)
3. **Open** the CSV in Excel/Google Sheets
4. **Add** a new column: "Participant URL"
5. **Use formula**: `=CONCATENATE("https://yoursite.com/team/", A2)`
   - (Replace A2 with the column containing team IDs)
6. **Distribute** the URLs to teams

## What Participants See

When they open their URL, they see:

### Header Section
- Their team name
- Institution name
- Speaker names
- **Current rank**
- **Total points**
- **Average speaker score**

### Current Round Card
- **Round name** (e.g., "Round 3")
- **Motion** for the round
- **Room** they're assigned to
- **Position** (OG, OO, CG, or CO)
- **Opponent teams** in the debate
- **Adjudicators** assigned (with roles)

### Overall Standings
- Full tournament rankings
- **Their team highlighted** in blue
- Top 10 teams displayed
- Sortable by rank, points, etc.

### Round History
- List of all rounds they've completed
- Room and position for each round
- Motion for each round

## Testing Participant URLs

To test that participant URLs work:

1. **Make sure** the app is running (`npm run dev`)
2. **Create** a test team in the dashboard
3. **Click** the Share button for that team
4. **Copy** the URL (it looks like: `http://localhost:5173/team/abc-123-xyz`)
5. **Open** in a new tab or incognito window
6. **You should see** the team's private page

**Note**: Until you generate draws and enter results, some sections may be empty.

## Troubleshooting

### "Access Denied" Error
- **Check**: The team ID in the URL is correct
- **Verify**: The team exists in the database
- **Try**: Re-sharing the URL from the Teams page

### Blank or Empty Page
- **Check**: Browser console for errors (F12 → Console)
- **Verify**: Supabase connection is working
- **Ensure**: Database migration was run successfully

### URL Not Working
- **Test**: Go to Teams page, click Share button
- **Verify**: URL format is `https://yoursite.com/team/[ID]`
- **Check**: No extra characters or spaces in URL

## Example URLs

Development (local):
```
http://localhost:5173/team/123e4567-e89b-12d3-a456-426614174000
```

Production:
```
https://your-tournament.com/team/123e4567-e89b-12d3-a456-426614174000
```

## Pro Tips

💡 **Share URLs before first round** so teams know where to check draws

💡 **Update teams** when you share - they just need to refresh the page

💡 **Mobile-friendly** - participants can bookmark the URL on their phone

💡 **No login needed** - convenient for teams during tournament

💡 **Real-time updates** - when you save results, teams see updated standings automatically

---

**Need help?** Check TROUBLESHOOTING.md or the Feature Checklist!

