import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Search } from 'lucide-react';
import { useParams } from 'react-router-dom';

type Debate = {
  id: string;
  round_id: string;
  room_id: string | null;
  status: 'pending' | 'completed';
  rooms?: { name: string };
  debate_teams?: {
    id: string;
    team_id: string;
    position: 'OG' | 'OO' | 'CG' | 'CO';
    points: number;
    total_speaks: number;
    rank: number | null;
    teams?: { name: string };
  }[];
  debate_adjudicators?: {
    id: string;
    adjudicator_id: string;
    role: 'chair' | 'panelist' | 'trainee';
    adjudicators?: { name: string };
  }[];
};

type SpeakerScore = {
  speaker_name: string;
  score: number;
  position: 1 | 2;
};

export default function DebateResults() {
  const { roundId } = useParams<{ roundId: string }>();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedDebate, setExpandedDebate] = useState<string | null>(null);
  const [scores, setScores] = useState<Record<string, SpeakerScore[]>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (roundId) {
      fetchDebates();
    }
  }, [roundId]);

  const fetchDebates = async () => {
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
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (debateTeamId: string, speakerIndex: number, field: 'speaker_name' | 'score', value: string | number) => {
    const debateTeam = scores[debateTeamId] || [];
    const newScore = [...debateTeam];
    if (!newScore[speakerIndex]) {
      newScore[speakerIndex] = { speaker_name: '', score: 0, position: (speakerIndex + 1) as 1 | 2 };
    }
    newScore[speakerIndex] = {
      ...newScore[speakerIndex],
      [field]: value
    };
    setScores({ ...scores, [debateTeamId]: newScore });
  };

  const handleSaveResults = async (debateId: string) => {
    try {
      const debateTeamIds = debates.find(d => d.id === debateId)?.debate_teams?.map(dt => dt.id) || [];
      
      // Update debate teams with points and speaks
      for (const teamId of debateTeamIds) {
        const teamData = debates.find(d => d.id === debateId)?.debate_teams?.find(dt => dt.id === teamId);
        if (!teamData) continue;

        const speakerScores = scores[teamId] || [];
        const totalSpeaks = speakerScores.reduce((sum, s) => sum + s.score, 0);

        await supabase
          .from('debate_teams')
          .update({
            points: teamData.points || 0,
            total_speaks: totalSpeaks,
            rank: teamData.rank || null
          })
          .eq('id', teamId);

        // Update speaker scores
        for (const score of speakerScores) {
          if (score.speaker_name && score.score > 0) {
            await supabase
              .from('speaker_scores')
              .upsert({
                debate_team_id: teamId,
                speaker_name: score.speaker_name,
                score: score.score,
                position: score.position
              });
          }
        }
      }

      // Mark debate as completed
      await supabase
        .from('debates')
        .update({ status: 'completed' })
        .eq('id', debateId);

      alert('Results saved successfully!');
      fetchDebates();
    } catch (error: any) {
      setError(error.message);
      alert('Error saving results: ' + error.message);
    }
  };

  const handlePointsChange = (debateId: string, teamId: string, value: number) => {
    const debate = debates.find(d => d.id === debateId);
    if (!debate) return;

    const updatedTeams = debate.debate_teams?.map(dt => {
      if (dt.id === teamId) {
        return { ...dt, points: value };
      }
      return dt;
    });

    const updatedDebate = { ...debate, debate_teams: updatedTeams };
    const updatedDebates = debates.map(d => d.id === debateId ? updatedDebate : d);
    setDebates(updatedDebates);
  };

  const handleRankChange = (debateId: string, teamId: string, value: number) => {
    const debate = debates.find(d => d.id === debateId);
    if (!debate) return;

    const updatedTeams = debate.debate_teams?.map(dt => {
      if (dt.id === teamId) {
        return { ...dt, rank: value };
      }
      return dt;
    });

    const updatedDebate = { ...debate, debate_teams: updatedTeams };
    const updatedDebates = debates.map(d => d.id === debateId ? updatedDebate : d);
    setDebates(updatedDebates);
  };

  const toggleExpanded = (debateId: string) => {
    setExpandedDebate(expandedDebate === debateId ? null : debateId);
  };

  const filteredDebates = debates.filter(debate => 
    debate.rooms?.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-slate-900">Enter Results</h1>
          <p className="text-slate-600 mt-1">Record debate results and speaker scores</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {filteredDebates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500">No debates found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredDebates.map((debate) => (
              <div key={debate.id}>
                <div
                  className="p-4 hover:bg-slate-50 transition-colors cursor-pointer"
                  onClick={() => toggleExpanded(debate.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        {debate.rooms?.name || 'Room TBD'}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          debate.status === 'completed'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {debate.status}
                        </span>
                        <span className="text-sm text-slate-600">
                          {debate.debate_teams?.length || 0} teams
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleSaveResults(debate.id); }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                        debate.status === 'completed'
                          ? 'bg-green-600 text-white hover:bg-green-700'
                          : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      <Save className="w-4 h-4" />
                      {debate.status === 'completed' ? 'Update' : 'Save'} Results
                    </button>
                  </div>
                </div>

                {expandedDebate === debate.id && (
                  <div className="px-4 pb-4 bg-slate-50">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {debate.debate_teams?.map((dt) => (
                        <div key={dt.id} className="bg-white border border-slate-200 rounded-lg p-4">
                          <div className="mb-3">
                            <h4 className="font-semibold text-slate-900">{dt.teams?.name || 'Team'}</h4>
                            <p className="text-sm text-slate-600">{dt.position}</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs text-slate-600">Points</label>
                              <input
                                type="number"
                                min="0"
                                max="3"
                                value={dt.points || 0}
                                onChange={(e) => handlePointsChange(debate.id, dt.id, parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
                              />
                            </div>
                            
                            <div>
                              <label className="text-xs text-slate-600">Rank</label>
                              <input
                                type="number"
                                min="1"
                                max="4"
                                value={dt.rank || ''}
                                onChange={(e) => handleRankChange(debate.id, dt.id, parseInt(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-slate-600">Speaker 1 Name</label>
                              <input
                                type="text"
                                value={scores[dt.id]?.[0]?.speaker_name || ''}
                                onChange={(e) => handleScoreChange(dt.id, 0, 'speaker_name', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm mb-2"
                              />
                              <input
                                type="number"
                                min="60"
                                max="100"
                                step="0.5"
                                value={scores[dt.id]?.[0]?.score || 0}
                                onChange={(e) => handleScoreChange(dt.id, 0, 'score', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
                                placeholder="Score"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-slate-600">Speaker 2 Name</label>
                              <input
                                type="text"
                                value={scores[dt.id]?.[1]?.speaker_name || ''}
                                onChange={(e) => handleScoreChange(dt.id, 1, 'speaker_name', e.target.value)}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm mb-2"
                              />
                              <input
                                type="number"
                                min="60"
                                max="100"
                                step="0.5"
                                value={scores[dt.id]?.[1]?.score || 0}
                                onChange={(e) => handleScoreChange(dt.id, 1, 'score', parseFloat(e.target.value))}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
                                placeholder="Score"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {debate.debate_adjudicators && debate.debate_adjudicators.length > 0 && (
                      <div className="mt-4 p-3 bg-slate-100 rounded-lg">
                        <p className="text-sm font-medium text-slate-900 mb-2">Judges:</p>
                        <div className="flex flex-wrap gap-2">
                          {debate.debate_adjudicators.map((da) => (
                            <span key={da.id} className="px-3 py-1 bg-white rounded text-sm text-slate-700">
                              {da.adjudicators?.name || 'Judge'}
                              {da.role === 'chair' && ' (Chair)'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


