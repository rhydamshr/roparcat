import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useParams } from 'react-router-dom';
import { MapPin, Award, Save, Gavel } from 'lucide-react';

type Debate = {
  id: string;
  round_id: string;
  room_id: string | null;
  motion_used: string | null;
  status: 'pending' | 'completed';
  created_at?: string;
  rooms?: { name: string };
  rounds?: {
    id: string;
    name: string;
    motion_1: string | null;
    motion_2: string | null;
    motion_3: string | null;
    round_number?: number;
  };
  debate_teams?: {
    id: string;
    team_id: string;
    position: string;
    points: number;
    total_speaks: number;
    rank: number | null;
    teams?: {
      name: string;
      speaker_names: string[];
    };
    speaker_scores?: {
      id: string;
      position: number;
      score: number;
      speaker_name: string;
    }[];
  }[];
};

type Adjudicator = {
  id: string;
  name: string;
};

export default function AdjudicatorDebate() {
  const { adjudicatorId } = useParams<{ adjudicatorId: string }>();
  const [adjudicator, setAdjudicator] = useState<Adjudicator | null>(null);
  const [currentDebate, setCurrentDebate] = useState<Debate | null>(null);
  const [pastDebates, setPastDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [speakerScores, setSpeakerScores] = useState<Record<string, Record<string, number>>>({});
  const [pastScores, setPastScores] = useState<Record<string, Record<string, number>>>({});
  const [winner, setWinner] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, [adjudicatorId]);

  const fetchData = async () => {
    try {
      console.log('Fetching data for adjudicator:', adjudicatorId);
      
      // Fetch adjudicator info
      const { data: adjData, error: adjError } = await supabase
        .from('adjudicators')
        .select('*')
        .eq('id', adjudicatorId)
        .single();

      console.log('Adjudicator data:', adjData, 'Error:', adjError);
      
      if (adjError) {
        console.error('Adjudicator fetch error:', adjError);
        throw adjError;
      }
      setAdjudicator(adjData);

      // Fetch current/upcoming debates for this adjudicator
      const { data: debatesData, error: debatesError } = await supabase
        .from('debate_adjudicators')
        .select(`
          *,
          debates(
            *,
            rooms(name),
            rounds(*, motion_1, motion_2, motion_3),
            debate_teams(*, teams(name, speaker_names), speaker_scores(*))
          )
        `)
        .eq('adjudicator_id', adjudicatorId)
        .neq('debates.rounds.status', 'setup');

      console.log('Debates data:', debatesData, 'Error:', debatesError);
      
      if (debatesError) {
        console.error('Debates fetch error:', debatesError);
        throw debatesError;
      }

      // Find most recent pending or current debate
      const debates = debatesData
        .map(da => da.debates)
        .filter(Boolean) as Debate[];

      console.log('Filtered debates:', debates);

      // Sort by debate creation time (most recent first)
      debates.sort((a, b) => {
        const aTime = new Date(a.created_at || 0).getTime();
        const bTime = new Date(b.created_at || 0).getTime();
        return bTime - aTime;
      });

      // Only show the most recent pending debate as current
      const current = debates.find(d => d.status === 'pending');
      setCurrentDebate(current || null);

      console.log('Current debate:', current);

      // Initialize speaker scores for current
      if (current?.debate_teams) {
        const scores: Record<string, Record<string, number>> = {};
        current.debate_teams.forEach(dt => {
          if (dt.teams?.speaker_names) {
            scores[dt.id] = {};
            dt.teams.speaker_names.forEach((_, idx) => {
              // Pre-fill from existing speaker_scores if any
              const existing = dt.speaker_scores?.find(s => s.position === (idx + 1));
              scores[dt.id][`speaker_${idx + 1}`] = existing?.score || 0;
            });
          }
        });
        setSpeakerScores(scores);
      }

      // Build past debates list (completed ones)
      const completed = debates.filter(d => d.status === 'completed');
      setPastDebates(completed);
      // Initialize past scores map
      const pScores: Record<string, Record<string, number>> = {};
      for (const d of completed) {
        for (const dt of d.debate_teams || []) {
          pScores[dt.id] = pScores[dt.id] || {};
          const maxSpeakers = (dt.teams?.speaker_names?.length || 3);
          for (let i = 1; i <= maxSpeakers; i++) {
            const existing = dt.speaker_scores?.find(s => s.position === i);
            pScores[dt.id][`speaker_${i}`] = existing?.score || 0;
          }
        }
      }
      setPastScores(pScores);

    } catch (error: any) {
      console.error('Fetch error:', error);
      setError(`Error: ${error.message}. Check that the RLS public access policies are enabled in Supabase.`);
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (debateTeamId: string, speakerKey: string, value: number) => {
    setSpeakerScores(prev => ({
      ...prev,
      [debateTeamId]: {
        ...prev[debateTeamId],
        [speakerKey]: value
      }
    }));
  };

  const testDatabaseAccess = async () => {
    try {
      console.log('Testing database access...');
      
      // Test 1: Try to read teams
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('id, name, total_points')
        .limit(1);
      
      if (teamsError) {
        console.error('Error reading teams:', teamsError);
        return false;
      }
      
      console.log('✅ Can read teams:', teams);
      
      // Test 2: Try to update a team (just for testing)
      if (teams && teams.length > 0) {
        const { error: updateError } = await supabase
          .from('teams')
          .update({ total_points: teams[0].total_points || 0 })
          .eq('id', teams[0].id);
        
        if (updateError) {
          console.error('❌ Cannot update teams:', updateError);
          return false;
        }
        
        console.log('✅ Can update teams');
      }
      
      // Test 3: Try to read debates
      const { data: debates, error: debatesError } = await supabase
        .from('debates')
        .select('id, status')
        .limit(1);
      
      if (debatesError) {
        console.error('Error reading debates:', debatesError);
        return false;
      }
      
      console.log('✅ Can read debates:', debates);
      
      return true;
    } catch (error) {
      console.error('Database access test failed:', error);
      return false;
    }
  };

  const updateTeamStandings = async () => {
    try {
      console.log('Starting team standings update...');
      
      // First test database access
      const canAccess = await testDatabaseAccess();
      if (!canAccess) {
        console.error('❌ Database access test failed - RLS policies may be blocking updates');
        return;
      }
      
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
          } else {
            console.log(`✅ Successfully updated team ${team.id}`);
          }
        }
      }
      
      console.log('Team standings update completed');
    } catch (error) {
      console.error('Error updating team standings:', error);
    }
  };

  const handleSaveResults = async () => {
    if (!currentDebate || !winner || !govTeam || !oppTeam) return;

    setSaving(true);
    try {
      // Calculate total speaks for each team
      // Speaker scores are read per team below
      
      // Totals are computed per debate_team below
      
      // Determine winner based on position selected
      const winningPosition = winner;
      
      // Update each team's points and ranks
      for (const dt of currentDebate.debate_teams || []) {
        const scores = speakerScores[dt.id] || {};
        const totalSpeaks = Object.values(scores).reduce((sum, score) => sum + score, 0);
        const didWin = dt.position === winningPosition;
        
        // Update debate_team with points and speaks
        await supabase
          .from('debate_teams')
          .update({
            points: didWin ? 1 : 0, // Win = 1, Loss = 0
            total_speaks: totalSpeaks,
            rank: didWin ? 1 : 2
          })
          .eq('id', dt.id);

        // Insert speaker scores
        const teamSpeakers = dt.teams?.speaker_names || [];
        for (let i = 0; i < teamSpeakers.length; i++) {
          const speakerScore = scores[`speaker_${i + 1}`] || 0;
          if (speakerScore > 0) {
            // Check if speaker score already exists
            const { data: existing } = await supabase
              .from('speaker_scores')
              .select('id')
              .eq('debate_team_id', dt.id)
              .eq('position', i + 1)
              .single();
            
            if (existing) {
              // Update existing score
              await supabase
                .from('speaker_scores')
                .update({
                  speaker_name: teamSpeakers[i],
                  score: speakerScore
                })
                .eq('id', existing.id);
            } else {
              // Insert new score
              await supabase
                .from('speaker_scores')
                .insert({
                  debate_team_id: dt.id,
                  speaker_name: teamSpeakers[i],
                  score: speakerScore,
                  position: i + 1
                });
            }
          }
        }
      }

      // Mark debate as completed
      console.log('Marking debate as completed:', currentDebate.id);
      const { error: debateError } = await supabase
        .from('debates')
        .update({ status: 'completed' })
        .eq('id', currentDebate.id);

      if (debateError) {
        console.error('❌ Error marking debate as completed:', debateError);
        console.error('This might be due to missing RLS policies for UPDATE on debates table');
      } else {
        console.log('✅ Debate marked as completed successfully');
      }

      // Update team standings in the teams table
      await updateTeamStandings();

      alert('Results saved successfully! Standings updated.');
      
      // Clear the current debate so adjudicator no longer sees it
      setCurrentDebate(null);
      
      // Force a small delay to ensure database updates are complete
      setTimeout(() => {
        console.log('Submission completed - database should be updated');
      }, 1000);
    } catch (error: any) {
      alert('Error saving results: ' + error.message);
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const savePastDebateScores = async (debate: Debate) => {
    try {
      for (const dt of debate.debate_teams || []) {
        const scores = pastScores[dt.id] || {};
        const teamSpeakers = dt.teams?.speaker_names || [];
        let total = 0;
        for (let i = 0; i < Math.max(teamSpeakers.length, 3); i++) {
          const pos = i + 1;
          const val = scores[`speaker_${pos}`] || 0;
          total += val;

          // Upsert speaker_score for this debate_team and position
          const { data: existing } = await supabase
            .from('speaker_scores')
            .select('id')
            .eq('debate_team_id', dt.id)
            .eq('position', pos)
            .maybeSingle();

          if (existing) {
            await supabase
              .from('speaker_scores')
              .update({ speaker_name: teamSpeakers[i] || `Speaker ${pos}`, score: val })
              .eq('id', existing.id);
          } else {
            if (val > 0) {
              await supabase
                .from('speaker_scores')
                .insert({ debate_team_id: dt.id, speaker_name: teamSpeakers[i] || `Speaker ${pos}`, score: val, position: pos });
            }
          }
        }

        // Recompute debate_teams.total_speaks
        await supabase
          .from('debate_teams')
          .update({ total_speaks: total })
          .eq('id', dt.id);
      }

      alert('Past debate scores saved.');
    } catch (e: any) {
      alert('Error saving past scores: ' + e.message);
    }
  };

  const getGovernmentTeam = () => {
    return currentDebate?.debate_teams?.find(dt => dt.position === 'government');
  };

  const getOppositionTeam = () => {
    return currentDebate?.debate_teams?.find(dt => dt.position === 'opposition');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (error || !adjudicator) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-slate-600 mb-4">Invalid adjudicator URL or adjudicator not found.</p>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm text-left">
              {error}
            </div>
          )}
          <p className="text-xs text-slate-500 mt-4">
            Adjudicator ID: {adjudicatorId}
          </p>
        </div>
      </div>
    );
  }

  if (!currentDebate) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">No Active Debates</h1>
          <p className="text-slate-600 mb-4">
            No pending debates have been assigned to this adjudicator yet.
          </p>
          <p className="text-xs text-slate-500">
            Adjudicator: {adjudicator.name}
          </p>
        </div>
      </div>
    );
  }

  const govTeam = getGovernmentTeam();
  const oppTeam = getOppositionTeam();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {adjudicator.name}
              </h1>
              <p className="text-slate-600">
                Adjudicator Assignment
              </p>
            </div>
            <div className="bg-amber-500 p-4 rounded-full">
              <Gavel className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Current Debate */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Award className="w-7 h-7 text-blue-600" />
            {currentDebate.rounds?.name}
          </h2>

          {/* Room */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-3">
              <MapPin className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-sm text-blue-900 font-medium">Room</p>
                <p className="text-2xl font-bold text-blue-800">
                  {currentDebate.rooms?.name || 'TBD'}
                </p>
              </div>
            </div>
          </div>

          {/* Motions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">Motions</h3>
            <div className="space-y-2">
              {currentDebate.rounds?.motion_1 && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Motion 1:</p>
                  <p className="text-sm font-medium text-slate-900">{currentDebate.rounds.motion_1}</p>
                </div>
              )}
              {currentDebate.rounds?.motion_2 && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Motion 2:</p>
                  <p className="text-sm font-medium text-slate-900">{currentDebate.rounds.motion_2}</p>
                </div>
              )}
              {currentDebate.rounds?.motion_3 && (
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-600 mb-1">Motion 3:</p>
                  <p className="text-sm font-medium text-slate-900">{currentDebate.rounds.motion_3}</p>
                </div>
              )}
            </div>
          </div>

          {/* Teams */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Government */}
            {govTeam && (
              <div className="border-2 border-green-300 bg-green-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-600 px-4 py-2 rounded-lg">
                    <span className="text-white font-bold">🏛️ GOVERNMENT</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {govTeam.teams?.name || 'Team'}
                </h3>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Speakers:</p>
                  {govTeam.teams?.speaker_names?.map((speaker, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-green-200">
                      <p className="text-xs text-slate-600 mb-1">Speaker {idx + 1}:</p>
                      <p className="text-sm font-medium text-slate-900">{speaker}</p>
                      <input
                        type="number"
                        min="60"
                        max="100"
                        step="0.5"
                        value={speakerScores[govTeam.id]?.[`speaker_${idx + 1}`] || 0}
                        onChange={(e) => handleScoreChange(govTeam.id, `speaker_${idx + 1}`, parseFloat(e.target.value))}
                        className="mt-2 w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-600 focus:border-transparent outline-none"
                        placeholder="Score (60-100)"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Opposition */}
            {oppTeam && (
              <div className="border-2 border-red-300 bg-red-50 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-red-600 px-4 py-2 rounded-lg">
                    <span className="text-white font-bold">⚖️ OPPOSITION</span>
                  </div>
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {oppTeam.teams?.name || 'Team'}
                </h3>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-700">Speakers:</p>
                  {oppTeam.teams?.speaker_names?.map((speaker, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-red-200">
                      <p className="text-xs text-slate-600 mb-1">Speaker {idx + 1}:</p>
                      <p className="text-sm font-medium text-slate-900">{speaker}</p>
                      <input
                        type="number"
                        min="60"
                        max="100"
                        step="0.5"
                        value={speakerScores[oppTeam.id]?.[`speaker_${idx + 1}`] || 0}
                        onChange={(e) => handleScoreChange(oppTeam.id, `speaker_${idx + 1}`, parseFloat(e.target.value))}
                        className="mt-2 w-full px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent outline-none"
                        placeholder="Score (60-100)"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Winner Selection */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <label className="block text-sm font-bold text-slate-900 mb-3">
              Select Winner:
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setWinner('government')}
                className={`px-6 py-4 rounded-lg font-bold text-lg transition-all ${
                  winner === 'government'
                    ? 'bg-green-600 text-white border-4 border-green-800 shadow-lg'
                    : 'bg-green-50 text-green-700 border-2 border-green-300 hover:bg-green-100'
                }`}
              >
                🏛️ GOVERNMENT
              </button>
              <button
                onClick={() => setWinner('opposition')}
                className={`px-6 py-4 rounded-lg font-bold text-lg transition-all ${
                  winner === 'opposition'
                    ? 'bg-red-600 text-white border-4 border-red-800 shadow-lg'
                    : 'bg-red-50 text-red-700 border-2 border-red-300 hover:bg-red-100'
                }`}
              >
                ⚖️ OPPOSITION
              </button>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveResults}
            disabled={saving || !winner || !govTeam || !oppTeam}
            className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            {saving ? 'Saving...' : 'Submit Results'}
          </button>

          {!winner && (
            <p className="text-center text-sm text-red-600 mt-2">
              Please select a winner before submitting
            </p>
          )}
        </div>
      </div>

      {/* Past Debates (View/Edit Scores) */}
      {pastDebates.length > 0 && (
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Award className="w-7 h-7 text-slate-600" />
            Past Debates (edit scores)
          </h2>
          <div className="space-y-8">
            {pastDebates.map(debate => (
              <div key={debate.id} className="border border-slate-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-slate-500">{debate.rounds?.name}</p>
                    <p className="text-lg font-semibold text-slate-900">{debate.rooms?.name || 'TBD'}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(debate.debate_teams || []).map(dt => (
                    <div key={dt.id} className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                      <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{dt.position}</p>
                      <p className="text-base font-semibold text-slate-900 mb-4">{dt.teams?.name}</p>
                      <div className="space-y-3">
                        {Array.from({ length: Math.max(dt.teams?.speaker_names?.length || 3, 3) }).map((_, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <div className="w-28 text-sm text-slate-700 truncate">
                              {dt.teams?.speaker_names?.[idx] || `Speaker ${idx + 1}`}
                            </div>
                            <input
                              type="number"
                              min={60}
                              max={100}
                              step={0.5}
                              value={pastScores[dt.id]?.[`speaker_${idx + 1}`] ?? 0}
                              onChange={(e) => setPastScores(prev => ({
                                ...prev,
                                [dt.id]: {
                                  ...(prev[dt.id] || {}),
                                  [`speaker_${idx + 1}`]: parseFloat(e.target.value)
                                }
                              }))}
                              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => savePastDebateScores(debate)}
                    className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900 transition-colors"
                  >
                    Save Scores
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

