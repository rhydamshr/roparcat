import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Search, FileText, Users, Award, ChevronRight, ChevronDown, Upload, Download, RefreshCw } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

type Tournament = {
  id: string;
  name: string;
  format: 'BP' | 'AP';
  status: string;
};

type Round = {
  id: string;
  tournament_id: string;
  round_number: number;
  name: string;
  motion: string | null;
  motion_1: string | null;
  motion_2: string | null;
  motion_3: string | null;
  info_slide: string | null;
  status: 'setup' | 'ongoing' | 'completed';
  created_at: string;
  tournaments?: Tournament;
};

type Debate = {
  id: string;
  round_id: string;
  room_id: string | null;
  motion_used: string | null;
  status: 'pending' | 'completed';
  rooms?: { name: string };
  debate_teams?: any[];
  debate_adjudicators?: any[];
};

export default function Rounds() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournament');

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [debates, setDebates] = useState<Debate[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [adjudicators, setAdjudicators] = useState<any[]>([]);
  const [selectedRound, setSelectedRound] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    tournament_id: tournamentId || '',
    round_number: 1,
    name: '',
    motion_1: '',
    motion_2: '',
    motion_3: '',
    info_slide: '',
    status: 'setup' as 'setup' | 'ongoing' | 'completed'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, [tournamentId]);

  const fetchData = async () => {
    try {
      const [tournamentsRes, roomsRes, teamsRes, adjRes] = await Promise.all([
        supabase.from('tournaments').select('*').order('name'),
        supabase.from('rooms').select('*').order('name'),
        supabase.from('teams').select('*').order('total_points', { ascending: false }),
        supabase.from('adjudicators').select('*').order('strength', { ascending: false })
      ]);

      if (tournamentsRes.error) throw tournamentsRes.error;
      if (roomsRes.error) throw roomsRes.error;
      if (teamsRes.error) throw teamsRes.error;
      if (adjRes.error) throw adjRes.error;

      setTournaments(tournamentsRes.data || []);
      setRooms(roomsRes.data || []);
      setTeams(teamsRes.data || []);
      setAdjudicators(adjRes.data || []);

      if (tournamentId) {
        const { data: roundsData, error: roundsError } = await supabase
          .from('rounds')
          .select('*, tournaments(*)')
          .eq('tournament_id', tournamentId)
          .order('round_number');

        if (roundsError) throw roundsError;
        setRounds(roundsData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDebates = async (roundId: string) => {
    try {
      const { data, error } = await supabase
        .from('debates')
        .select(`
          *,
          rooms(name),
          debate_teams(*, teams(name)),
          debate_adjudicators(*, adjudicators(name))
        `)
        .eq('round_id', roundId)
        .order('created_at');

      if (error) throw error;
      setDebates(data || []);
    } catch (error) {
      console.error('Error fetching debates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data = {
        tournament_id: formData.tournament_id,
        round_number: formData.round_number,
        name: formData.name,
        motion_1: formData.motion_1 || null,
        motion_2: formData.motion_2 || null,
        motion_3: formData.motion_3 || null,
        info_slide: formData.info_slide || null,
        status: formData.status
      };

      if (editingId) {
        const { error } = await supabase
          .from('rounds')
          .update(data)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('rounds')
          .insert(data);

        if (error) throw error;
      }

      setShowModal(false);
      setFormData({ tournament_id: tournamentId || '', round_number: 1, name: '', motion_1: '', motion_2: '', motion_3: '', info_slide: '', status: 'setup' });
      setEditingId(null);
      fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this round? This will delete all associated debates.')) return;

    try {
      const { error } = await supabase
        .from('rounds')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting round:', error);
    }
  };

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

  const generateDraw = async (roundId: string) => {
    if (!confirm('This will generate a draw for this round. Any existing draws will be removed. Continue?')) return;

    try {
      // First, remove existing draws for this round
      console.log('Removing existing draws for round:', roundId);
      
      // Get existing debates for this round
      const { data: existingDebates } = await supabase
        .from('debates')
        .select('id')
        .eq('round_id', roundId);

      if (existingDebates && existingDebates.length > 0) {
        const debateIds = existingDebates.map(d => d.id);
        
        // Delete related records first (due to foreign key constraints)
        await supabase
          .from('speaker_scores')
          .delete()
          .in('debate_team_id', 
            await supabase
              .from('debate_teams')
              .select('id')
              .in('debate_id', debateIds)
              .then(res => res.data?.map(dt => dt.id) || [])
          );

        await supabase
          .from('debate_teams')
          .delete()
          .in('debate_id', debateIds);

        await supabase
          .from('debate_adjudicators')
          .delete()
          .in('debate_id', debateIds);

        // Finally delete the debates
        await supabase
          .from('debates')
          .delete()
          .eq('round_id', roundId);

        console.log('Removed existing draws');
      }

      // Get the round details
      const { data: roundData } = await supabase
        .from('rounds')
        .select('*, tournaments(*)')
        .eq('id', roundId)
        .single();

      if (!roundData || !roundData.tournaments) return;

      const format = roundData.tournaments.format;
      const availableRooms = rooms;
      const availableTeams = teams;

      // Get available motions
      const motions = [
        roundData.motion_1,
        roundData.motion_2,
        roundData.motion_3
      ].filter(m => m).filter(Boolean);

      // Asian Parliamentary: pair teams (2 teams per debate: Government vs Opposition)
      const shuffledTeams = [...availableTeams].sort((a, b) => b.total_points - a.total_points);
      const numDebates = Math.ceil(shuffledTeams.length / 2);

      // Shuffle adjudicators once and assign one per debate
      const shuffledAdjs = [...adjudicators].sort(() => Math.random() - 0.5);
      const availableAdjs = [...shuffledAdjs]; // Copy to track available adjudicators

      // Warn if not enough adjudicators
      if (availableAdjs.length < numDebates) {
        const proceed = confirm(`Warning: You have ${availableAdjs.length} adjudicators but ${numDebates} debates. Some debates will not have adjudicators. Continue?`);
        if (!proceed) return;
      }

      const newDebates = [];

      for (let i = 0; i < numDebates && i < availableRooms.length; i++) {
        // Assign random motion to this debate
        const randomMotion = motions.length > 0 
          ? motions[Math.floor(Math.random() * motions.length)]
          : null;

        // Create debate
        const { data: debate, error: debateError } = await supabase
          .from('debates')
          .insert({
            round_id: roundId,
            room_id: availableRooms[i].id,
            motion_used: randomMotion
          })
          .select()
          .single();

        if (debateError) {
          console.error('Error creating debate:', debateError);
          continue;
        }

        // Assign teams (AP: Government vs Opposition) - 2 teams per debate
        const teamIndices = [i * 2, i * 2 + 1].filter(idx => idx < shuffledTeams.length);
        const positions: ('government' | 'opposition')[] = ['government', 'opposition'];

        for (let j = 0; j < teamIndices.length; j++) {
          const teamInsert = await supabase
            .from('debate_teams')
            .insert({
              debate_id: debate.id,
              team_id: shuffledTeams[teamIndices[j]].id,
              position: positions[j]
            });
          
          if (teamInsert.error) {
            console.error('Error assigning team:', teamInsert.error);
          }
        }

        // Assign ONE adjudicator per debate (chair only)
        if (availableAdjs.length > 0) {
          const assignedAdj = availableAdjs.shift(); // Remove from available list
          
          const adjInsert = await supabase
            .from('debate_adjudicators')
            .insert({
              debate_id: debate.id,
              adjudicator_id: assignedAdj.id,
              role: 'chair'
            });
          
          if (adjInsert.error) {
            console.error('Error assigning adjudicator:', adjInsert.error);
          }
        } else {
          console.warn(`No more adjudicators available for debate ${i + 1}`);
        }

        newDebates.push(debate);
      }

      const assignedAdjs = shuffledAdjs.length - availableAdjs.length;
      alert(`Draw generated! Created ${newDebates.length} debates with ${assignedAdjs} adjudicators assigned.`);
      fetchData();
    } catch (error: any) {
      setError(error.message);
      alert('Error generating draw: ' + error.message);
    }
  };

  const toggleRound = (roundId: string) => {
    if (selectedRound === roundId) {
      setSelectedRound(null);
      setDebates([]);
    } else {
      setSelectedRound(roundId);
      fetchDebates(roundId);
    }
  };

  const handleViewRounds = (roundId: string) => {
    navigate(`/dashboard/rounds?tournament=${tournamentId}&round=${roundId}`);
  };

  const filteredRounds = rounds.filter(round =>
    round.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-slate-900">Rounds</h1>
          <p className="text-slate-600 mt-1">Manage tournament rounds and draws</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
          {isAdmin && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Round
            </button>
          )}
        </div>
      </div>

      {!tournamentId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">Please select a tournament from the Tournaments page to view its rounds.</p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search rounds..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {filteredRounds.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No rounds found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredRounds.map((round) => (
              <div key={round.id}>
                <div
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => toggleRound(round.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {selectedRound === round.id ? (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{round.name}</h3>
                        <div className="flex items-center gap-3 text-sm text-slate-600 mt-1">
                          <span>Round {round.round_number}</span>
                          <span>•</span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            round.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : round.status === 'ongoing'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {round.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isAdmin && (
                        <>
                          <button
                            onClick={(e) => { e.stopPropagation(); generateDraw(round.id); }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                          >
                            Generate Draw
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEdit(round); }}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(round.id); }}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  {round.motion && (
                    <div className="mt-2 ml-8 text-sm text-slate-600">
                      Motion: {round.motion}
                    </div>
                  )}
                </div>

                {selectedRound === round.id && (
                  <div className="px-4 pb-4 bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {debates.map((debate) => (
                        <div
                          key={debate.id}
                          className="bg-white border border-slate-200 rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-slate-900">
                              {debate.rooms?.name || 'Room TBD'}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              debate.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {debate.status}
                            </span>
                          </div>

                          {/* Show assigned motion */}
                          {debate.motion_used && (
                            <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded">
                              <p className="text-xs font-medium text-blue-900 mb-1">Motion:</p>
                              <p className="text-sm text-blue-800 font-medium">{debate.motion_used}</p>
                            </div>
                          )}

                          {/* Show teams - Government vs Opposition */}
                          <div className="space-y-2">
                            {debate.debate_teams?.map((dt: any) => {
                              const team = teams.find(t => t.id === dt.team_id);
                              const isGovernment = dt.position === 'government';
                              const isOpposition = dt.position === 'opposition';
                              const isOG = dt.position === 'OG';
                              
                              return (
                                <div key={dt.id} className={`rounded-lg p-2 border ${
                                  isGovernment ? 'bg-green-50 border-green-200' :
                                  isOpposition ? 'bg-red-50 border-red-200' :
                                  'bg-slate-50 border-slate-200'
                                }`}>
                                  <div className="flex items-center justify-between">
                                    <span className={`text-xs font-bold uppercase ${
                                      isGovernment ? 'text-green-900' :
                                      isOpposition ? 'text-red-900' :
                                      'text-slate-600'
                                    }`}>
                                      {dt.position === 'government' && '🏛️ GOVERNMENT'}
                                      {dt.position === 'opposition' && '⚖️ OPPOSITION'}
                                      {!isGovernment && !isOpposition && dt.position}
                                    </span>
                                    <span className="text-slate-900 font-semibold text-right">
                                      {team?.name || 'Team'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          {debate.debate_adjudicators && debate.debate_adjudicators.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                              <p className="text-xs text-slate-600 mb-1">Judges:</p>
                              <div className="flex flex-wrap gap-1">
                                {debate.debate_adjudicators.map((da: any) => (
                                  <span key={da.id} className="px-2 py-1 bg-slate-100 rounded text-xs">
                                    {adjudicators.find(a => a.id === da.adjudicator_id)?.name || 'Judge'}
                                    {da.role === 'chair' && ' (Chair)'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {debates.length === 0 && (
                        <div className="col-span-full text-center py-4 text-slate-500">
                          No debates yet. Click "Generate Draw" to create pairings.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {editingId ? 'Edit Round' : 'Create Round'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {!tournamentId && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Tournament *
                  </label>
                  <select
                    value={formData.tournament_id}
                    onChange={(e) => setFormData({ ...formData, tournament_id: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-white"
                    required
                  >
                    <option value="">Select Tournament</option>
                    {tournaments.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Round Number *
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.round_number}
                  onChange={(e) => setFormData({ ...formData, round_number: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Round Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  placeholder="e.g., Round 1, Preliminary 1, Quarter Finals"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Motion 1 * (Required)
                </label>
                <textarea
                  value={formData.motion_1}
                  onChange={(e) => setFormData({ ...formData, motion_1: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  rows={2}
                  placeholder="e.g., THW support universal basic income"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Motion 2 (Optional)
                </label>
                <textarea
                  value={formData.motion_2}
                  onChange={(e) => setFormData({ ...formData, motion_2: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  rows={2}
                  placeholder="e.g., THW ban single-use plastics"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Motion 3 (Optional)
                </label>
                <textarea
                  value={formData.motion_3}
                  onChange={(e) => setFormData({ ...formData, motion_3: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  rows={2}
                  placeholder="e.g., THW implement wealth tax"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  💡 Tip: Add 3 motions for variety. Each debate will be randomly assigned one motion.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Info Slide
                </label>
                <textarea
                  value={formData.info_slide}
                  onChange={(e) => setFormData({ ...formData, info_slide: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  rows={3}
                  placeholder="Additional information..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as 'setup' | 'ongoing' | 'completed' })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-white"
                >
                  <option value="setup">Setup</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {editingId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
