import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useParams } from 'react-router-dom';
import { Calendar, Users, Award, MapPin } from 'lucide-react';

type Round = {
  id: string;
  round_number: number;
  name: string;
  motion: string | null;
  motion_1: string | null;
  motion_2: string | null;
  motion_3: string | null;
  info_slide: string | null;
  status: string;
};

type Debate = {
  id: string;
  round_id: string;
  room_id: string | null;
  motion_used: string | null;
  status: string;
  rooms?: { name: string };
  debate_teams?: {
    id: string;
    team_id: string;
    position: string;
    teams?: { name: string };
  }[];
  debate_adjudicators?: {
    id: string;
    adjudicator_id: string;
    role: string;
    adjudicators?: { name: string };
  }[];
  rounds?: Round;
};

export default function PublicDraw() {
  const { teamId } = useParams<{ teamId: string }>();
  const [team, setTeam] = useState<any>(null);
  const [debates, setDebates] = useState<Debate[]>([]);
  const [standings, setStandings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (teamId) {
      fetchTeamData();
    }
  }, [teamId]);

  const fetchTeamData = async () => {
    try {
      // Fetch team info
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*, institutions(name)')
        .eq('id', teamId)
        .single();

      if (teamError) {
        console.error('Team fetch error:', teamError);
        setError(teamError.message);
        setLoading(false);
        return;
      }
      setTeam(teamData);

      // Fetch all debates for this team
      const { data: debatesData, error: debatesError } = await supabase
        .from('debate_teams')
        .select(`
          *,
          debates(*, motion_used, rounds(*, motion_1, motion_2, motion_3), rooms(name), debate_teams(*, teams(name)), debate_adjudicators(*, adjudicators(name)))
        `)
        .eq('team_id', teamId)
        .eq('debates.rounds.status', 'ongoing');

      if (debatesError) throw debatesError;

      let teamDebates = debatesData
        .map(dt => dt.debates)
        .filter(Boolean) as Debate[];

      // Keep only the latest ongoing round (remove any history)
      if (teamDebates.length > 0) {
        const maxRound = Math.max(
          ...teamDebates.map(d => d.rounds?.round_number || 0)
        );
        teamDebates = teamDebates.filter(d => (d.rounds?.round_number || 0) === maxRound);
      }

      setDebates(teamDebates);

      // Fetch standings
      const { data: standingsData, error: standingsError } = await supabase
        .from('teams')
        .select('*, institutions(name)')
        .order('total_points', { ascending: false });

      if (standingsError) throw standingsError;

      // Sort by total_points first, then total_speaks
      const sortedStandings = [...standingsData].sort((a, b) => {
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points;
        }
        return b.total_speaks - a.total_speaks;
      });

      const teamStandings = sortedStandings.map((t, index) => ({
        ...t,
        rank: index + 1
      }));

      setStandings(teamStandings);

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentRound = () => {
    return debates.filter(d => d.rounds?.status === 'ongoing' || d.rounds?.status === 'setup')
      .sort((a, b) => (b.rounds?.round_number || 0) - (a.rounds?.round_number || 0))[0];
  };

  const getTeamPosition = (debate: Debate) => {
    return debate.debate_teams?.find(dt => dt.team_id === teamId)?.position || '-';
  };

  const getOpposingTeams = (debate: Debate) => {
    const others = debate.debate_teams?.filter(dt => dt.team_id !== teamId) || [];
    return others.map(dt => ({
      name: dt.teams?.name || 'Team',
      position: dt.position
    }));
  };

  const getAdjudicators = (debate: Debate) => {
    return debate.debate_adjudicators?.map(da => {
      const name = da.adjudicators?.name || 'Judge';
      return da.role === 'chair' ? `${name} (Chair)` : name;
    }).join(', ') || '-';
  };

  const getCurrentRank = () => {
    return standings.findIndex(s => s.id === teamId) + 1;
  };

  const getStats = () => {
    const teamStats = team;
    return {
      totalPoints: teamStats?.total_points || 0,
      roundsCompleted: teamStats?.rounds_count || 0
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (error || !team) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">Access Denied</h1>
          <p className="text-slate-600 mb-2">Invalid team URL or team not found.</p>
          {error && (
            <p className="text-sm text-red-600 mt-2">
              Error: {error}
            </p>
          )}
          <p className="text-xs text-slate-500 mt-4">
            Team ID: {teamId}<br/>
            Check that the RLS public access policies are enabled in Supabase.
          </p>
        </div>
      </div>
    );
  }

  const currentRound = getCurrentRound();
  const stats = getStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                {team.name}
              </h1>
              <p className="text-slate-600">
                {team.institutions?.name || 'Independent'}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                Speakers: {team.speaker_names?.join(', ')}
              </p>
            </div>
            {/* <div className="flex gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900">
                  #{getCurrentRank()}
                </div>
                <div className="text-xs text-slate-600">Current Rank</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {stats.totalPoints}
                </div>
                <div className="text-xs text-slate-600">Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {stats.roundsCompleted}
                </div>
                <div className="text-xs text-slate-600">Rounds</div>
              </div>
            </div> */}
          </div>
        </div>

        {/* Current Round Draw */}
        {currentRound && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Calendar className="w-7 h-7 text-blue-600" />
              {currentRound.rounds?.name}
            </h2>

            {/* Your Side Banner */}
            <div className={`rounded-xl p-6 mb-6 border-2 ${
              getTeamPosition(currentRound).toLowerCase() === 'government'
                ? 'bg-green-50 border-green-400'
                : getTeamPosition(currentRound).toLowerCase() === 'opposition'
                ? 'bg-red-50 border-red-400'
                : 'bg-blue-50 border-blue-400'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-bold uppercase px-6 py-4 rounded-lg ${
                  getTeamPosition(currentRound).toLowerCase() === 'government'
                    ? 'bg-green-600 text-white'
                    : getTeamPosition(currentRound).toLowerCase() === 'opposition'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  {getTeamPosition(currentRound).toLowerCase() === 'government' && '🏛️'}
                  {getTeamPosition(currentRound).toLowerCase() === 'opposition' && '⚖️'}
                  {getTeamPosition(currentRound).toLowerCase() !== 'government' && getTeamPosition(currentRound).toLowerCase() !== 'opposition' && getTeamPosition(currentRound)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">You Are</h3>
                  <p className={`text-2xl font-bold uppercase ${
                    getTeamPosition(currentRound).toLowerCase() === 'government'
                      ? 'text-green-900'
                      : getTeamPosition(currentRound).toLowerCase() === 'opposition'
                      ? 'text-red-900'
                      : 'text-slate-900'
                  }`}>
                    {getTeamPosition(currentRound).toLowerCase() === 'government' && 'GOVERNMENT'}
                    {getTeamPosition(currentRound).toLowerCase() === 'opposition' && 'OPPOSITION'}
                    {(getTeamPosition(currentRound).toLowerCase() !== 'government' && getTeamPosition(currentRound).toLowerCase() !== 'opposition') && getTeamPosition(currentRound).toUpperCase()}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {getTeamPosition(currentRound).toLowerCase() === 'government' && 'You propose the motion'}
                    {getTeamPosition(currentRound).toLowerCase() === 'opposition' && 'You oppose the motion'}
                    {(getTeamPosition(currentRound).toLowerCase() !== 'government' && getTeamPosition(currentRound).toLowerCase() !== 'opposition') && 'Your position'}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {/* Motions */}
              <div className="bg-blue-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Motions
                </h3>
                
                <div className="space-y-3">
                  {currentRound.rounds?.motion_1 && (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-1">Motion 1:</p>
                      <p className="text-sm text-slate-900 font-medium">{currentRound.rounds.motion_1}</p>
                    </div>
                  )}
                  
                  {currentRound.rounds?.motion_2 && (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-1">Motion 2:</p>
                      <p className="text-sm text-slate-900 font-medium">{currentRound.rounds.motion_2}</p>
                    </div>
                  )}
                  
                  {currentRound.rounds?.motion_3 && (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-xs font-medium text-blue-900 mb-1">Motion 3:</p>
                      <p className="text-sm text-slate-900 font-medium">{currentRound.rounds.motion_3}</p>
                    </div>
                  )}
                  
                  {!currentRound.rounds?.motion_1 && !currentRound.rounds?.motion_2 && !currentRound.rounds?.motion_3 && (
                    <p className="text-slate-600">TBD</p>
                  )}
                </div>

                {currentRound.rounds?.info_slide && (
                  <p className="text-xs text-slate-600 mt-3 border-t border-blue-200 pt-3">
                    Info: {currentRound.rounds.info_slide}
                  </p>
                )}
              </div>

              {/* Room & Position */}
              <div className="bg-green-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  Room & Side
                </h3>
                <p className="text-slate-900 text-lg font-medium mb-2">
                  {currentRound.rooms?.name || 'TBD'}
                </p>
                <span className={`inline-block px-4 py-2 rounded-lg text-sm font-bold ${
                  getTeamPosition(currentRound).toLowerCase() === 'government' 
                    ? 'bg-green-600 text-white' 
                    : getTeamPosition(currentRound).toLowerCase() === 'opposition'
                    ? 'bg-red-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  {getTeamPosition(currentRound).toLowerCase() === 'government' && '🏛️ GOVERNMENT'}
                  {getTeamPosition(currentRound).toLowerCase() === 'opposition' && '⚖️ OPPOSITION'}
                  {(getTeamPosition(currentRound).toLowerCase() !== 'government' && getTeamPosition(currentRound).toLowerCase() !== 'opposition') && getTeamPosition(currentRound)}
                </span>
              </div>
            </div>

            {/* Opposing Team */}
            <div className="bg-slate-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-slate-600" />
                Your Opponents
              </h3>
              <div className="space-y-3">
                {getOpposingTeams(currentRound).map((opp, idx) => {
                  const isGov = opp.position.toLowerCase() === 'government';
                  const isOpp = opp.position.toLowerCase() === 'opposition';
                  return (
                    <div key={idx} className={`rounded-lg p-4 border-2 ${
                      isGov ? 'bg-green-50 border-green-300' :
                      isOpp ? 'bg-red-50 border-red-300' :
                      'bg-white border-slate-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className={`text-xs font-bold uppercase block mb-1 ${
                            isGov ? 'text-green-900' : isOpp ? 'text-red-900' : 'text-slate-600'
                          }`}>
                            {isGov && '🏛️ GOVERNMENT'}
                            {isOpp && '⚖️ OPPOSITION'}
                            {!isGov && !isOpp && opp.position}
                          </span>
                          <span className="font-medium text-slate-900 text-lg">{opp.name}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {getOpposingTeams(currentRound).length === 0 && (
                  <p className="text-slate-500">TBD</p>
                )}
              </div>
            </div>

            {/* Adjudicators */}
            {currentRound.debate_adjudicators && currentRound.debate_adjudicators.length > 0 && (
              <div className="mt-4 bg-amber-50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Adjudicators
                </h3>
                <p className="text-slate-700">
                  {getAdjudicators(currentRound)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Standings
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Overall Standings</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Rank</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Team</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase">Points</th>
                  <th className="text-center px-4 py-3 text-xs font-medium text-slate-500 uppercase">Rounds</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {standings.map((s, index) => (
                  <tr
                    key={s.id}
                    className={s.id === teamId ? 'bg-blue-50 font-medium' : 'hover:bg-slate-50'}
                  >
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {index < 4 && <span className="mr-2">🏆</span>}
                      {s.rank}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-900">
                      {s.name}
                      {s.id === teamId && <span className="ml-2 text-blue-600">(You)</span>}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-900">
                      {s.total_points}
                    </td>
                    <td className="px-4 py-3 text-sm text-center text-slate-600">
                      {s.rounds_count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div> */}

        {/* Round History
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Round History</h2>
          <div className="space-y-4">
            {debates.map((debate) => (
              <div key={debate.id} className="border border-slate-200 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {debate.rounds?.name || 'Round'}
                    </h3>
                    <p className="text-sm text-slate-600 mt-1">
                      Motion: {debate.rounds?.motion || 'N/A'}
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="text-center">
                      <div className="text-sm font-medium text-slate-600">Position</div>
                      <div className="text-lg font-bold text-slate-900">
                        {getTeamPosition(debate)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-medium text-slate-600">Room</div>
                      <div className="text-lg font-bold text-slate-900">
                        {debate.rooms?.name || 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {debates.length === 0 && (
              <p className="text-slate-500 text-center py-8">No rounds completed yet</p>
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
}

