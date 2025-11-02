# Implementation Guide: 3 Motions Per Round

## What Needs to Be Done

### 1. Database Migration (Already Created)
File: `supabase/migrations/20251026100944_add_motions_to_rounds_and_draws.sql`

**Run this in Supabase SQL Editor** to add the new columns:
```sql
-- Add support for 3 motions per round and motion assignment to debates

-- Add motion columns to rounds table
ALTER TABLE rounds 
ADD COLUMN IF NOT EXISTS motion_1 text,
ADD COLUMN IF NOT EXISTS motion_2 text,
ADD COLUMN IF NOT EXISTS motion_3 text;

-- Add motion_id to debates table to track which motion is used
ALTER TABLE debates
ADD COLUMN IF NOT EXISTS motion_used text;

-- Update existing rounds to move motion to motion_1
UPDATE rounds SET motion_1 = motion WHERE motion IS NOT NULL;
```

### 2. Update Types (Already Done)
- ✅ Added `motion_1`, `motion_2`, `motion_3` to Round type
- ✅ Added `motion_used` to Debate type

### 3. Still Need to Update in Rounds.tsx

#### Update `handleEdit` function:
```typescript
const handleEdit = (round: Round) => {
  setEditingId(round.id);
  setFormData({
    tournament_id: round.tournament_id,
    round_number: round.round_number,
    name: round.name,
    motion_1: round.motion_1 || '',
    motion_2: round.motion_2 || '',
    motion_3: round.motion_3 || '',
    info_slide: round.info_slide || '',
    status: round.status
  });
  setShowModal(true);
};
```

#### Update `openAddModal` function:
```typescript
const openAddModal = () => {
  setEditingId(null);
  setFormData({
    tournament_id: tournamentId || '',
    round_number: rounds.length + 1,
    name: '',
    motion_1: '',
    motion_2: '',
    motion_3: '',
    info_slide: '',
    status: 'setup'
  });
  setShowModal(true);
  setError('');
};
```

#### Update form UI to show 3 motion fields:
In the modal form, replace single motion field with:

```tsx
<div className="mb-4">
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Motion 1 *
  </label>
  <textarea
    value={formData.motion_1}
    onChange={(e) => setFormData({ ...formData, motion_1: e.target.value })}
    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
    rows={2}
    placeholder="Enter first motion..."
    required
  />
</div>

<div className="mb-4">
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Motion 2
  </label>
  <textarea
    value={formData.motion_2}
    onChange={(e) => setFormData({ ...formData, motion_2: e.target.value })}
    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
    rows={2}
    placeholder="Enter second motion..."
  />
</div>

<div className="mb-4">
  <label className="block text-sm font-medium text-slate-700 mb-2">
    Motion 3
  </label>
  <textarea
    value={formData.motion_3}
    onChange={(e) => setFormData({ ...formData, motion_3: e.target.value })}
    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
    rows={2}
    placeholder="Enter third motion..."
  />
</div>
```

#### Update `generateDraw` to assign random motion:
In the draw generation loop, after creating each debate:

```typescript
// Get available motions
const motions = [
  round.motion_1,
  round.motion_2,
  round.motion_3
].filter(m => m); // Remove null/empty

// Assign random motion to debate
const randomMotion = motions[Math.floor(Math.random() * motions.length)];

const { data: debate, error: debateError } = await supabase
  .from('debates')
  .insert({
    round_id: roundId,
    room_id: availableRooms[i].id,
    motion_used: randomMotion
  })
  .select()
  .single();
```

#### Update display to show motion per debate:
In the debates display:

```tsx
{debates.map((debate) => (
  <div key={debate.id} className="border border-slate-200 rounded-lg p-4">
    <div className="flex items-center justify-between mb-3">
      <div>
        <h4 className="font-semibold text-slate-900">
          {debate.rooms?.name || 'Room TBD'}
        </h4>
        {debate.motion_used && (
          <p className="text-sm text-blue-600 mt-1 font-medium">
            {debate.motion_used}
          </p>
        )}
      </div>
      <span className={`px-2 py-1 rounded text-xs font-medium ${
        debate.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
      }`}>
        {debate.status}
      </span>
    </div>
    
    {/* Show all teams with positions */}
    <div className="grid grid-cols-4 gap-2 text-sm">
      {debate.debate_teams?.map((dt: any) => {
        const team = teams.find(t => t.id === dt.team_id);
        return (
          <div key={dt.id} className="border border-slate-200 rounded p-2">
            <div className="font-medium text-slate-900">{dt.position}</div>
            <div className="text-slate-600">{team?.name || 'Team'}</div>
          </div>
        );
      })}
    </div>
  </div>
))}
```

### 4. Update Participant URL View

In `src/pages/participant/PublicDraw.tsx`, update to show exact opponents:

```typescript
const getOpposingTeams = (debate: Debate) => {
  const others = debate.debate_teams?.filter(dt => dt.team_id !== teamId) || [];
  return others.map(dt => {
    const team = teams.find(t => t.id === dt.team_id);
    return { name: team?.name || 'Team', position: dt.position };
  });
};

// In the display:
{getOpposingTeams(currentRound).map((opp, idx) => (
  <div key={idx} className="text-sm">
    <span className="font-medium">{opp.position}:</span>{' '}
    <span className="text-slate-700">{opp.name}</span>
  </div>
))}
```

## Quick Implementation Steps

1. ✅ Run the SQL migration
2. ✅ Types updated
3. ⚠️ Update Rounds.tsx:
   - Update handleEdit
   - Update openAddModal  
   - Update form UI (3 motion fields)
   - Update generateDraw to assign motions
   - Update debate display to show motion
4. ⚠️ Update PublicDraw.tsx to show exact opponents

## Test After Implementation

1. Create a round with 3 motions
2. Generate a draw
3. Check each debate has different motion
4. Check participant URL shows exact opponents
5. Check admin can see all opponents clearly

