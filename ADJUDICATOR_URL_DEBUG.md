# Adjudicator Private URL Debug Guide

## Current Issue
Adjudicators are getting "Access Denied" when trying to access their private URLs.

## Debug Steps

### 1. **Check Browser Console**
1. Open the adjudicator URL in your browser
2. Press F12 to open Developer Tools
3. Go to Console tab
4. Look for error messages and log output
5. The updated code now shows detailed logging

### 2. **Test Database Access**
Run this SQL in your Supabase SQL Editor:

```sql
-- Test if adjudicator exists
SELECT id, name FROM adjudicators LIMIT 5;

-- Test public access (replace with actual adjudicator ID)
SELECT id, name FROM adjudicators WHERE id = 'YOUR_ADJUDICATOR_ID_HERE';

-- Test if debate_adjudicators is accessible
SELECT * FROM debate_adjudicators LIMIT 5;
```

### 3. **Verify RLS Policies**
Make sure these policies exist in your Supabase project:

```sql
-- Check existing policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('adjudicators', 'debate_adjudicators', 'debates', 'debate_teams', 'teams', 'rooms', 'rounds');
```

### 4. **Common Issues & Solutions**

#### Issue A: RLS Policies Not Applied
**Solution**: Run the complete SQL migration:
```sql
-- Add public access policies
CREATE POLICY "Public can view adjudicators"
  ON adjudicators FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view debate_adjudicators"
  ON debate_adjudicators FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view debates"
  ON debates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view debate_teams"
  ON debate_teams FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view teams"
  ON teams FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view rooms"
  ON rooms FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can view rounds"
  ON rounds FOR SELECT
  TO public
  USING (true);
```

#### Issue B: No Debates Assigned
**Solution**: 
1. Create a tournament
2. Create a round
3. Generate draws (this assigns adjudicators to debates)

#### Issue C: Wrong Adjudicator ID
**Solution**: 
1. Go to Adjudicators page in admin
2. Click the Share button next to an adjudicator
3. Use the copied URL

### 5. **Test the Complete Flow**

1. **Create Test Data**:
   ```sql
   -- Insert test adjudicator
   INSERT INTO adjudicators (name, strength) 
   VALUES ('Test Adjudicator', 8.0) 
   RETURNING id, name;
   ```

2. **Create Test Debate Assignment**:
   ```sql
   -- First create a tournament, round, and debate
   -- Then assign the adjudicator
   INSERT INTO debate_adjudicators (debate_id, adjudicator_id, role)
   VALUES ('DEBATE_ID', 'ADJUDICATOR_ID', 'chair');
   ```

3. **Test the URL**:
   - Use the adjudicator ID from step 1
   - Visit: `http://localhost:5175/adjudicator/ADJUDICATOR_ID`

### 6. **Expected Behavior**

**If Working Correctly**:
- Shows adjudicator name
- Shows debate assignment (room, teams, motions)
- Shows score entry form

**If No Debates Assigned**:
- Shows "No Active Debates" message
- Shows adjudicator name

**If Access Denied**:
- Shows error message with details
- Shows adjudicator ID for debugging

### 7. **Quick Fix Commands**

If you just want to get it working quickly:

1. **Run this SQL in Supabase**:
```sql
-- Quick fix: Add all necessary public policies
CREATE POLICY IF NOT EXISTS "Public can view adjudicators"
  ON adjudicators FOR SELECT TO public USING (true);

CREATE POLICY IF NOT EXISTS "Public can view debate_adjudicators"
  ON debate_adjudicators FOR SELECT TO public USING (true);

CREATE POLICY IF NOT EXISTS "Public can view debates"
  ON debates FOR SELECT TO public USING (true);

CREATE POLICY IF NOT EXISTS "Public can view debate_teams"
  ON debate_teams FOR SELECT TO public USING (true);

CREATE POLICY IF NOT EXISTS "Public can view teams"
  ON teams FOR SELECT TO public USING (true);

CREATE POLICY IF NOT EXISTS "Public can view rooms"
  ON rooms FOR SELECT TO public USING (true);

CREATE POLICY IF NOT EXISTS "Public can view rounds"
  ON rounds FOR SELECT TO public USING (true);
```

2. **Refresh your website**

3. **Test with an adjudicator URL**

The updated code now provides much better error messages and debugging information!
