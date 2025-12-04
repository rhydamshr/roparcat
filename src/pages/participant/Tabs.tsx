import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Trophy, Users, Award } from 'lucide-react';

type Tournament = {
  id: string;
  name: string;
  status: 'setup' | 'ongoing' | 'completed';
  format: 'BP' | 'AP';
};

type TeamStanding = {
  id: string;
  name: string;
  institution: string;
  wins: number;
  totalSpeaks: number;
  rounds: number;
};

type SpeakerStanding = {
  name: string;
  teamName: string;
  institution: string;
  totalSpeaks: number;
  speechesCount: number;
  average: number;
};

export default function Tabs() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [teams, setTeams] = useState<TeamStanding[]>([]);
  const [speakers, setSpeakers] = useState<SpeakerStanding[]>([]);
  const [tournamentsLoading, setTournamentsLoading] = useState(true);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [error, setError] = useState('');

  const isLoading = tournamentsLoading || rankingsLoading;
  const selectedTournament = tournaments.find(t => t.id === selectedTournamentId) || null;

  useEffect(() => {
    fetchTournaments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      fetchRankings(selectedTournamentId);
    } else if (!tournamentsLoading) {
      setTeams([]);
      setSpeakers([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTournamentId]);

  const fetchTournaments = async () => {
    setTournamentsLoading(true);
    setError('');
    try {
      const { data, error: tournamentsError } = await supabase
        .from('tournaments')
        .select('id, name, status, format')
        .order('created_at', { ascending: false });

      if (tournamentsError) throw tournamentsError;

      setTournaments(data || []);

      if (!selectedTournamentId && data && data.length > 0) {
        const active = data.find(t => t.status === 'ongoing') || data[0];
        setSelectedTournamentId(active.id);
      }
    } catch (err: any) {
      console.error('Error fetching tournaments:', err);
      setError(err.message || 'Unable to load tournaments.');
    } finally {
      setTournamentsLoading(false);
    }
  };

  const fetchRankings = async (tournamentId: string) => {
    setRankingsLoading(true);
    setError('');

    try {
      const { data: debateTeamsData, error: debateTeamsError } = await supabase
        .from('debate_teams')
        .select(`
          team_id,
          points,
          total_speaks,
          teams(name, institutions(name)),
          debates(
            id,
            rounds(tournament_id, status)
          )
        `)
        .eq('debates.rounds.tournament_id', tournamentId)
        .neq('debates.rounds.status', 'setup');

      if (debateTeamsError) throw debateTeamsError;

      const teamMap = new Map<string, TeamStanding>();

      (debateTeamsData || []).forEach((row: any) => {
        const teamId = row.team_id as string | null;
        if (!teamId) return;

        const existing = teamMap.get(teamId) || {
          id: teamId,
          name: row.teams?.name || 'Team',
          institution: row.teams?.institutions?.name || 'Independent',
          wins: 0,
          totalSpeaks: 0,
          rounds: 0,
        };

        existing.wins += Number(row.points) || 0;
        existing.totalSpeaks += Number(row.total_speaks) || 0;
        existing.rounds += 1;

        teamMap.set(teamId, existing);
      });

      const teamStandings = Array.from(teamMap.values()).sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.totalSpeaks - a.totalSpeaks;
      });

      const { data: speakerRows, error: speakerError } = await supabase
        .from('speaker_scores')
        .select(`
          speaker_name,
          score,
          debate_teams(
            team_id,
            teams(name, institutions(name)),
            debates(
              rounds(tournament_id, status)
            )
          )
        `)
        .eq('debate_teams.debates.rounds.tournament_id', tournamentId)
        .neq('debate_teams.debates.rounds.status', 'setup');

      if (speakerError) throw speakerError;

      const speakerMap = new Map<string, SpeakerStanding>();

      (speakerRows || []).forEach((row: any) => {
        const team = row.debate_teams?.teams;
        const key = `${row.speaker_name}-${team?.name || 'Team'}`;
        const existing = speakerMap.get(key) || {
          name: row.speaker_name || 'Speaker',
          teamName: team?.name || 'Team',
          institution: team?.institutions?.name || 'Independent',
          totalSpeaks: 0,
          speechesCount: 0,
          average: 0,
        };

        existing.totalSpeaks += Number(row.score) || 0;
        existing.speechesCount += 1;
        existing.average = existing.speechesCount > 0 ? existing.totalSpeaks / existing.speechesCount : 0;

        speakerMap.set(key, existing);
      });

      const speakerStandings = Array.from(speakerMap.values()).sort((a, b) => {
        if (b.totalSpeaks !== a.totalSpeaks) return b.totalSpeaks - a.totalSpeaks;
        return b.average - a.average;
      });

      setTeams(teamStandings);
      setSpeakers(speakerStandings);
    } catch (err: any) {
      console.error('Error fetching rankings:', err);
      setError(err.message || 'Unable to load rankings.');
      setTeams([]);
      setSpeakers([]);
    } finally {
      setRankingsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-800 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-10">
        <header className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-8 text-slate-900">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3 text-slate-500 text-sm uppercase tracking-wide">
                <Trophy className="w-5 h-5 text-amber-500" />
                Tournament Tabs
              </div>
              <h1 className="text-3xl font-bold text-slate-900 mt-2">
                {selectedTournament ? selectedTournament.name : 'No tournament found'}
              </h1>
              <p className="text-slate-600 mt-1">
                Live overall standings · Sorted by wins, then speaks
              </p>
            </div>
            {tournaments.length > 1 && (
              <select
                value={selectedTournamentId || ''}
                onChange={(event) => setSelectedTournamentId(event.target.value)}
                className="w-full md:w-auto px-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
              >
                <option value="" disabled>Select tournament</option>
                {tournaments.map(tournament => (
                  <option key={tournament.id} value={tournament.id}>
                    {tournament.name} {tournament.status === 'ongoing' ? '• Live' : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
          {tournaments.length === 0 && !isLoading && (
            <p className="text-sm text-red-600 mt-4">No tournaments available.</p>
          )}
          {error && (
            <p className="text-sm text-red-600 mt-4">{error}</p>
          )}
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
          </div>
        ) : (
          <>
            <section className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 text-white rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">Overall Team Rankings</h2>
                    <p className="text-sm text-slate-500">Wins are shown first, ties break on total speaker scores.</p>
                  </div>
                </div>
                <span className="text-xs uppercase tracking-widest text-slate-500">
                  Updated live
                </span>
              </div>

              {teams.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No team results have been released yet.
                </div>
              ) : (
                <div className="overflow-x-auto mt-6">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-xs uppercase tracking-wider text-slate-500 border-b border-slate-200">
                        <th className="py-3 pr-4">Rank</th>
                        <th className="py-3 pr-4">Team</th>
                        <th className="py-3 pr-4">Institution</th>
                        <th className="py-3 pr-4 text-center">Wins</th>
                        <th className="py-3 pr-4 text-center">Total Speaks</th>
                        <th className="py-3 pr-4 text-center">Rounds</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
                      {teams.map((team, index) => (
                        <tr key={team.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 pr-4 font-semibold text-slate-900">
                            #{index + 1}
                            {index < 4 && <span className="ml-2 text-amber-500">🏅</span>}
                          </td>
                          <td className="py-4 pr-4 font-medium">{team.name}</td>
                          <td className="py-4 pr-4 text-slate-600">{team.institution}</td>
                          <td className="py-4 pr-4 text-center font-semibold">{team.wins}</td>
                          <td className="py-4 pr-4 text-center">{team.totalSpeaks.toFixed(2)}</td>
                          <td className="py-4 pr-4 text-center text-slate-500">{team.rounds}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="bg-white/95 backdrop-blur rounded-2xl shadow-xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-amber-500/20 text-amber-600 rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Speaker Leaderboard</h2>
                  <p className="text-sm text-slate-500">Sorted by total speaker scores, then average speaks.</p>
                </div>
              </div>

              {speakers.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  No speaker scores have been published yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {speakers.map((speaker, index) => (
                    <div
                      key={`${speaker.name}-${speaker.teamName}`}
                      className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-slate-900">#{index + 1}</span>
                        {index === 0 && <span className="text-amber-500">🥇</span>}
                        {index === 1 && <span className="text-gray-400">🥈</span>}
                        {index === 2 && <span className="text-amber-700">🥉</span>}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-slate-900">{speaker.name}</h3>
                      <p className="text-sm text-slate-500">{speaker.teamName}</p>
                      <p className="text-sm text-slate-500 mb-4">{speaker.institution}</p>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-slate-600">
                          <span>Total Speaks</span>
                          <span className="font-semibold text-slate-900">
                            {speaker.totalSpeaks.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Speeches</span>
                          <span className="font-semibold text-slate-900">{speaker.speechesCount}</span>
                        </div>
                        <div className="flex justify-between text-slate-600">
                          <span>Average</span>
                          <span className="font-semibold text-slate-900">
                            {speaker.average.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

