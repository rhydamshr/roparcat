import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, Award, TrendingUp, Users, UserCheck } from 'lucide-react';

type Tournament = {
  id: string;
  name: string;
  format: 'BP' | 'AP';
  status: string;
};

type Team = {
  id: string;
  name: string;
  institution_id: string | null;
  speaker_names: string[];
  total_points: number;
  total_speaks: number;
  rounds_count: number;
  institutions?: { name: string };
};

type Speaker = {
  name: string;
  team_name: string;
  institution: string;
  total_speaks: number;
  rounds_count: number;
  average_speaks: number;
};

type AdjudicatorStats = {
  id: string;
  name: string;
  institution: string;
  strength: number;
  debates_chaired: number;
  debates_paneled: number;
};

export default function Standings() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [adjudicators, setAdjudicators] = useState<AdjudicatorStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'teams' | 'speakers' | 'adjudicators'>('teams');

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournament) {
      fetchStandings();
    }
  }, [selectedTournament]);

  const updateTeamStandings = async () => {
    try {
      // Get all teams
      const { data: teams } = await supabase
        .from('teams')
        .select('id');

      if (!teams) return;

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

          // Update team record
          await supabase
            .from('teams')
            .update({
              total_points: totalPoints,
              total_speaks: totalSpeaks,
              rounds_count: roundsCount
            })
            .eq('id', team.id);
        }
      }
    } catch (error) {
      console.error('Error updating team standings:', error);
    }
  };

  const fetchTournaments = async () => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTournaments(data || []);
      
      if (data && data.length > 0 && !selectedTournament) {
        setSelectedTournament(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching tournaments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStandings = async () => {
    try {
      // First, manually update team standings to ensure they're current
      await updateTeamStandings();

      // Fetch teams with institutions
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*, institutions(name)')
        .order('total_points', { ascending: false });

      if (teamsError) throw teamsError;

      // Sort by total_points first, then total_speaks
      const teamsSorted = (teamsData || []).sort((a, b) => {
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points;
        }
        return b.total_speaks - a.total_speaks;
      });

      setTeams(teamsSorted);

      // Calculate speaker standings from speaker_scores filtered by selected tournament
      const speakerTotals = new Map<string, { totalSpeaks: number; speechesCount: number; name: string; teamName: string; institution: string }>();

      // Fetch speaker scores joined through debate_teams -> debates -> rounds to filter by tournament
      const { data: scoresData, error: scoresError } = await supabase
        .from('speaker_scores')
        .select(`
          speaker_name,
          score,
          debate_teams(
            team_id,
            debates(
              round_id,
              rounds(tournament_id)
            ),
            teams(name, institutions(name))
          )
        `)
        .eq('debate_teams.debates.rounds.tournament_id', selectedTournament);

      if (scoresError) {
        console.error('Error fetching speaker scores:', scoresError);
      } else if (scoresData) {
        for (const row of scoresData as any[]) {
          const team = row.debate_teams?.teams;
          const instName = team?.institutions?.name || '';
          const key = `${team?.name || 'Team'}-${row.speaker_name}`;
          if (!speakerTotals.has(key)) {
            speakerTotals.set(key, {
              totalSpeaks: 0,
              speechesCount: 0,
              name: row.speaker_name,
              teamName: team?.name || 'Team',
              institution: instName
            });
          }
          const agg = speakerTotals.get(key)!;
          agg.totalSpeaks += Number(row.score) || 0;
          agg.speechesCount += 1;
        }
      }

      const computedSpeakers: Speaker[] = Array.from(speakerTotals.values()).map(s => ({
        name: s.name,
        team_name: s.teamName,
        institution: s.institution,
        total_speaks: s.totalSpeaks,
        rounds_count: s.speechesCount,
        average_speaks: s.speechesCount > 0 ? s.totalSpeaks / s.speechesCount : 0
      }));

      // Sort speakers by total speaks, then average speaks
      computedSpeakers.sort((a, b) => {
        if (b.total_speaks !== a.total_speaks) return b.total_speaks - a.total_speaks;
        return b.average_speaks - a.average_speaks;
      });

      setSpeakers(computedSpeakers);

      // Fetch adjudicator statistics
      const { data: adjsData, error: adjsError } = await supabase
        .from('adjudicators')
        .select('*, institutions(name)');

      if (adjsError) throw adjsError;

      // Calculate adjudicator stats
      const adjStats = await Promise.all(
        (adjsData || []).map(async (adj) => {
          // Get debates chaired and paneled
          const { count: chairedCount } = await supabase
            .from('debate_adjudicators')
            .select('id', { count: 'exact', head: true })
            .eq('adjudicator_id', adj.id)
            .eq('role', 'chair');

          const { count: panelCount } = await supabase
            .from('debate_adjudicators')
            .select('id', { count: 'exact', head: true })
            .eq('adjudicator_id', adj.id)
            .in('role', ['chair', 'panelist']);

          return {
            id: adj.id,
            name: adj.name,
            institution: adj.institutions?.name || '',
            strength: adj.strength,
            debates_chaired: chairedCount || 0,
            debates_paneled: panelCount || 0
          };
        })
      );

      setAdjudicators(adjStats.sort((a, b) => b.debates_chaired - a.debates_chaired));
    } catch (error) {
      console.error('Error fetching standings:', error);
    }
  };

  const handleExportCSV = async () => {
    if (activeTab === 'teams') {
      const csv = teams.map((team, index) => ({
        Rank: index + 1,
        Team: team.name,
        Institution: team.institutions?.name || '',
        'Total Points': team.total_points,
        'Total Speaks': team.total_speaks.toFixed(2),
        'Rounds': team.rounds_count
      }));

      const headers = Object.keys(csv[0]).join(',');
      const rows = csv.map(row => Object.values(row).join(','));
      const csvContent = [headers, ...rows].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'team_standings.csv';
      a.click();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Standings</h1>
          <p className="text-slate-600 mt-1">Tournament rankings and statistics</p>
        </div>
        <select
          value={selectedTournament || ''}
          onChange={(e) => setSelectedTournament(e.target.value)}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-white"
        >
          {tournaments.map(t => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="border-b border-slate-200">
          <div className="flex gap-1 p-1">
            <button
              onClick={() => setActiveTab('teams')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'teams'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Users className="w-4 h-4" />
                Teams
              </div>
            </button>
            <button
              onClick={() => setActiveTab('speakers')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'speakers'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Award className="w-4 h-4" />
                Speakers
              </div>
            </button>
            <button
              onClick={() => setActiveTab('adjudicators')}
              className={`flex-1 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'adjudicators'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <UserCheck className="w-4 h-4" />
                Adjudicators
              </div>
            </button>
          </div>
        </div>

        {activeTab === 'teams' && (
          <div>
            <div className="p-4 flex justify-end">
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Team
                    </th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Institution
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Points
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Total Speaks
                    </th>
                    <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Rounds
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {teams.map((team, index) => (
                    <tr key={team.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {index + 1}
                        {index < 4 && <span className="ml-2 text-yellow-500">🏆</span>}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {team.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {team.institutions?.name || '-'}
                      </td>
                      <td className="px-6 py-4 text-sm text-center font-medium text-slate-900">
                        {team.total_points}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-600">
                        {team.total_speaks.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-sm text-center text-slate-600">
                        {team.rounds_count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'speakers' && (
          <div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Speaker Rankings</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {speakers.map((speaker, index) => (
                  <div
                    key={speaker.name + speaker.team_name}
                    className="border border-slate-200 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-slate-900">#{index + 1}</span>
                        <div>
                          <h4 className="font-semibold text-slate-900">{speaker.name}</h4>
                          <p className="text-sm text-slate-600">{speaker.team_name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total Speaks:</span>
                        <span className="font-medium text-slate-900">
                          {speaker.total_speaks.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Avg Speaks:</span>
                        <span className="font-medium text-slate-900">
                          {speaker.average_speaks.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Institution:</span>
                        <span className="text-slate-900">{speaker.institution}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {speakers.length === 0 && (
                  <div className="col-span-full text-center py-8 text-slate-500">
                    No speaker data available yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'adjudicators' && (
          <div>
            <div className="p-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Adjudicator Statistics</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Institution
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Strength
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Debates Chaired
                      </th>
                      <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                        Total Debates
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {adjudicators.map((adj) => (
                      <tr key={adj.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-slate-900">
                          {adj.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">
                          {adj.institution}
                        </td>
                        <td className="px-6 py-4 text-sm text-center">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            {adj.strength}/10
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-slate-600">
                          {adj.debates_chaired}
                        </td>
                        <td className="px-6 py-4 text-sm text-center text-slate-600">
                          {adj.debates_paneled}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
