# Standings and Status Update Fixes

## Problems Fixed

### ❌ **Problem A**: Standings not updating after adjudicator submission
- **Issue**: When adjudicators submit scores, team standings don't update in admin page or team private URLs
- **Root Cause**: The `updateTeamStandings` function wasn't being called properly

### ❌ **Problem B**: Debate status not showing as completed
- **Issue**: After adjudicator submission, debates still show as "pending" in admin rounds page
- **Root Cause**: Database update might not be working or page not refreshing

## Solutions Applied

### ✅ **Enhanced Debugging**
- **Added detailed console logs** to track the update process
- **Added error handling** for database operations
- **Added success confirmations** for each step

### ✅ **Improved Database Updates**
- **Enhanced `updateTeamStandings` function** with better error handling
- **Added debugging logs** to track team updates
- **Added error checking** for debate status updates

### ✅ **Added Refresh Button**
- **Added manual refresh button** to rounds page
- **Allows manual refresh** to see updated data
- **Helps with testing** and debugging

## Code Changes

### Enhanced `updateTeamStandings` Function:
```typescript
const updateTeamStandings = async () => {
  try {
    console.log('Starting team standings update...');
    
    // Get all teams
    const { data: teams } = await supabase
      .from('teams')
      .select('id');

    if (!teams) {
      console.log('No teams found');
      return;
    }

    console.log(`Found ${teams.length} teams to update`);

    // Update each team's standings
    for (const team of teams) {
      // Get total points and speaks from debate_teams
      const { data: debateTeams } = await supabase
        .from('debate_teams')
        .select('points, total_speaks')
        .eq('team_id', team.id);

      if (debateTeams) {
        const totalPoints = debateTeams.reduce((sum, dt) => sum + (dt.points || 0), 0);
        const totalSpeaks = debateTeams.reduce((sum, dt) => sum + (dt.total_speaks || 0), 0);
        const roundsCount = debateTeams.length;

        console.log(`Team ${team.id}: ${totalPoints} points, ${totalSpeaks} speaks, ${roundsCount} rounds`);

        // Update team record
        const { error } = await supabase
          .from('teams')
          .update({
            total_points: totalPoints,
            total_speaks: totalSpeaks,
            rounds_count: roundsCount
          })
          .eq('id', team.id);

        if (error) {
          console.error(`Error updating team ${team.id}:`, error);
        }
      }
    }
    
    console.log('Team standings update completed');
  } catch (error) {
    console.error('Error updating team standings:', error);
  }
};
```

### Enhanced Debate Status Update:
```typescript
// Mark debate as completed
console.log('Marking debate as completed:', currentDebate.id);
const { error: debateError } = await supabase
  .from('debates')
  .update({ status: 'completed' })
  .eq('id', currentDebate.id);

if (debateError) {
  console.error('Error marking debate as completed:', debateError);
} else {
  console.log('Debate marked as completed successfully');
}
```

### Added Refresh Button to Rounds Page:
```typescript
<div className="flex gap-3">
  <button
    onClick={fetchData}
    className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
  >
    <RefreshCw className="w-5 h-5" />
    Refresh
  </button>
  {/* ... other buttons */}
</div>
```

## Debugging Tools Added

### 1. **Console Logging**
- Track when standings update starts
- Log each team's calculated points/speaks
- Show success/error messages for each operation

### 2. **Error Handling**
- Catch and log database errors
- Show specific error messages
- Continue processing even if one team fails

### 3. **Manual Refresh**
- Added refresh button to rounds page
- Allows manual data refresh
- Helps verify updates are working

## Testing Steps

### 1. **Test Adjudicator Submission**
1. Go to adjudicator private URL
2. Enter speaker scores and select winner
3. Submit results
4. Check browser console for debug logs
5. Verify success messages

### 2. **Test Standings Update**
1. Go to admin standings page
2. Check if team points/speaks are updated
3. If not, click refresh button
4. Verify standings reflect submitted results

### 3. **Test Debate Status**
1. Go to admin rounds page
2. Expand the round with submitted debate
3. Check if debate shows as "completed"
4. If not, click refresh button
5. Verify status is updated

### 4. **Test Team Private URLs**
1. Go to team private URL
2. Check if standings are updated
3. Verify points/speaks reflect submitted results

## Debug SQL Script

Created `DEBUG_STANDINGS_UPDATE.sql` with queries to:
- Check database schema
- Verify current data
- Test updates manually
- Check RLS policies

## Expected Behavior

### ✅ **After Adjudicator Submission**
1. **Console shows**: "Starting team standings update..."
2. **Console shows**: "Marking debate as completed: [debate-id]"
3. **Console shows**: "Team [id]: [points] points, [speaks] speaks, [rounds] rounds"
4. **Console shows**: "Team standings update completed"
5. **Alert shows**: "Results saved successfully! Standings updated."

### ✅ **In Admin Pages**
1. **Rounds page**: Debate shows as "completed" (green badge)
2. **Standings page**: Team points/speaks are updated
3. **Team URLs**: Show updated standings

### ✅ **If Issues Persist**
1. **Check browser console** for error messages
2. **Click refresh button** on rounds page
3. **Run debug SQL script** to check database
4. **Verify RLS policies** are correct

## Next Steps

If the issues persist after these fixes:

1. **Check browser console** for specific error messages
2. **Run the debug SQL script** in Supabase
3. **Verify RLS policies** allow updates
4. **Check if database columns exist** and have correct types
5. **Test with a simple manual update** to verify database access

The enhanced debugging should help identify exactly where the issue is occurring!


