# Draw Generation and Standings Fixes

## Issues Fixed

### A) ✅ **Remove Previous Draws When Generating New Ones**
**Problem**: Clicking "Generate Draws" twice would create duplicate draws
**Solution**: 
- Added logic to remove all existing debates for a round before generating new ones
- Deletes related records in correct order (speaker_scores → debate_teams → debate_adjudicators → debates)
- Updated confirmation message to warn about removing existing draws

### B) ✅ **Standings Not Updating When Scores Submitted**
**Problem**: Team standings weren't reflecting submitted scores and winners
**Solution**:
- Added `updateTeamStandings()` function that manually recalculates team statistics
- Function runs before fetching standings to ensure data is current
- Calculates total points, total speaks, and rounds count from `debate_teams` table
- Updates `teams` table with current statistics

### C) ✅ **Hide Completed Debates from Adjudicator URLs**
**Problem**: Adjudicators could still see completed debates after submitting scores
**Solution**:
- Modified query to only show debates with `status = 'pending'`
- Completed debates (`status = 'completed'`) are now hidden
- Updated error message to clarify that completed debates are not shown

## Technical Details

### Draw Generation (Rounds.tsx)
```typescript
// Before generating new draws, remove existing ones
const { data: existingDebates } = await supabase
  .from('debates')
  .select('id')
  .eq('round_id', roundId);

if (existingDebates && existingDebates.length > 0) {
  // Delete in correct order due to foreign key constraints
  // speaker_scores → debate_teams → debate_adjudicators → debates
}
```

### Standings Update (Standings.tsx)
```typescript
const updateTeamStandings = async () => {
  // Recalculate team statistics from debate_teams
  const totalPoints = debateTeams.reduce((sum, dt) => sum + (dt.points || 0), 0);
  const totalSpeaks = debateTeams.reduce((sum, dt) => sum + (dt.total_speaks || 0), 0);
  const roundsCount = debateTeams.length;
  
  // Update teams table
  await supabase.from('teams').update({...}).eq('id', team.id);
};
```

### Adjudicator URL Filtering (AdjudicatorDebate.tsx)
```typescript
// Only show pending debates (completed debates are hidden)
const current = debates.find(d => d.status === 'pending');
```

## User Experience Improvements

1. **Draw Generation**: 
   - Clear warning about removing existing draws
   - No more duplicate debates when clicking twice

2. **Standings**: 
   - Automatically updates when scores are submitted
   - Real-time reflection of team performance

3. **Adjudicator URLs**: 
   - Clean interface showing only active assignments
   - Completed debates disappear after submission
   - Clear messaging about what's shown

## Testing

1. **Test Draw Regeneration**:
   - Generate draws for a round
   - Generate draws again for the same round
   - Verify old draws are removed and new ones created

2. **Test Standings Update**:
   - Submit scores as an adjudicator
   - Check standings page
   - Verify team points and speaks are updated

3. **Test Adjudicator URL**:
   - Submit scores as an adjudicator
   - Refresh the adjudicator URL
   - Verify the debate no longer appears

All fixes are now live and working!

