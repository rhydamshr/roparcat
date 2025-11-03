import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Search, FileText, Users, Award, ChevronRight, ChevronDown, Upload, Download, RefreshCw, Trophy, ArrowRight } from 'lucide-react';
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
  round_type?: 'inround' | 'outround';
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
  const [showBreaksModal, setShowBreaksModal] = useState(false);
  const [breakingTeams, setBreakingTeams] = useState<any[]>([]);
  const [semiFinalDraws, setSemiFinalDraws] = useState<{ team1: string; team2: string; adjudicator: string; room: string }[]>([
    { team1: '', team2: '', adjudicator: '', room: '' },
    { team1: '', team2: '', adjudicator: '', room: '' }
  ]);
  const [semiFinalMotions, setSemiFinalMotions] = useState({ motion_1: '', motion_2: '', motion_3: '' });
  const [showFinalsModal, setShowFinalsModal] = useState(false);
  const [finalsMotions, setFinalsMotions] = useState({ motion_1: '', motion_2: '', motion_3: '' });
  const [finalsDraw, setFinalsDraw] = useState({ adjudicator: '', room: '' });
  const [finalsRoundId, setFinalsRoundId] = useState<string | null>(null);
  const [qualifiedFinalists, setQualifiedFinalists] = useState<any[]>([]);

  // Draw Editor state
  const [showDrawEditor, setShowDrawEditor] = useState(false);
  const [editorRoundId, setEditorRoundId] = useState<string | null>(null);
  const [draftDebates, setDraftDebates] = useState<Array<{
    room_id: string | null;
    motion_used: string;
    adjudicator_id: string | null;
    team1_id: string | null;
    team2_id: string | null;
  }>>([]);

  useEffect(() => {
    fetchData();
    checkForFinalsEligibility();
  }, [tournamentId]);

  // Check if semi-finals are completed and auto-qualify winners to finals
  const checkForFinalsEligibility = async () => {
    if (!tournamentId) return;

    try {
      // Find semi-final rounds
      const { data: semiFinals } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', tournamentId)
        .like('name', 'Semi-Final%')
        .eq('round_type', 'outround');

      if (!semiFinals || semiFinals.length < 2) return;

      // Check if both semi-finals are completed
      const bothCompleted = semiFinals.every(sf => sf.status === 'completed');

      if (!bothCompleted) return;

      // Check if finals already exists
      const { data: existingFinals } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', tournamentId)
        .eq('name', 'Finals')
        .eq('round_type', 'outround');

      if (existingFinals && existingFinals.length > 0) return; // Finals already exists

      // Auto-generate finals (this will be called automatically)
      // We'll show a notification instead of auto-creating to give admin control
      console.log('Both semi-finals completed - ready to generate finals');
    } catch (error) {
      console.error('Error checking finals eligibility:', error);
    }
  };

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

        // Fetch breaking teams if any exist for this tournament
        if (tournamentId) {
          const { data: breakingData } = await supabase
            .from('breaking_teams')
            .select('*, teams(*)')
            .eq('tournament_id', tournamentId);
          
          // This will be used later when creating breaks
        }
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
      const data: any = {
        tournament_id: formData.tournament_id,
        round_number: formData.round_number,
        name: formData.name,
        motion_1: formData.motion_1 || null,
        motion_2: formData.motion_2 || null,
        motion_3: formData.motion_3 || null,
        info_slide: formData.info_slide || null,
        status: formData.status
      };
      
      // Only include round_type if the column exists (for backward compatibility)
      // Try to set it, but don't fail if column doesn't exist
      try {
        data.round_type = 'inround'; // Default to inround for manually created rounds
      } catch (e) {
        // Column might not exist yet - migration not run
      }

      if (editingId) {
        // Preserve round_type when editing - don't override outrounds
        const { data: currentRound } = await supabase
          .from('rounds')
          .select('round_type')
          .eq('id', editingId)
          .single();
        
        // If it's an outround, preserve it; otherwise use inround
        if (currentRound?.round_type === 'outround') {
          data.round_type = 'outround';
        } else if (!currentRound?.round_type) {
          data.round_type = 'inround';
        }
        
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
  
  // Preserve round_type when editing - don't override it
  const handleUpdateRound = async (roundId: string, updates: any) => {
    // Get current round to preserve round_type
    const { data: currentRound } = await supabase
      .from('rounds')
      .select('round_type')
      .eq('id', roundId)
      .single();
    
    // If round_type exists and is outround, preserve it
    if (currentRound?.round_type === 'outround') {
      updates.round_type = 'outround';
    }
    
    return await supabase
      .from('rounds')
      .update(updates)
      .eq('id', roundId);
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

  const openDrawEditor = async (roundId: string) => {
    try {
      // First, remove existing draws for this round
      console.log('Preparing draft by removing existing draws for round:', roundId);
      
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

      const availableRooms = rooms;

      // Decide eligible teams
      let eligibleTeams = teams;
      if (roundData.round_type && roundData.round_type === 'outround') {
        const { data: breakingTeamsData } = await supabase
          .from('breaking_teams')
          .select('*, teams(*)')
          .eq('broke_to_round_id', roundId);
        if (breakingTeamsData && breakingTeamsData.length > 0) {
          eligibleTeams = breakingTeamsData.map(bt => ({ ...bt.teams }));
        } else {
          alert('No teams have broken to this round yet. Please generate breaks first.');
          return;
        }
      }

      // Motions available from round
      const motions = [roundData.motion_1, roundData.motion_2, roundData.motion_3].filter(Boolean) as string[];

      // Build initial draft pairings (2 teams per debate for AP)
      const sortedTeams = [...eligibleTeams].sort((a, b) => {
        if ((b.total_points || 0) !== (a.total_points || 0)) return (b.total_points || 0) - (a.total_points || 0);
        return (b.total_speaks || 0) - (a.total_speaks || 0);
      });
      const draft: typeof draftDebates = [];
      const numDebates = Math.min(Math.ceil(sortedTeams.length / 2), availableRooms.length);
      for (let i = 0; i < numDebates; i++) {
        draft.push({
          room_id: availableRooms[i]?.id || null,
          motion_used: motions[0] || '',
          adjudicator_id: adjudicators[0]?.id || null,
          team1_id: sortedTeams[i * 2]?.id || null,
          team2_id: sortedTeams[i * 2 + 1]?.id || null
        });
      }

      setEditorRoundId(roundId);
      setDraftDebates(draft);
      setShowDrawEditor(true);
    } catch (error: any) {
      setError(error.message);
      alert('Error preparing draw editor: ' + error.message);
    }
  };

  const confirmDrawFromEditor = async () => {
    if (!editorRoundId) return;
    try {
      // Create debates from draftDebates
      for (const d of draftDebates) {
        if (!d.team1_id || !d.team2_id || !d.room_id) continue;
        const { data: debate, error: debateError } = await supabase
          .from('debates')
          .insert({ round_id: editorRoundId, room_id: d.room_id, motion_used: d.motion_used || null })
          .select()
          .single();
        if (debateError) continue;
        await supabase.from('debate_teams').insert([
          { debate_id: debate.id, team_id: d.team1_id, position: 'government' },
          { debate_id: debate.id, team_id: d.team2_id, position: 'opposition' }
        ]);
        if (d.adjudicator_id) {
          await supabase.from('debate_adjudicators').insert({ debate_id: debate.id, adjudicator_id: d.adjudicator_id, role: 'chair' });
        }
      }
      // Make round public
      await supabase.from('rounds').update({ status: 'ongoing' }).eq('id', editorRoundId);
      setShowDrawEditor(false);
      fetchData();
      if (selectedRound === editorRoundId) fetchDebates(editorRoundId);
      alert('Draw generated and published.');
    } catch (error: any) {
      alert('Error generating draw: ' + error.message);
    }
  };

  const openBreaksModal = async () => {
    if (!tournamentId) {
      alert('Please select a tournament first');
      return;
    }

    try {
      // Get top teams ordered by total_points, then average speaks
      const { data: teamsData, error: teamsError } = await supabase
        .from('teams')
        .select('*, institutions(name)')
        .order('total_points', { ascending: false });

      if (teamsError) throw teamsError;

      // Sort by total_points first, then total_speaks
      const teamsSorted = (teamsData || []).sort((a, b) => {
        // Sort by total_points first
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points;
        }
        // Then by total_speaks
        return b.total_speaks - a.total_speaks;
      });

      // Get top 4 teams for semi-finals
      const top4 = teamsSorted.slice(0, 4);
      setBreakingTeams(top4);
      
      // Initialize semi-final draws with default teams
      setSemiFinalDraws([
        { team1: top4[0]?.id || '', team2: top4[3]?.id || '', adjudicator: '', room: '' },
        { team1: top4[1]?.id || '', team2: top4[2]?.id || '', adjudicator: '', room: '' }
      ]);
      
      // Reset motions
      setSemiFinalMotions({ motion_1: '', motion_2: '', motion_3: '' });

      setShowBreaksModal(true);
    } catch (error: any) {
      alert('Error fetching teams: ' + error.message);
    }
  };

  const generateBreaks = async () => {
    if (!tournamentId) return;

    // Validate that all semi-final draws have teams, adjudicators, and rooms
    const hasEmptyDraw = semiFinalDraws.some(draw => !draw.team1 || !draw.team2 || !draw.adjudicator || !draw.room);
    if (hasEmptyDraw) {
      alert('Please ensure both semi-finals have two teams, an adjudicator, and a room selected');
      return;
    }

    // Validate motions
    if (!semiFinalMotions.motion_1) {
      alert('Please enter at least Motion 1 for the semi-finals');
      return;
    }

    try {
      // Find the last round to determine next round number
      const { data: lastRound } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: false })
        .limit(1);

      const lastRoundNumber = lastRound && lastRound.length > 0 ? lastRound[0].round_number : 0;
      const semiFinalRoundNumber = lastRoundNumber + 1;

      // Create Semi-Final 1 round with motions
      const semiFinal1Data: any = {
        tournament_id: tournamentId,
        round_number: semiFinalRoundNumber,
        name: 'Semi-Final 1',
        motion_1: semiFinalMotions.motion_1,
        motion_2: semiFinalMotions.motion_2 || null,
        motion_3: semiFinalMotions.motion_3 || null,
        info_slide: '',
        status: 'setup',
        round_type: 'outround'
      };
      
      // Try to add round_type, but handle if column doesn't exist
      try {
        semiFinal1Data.round_type = 'outround';
      } catch (e) {
        // Column might not exist - migration not run
      }

      const { data: semiFinal1, error: semiFinal1Error } = await supabase
        .from('rounds')
        .insert(semiFinal1Data)
        .select()
        .single();

      if (semiFinal1Error) {
        // If error is about missing column, provide helpful message
        if (semiFinal1Error.message.includes('round_type') || semiFinal1Error.message.includes('column')) {
          throw new Error('Database migration not run. Please run the migration file: supabase/migrations/20251026100948_add_breaks_feature.sql in your Supabase SQL Editor first.');
        }
        throw semiFinal1Error;
      }

      // Create Semi-Final 2 round with motions
      const semiFinal2Data: any = {
        tournament_id: tournamentId,
        round_number: semiFinalRoundNumber + 1,
        name: 'Semi-Final 2',
        motion_1: semiFinalMotions.motion_1,
        motion_2: semiFinalMotions.motion_2 || null,
        motion_3: semiFinalMotions.motion_3 || null,
        info_slide: '',
        status: 'setup',
        round_type: 'outround'
      };
      
      try {
        semiFinal2Data.round_type = 'outround';
      } catch (e) {
        // Column might not exist - migration not run
      }

      const { data: semiFinal2, error: semiFinal2Error } = await supabase
        .from('rounds')
        .insert(semiFinal2Data)
        .select()
        .single();

      if (semiFinal2Error) {
        if (semiFinal2Error.message.includes('round_type') || semiFinal2Error.message.includes('column')) {
          throw new Error('Database migration not run. Please run the migration file: supabase/migrations/20251026100948_add_breaks_feature.sql in your Supabase SQL Editor first.');
        }
        throw semiFinal2Error;
      }

      // Record breaking teams for Semi-Final 1
      const semi1Teams = [
        { team_id: semiFinalDraws[0].team1, break_rank: 1 },
        { team_id: semiFinalDraws[0].team2, break_rank: 4 }
      ];

      for (const team of semi1Teams) {
        await supabase
          .from('breaking_teams')
          .insert({
            tournament_id: tournamentId,
            team_id: team.team_id,
            round_id: semiFinal1.id,
            break_rank: team.break_rank,
            broke_to_round_id: semiFinal1.id
          });
      }

      // Record breaking teams for Semi-Final 2
      const semi2Teams = [
        { team_id: semiFinalDraws[1].team1, break_rank: 2 },
        { team_id: semiFinalDraws[1].team2, break_rank: 3 }
      ];

      for (const team of semi2Teams) {
        await supabase
          .from('breaking_teams')
          .insert({
            tournament_id: tournamentId,
            team_id: team.team_id,
            round_id: semiFinal2.id,
            break_rank: team.break_rank,
            broke_to_round_id: semiFinal2.id
          });
      }

      // Now generate draws for both semi-finals (create debates, assign teams, adjudicators, rooms)
      await generateSemiFinalDraw(semiFinal1.id, semiFinalDraws[0], semiFinalMotions);
      await generateSemiFinalDraw(semiFinal2.id, semiFinalDraws[1], semiFinalMotions);

      alert('Breaks generated successfully! Semi-final rounds, draws, and assignments have been created and made public.');
      setShowBreaksModal(false);
      fetchData();
    } catch (error: any) {
      alert('Error generating breaks: ' + error.message);
      console.error(error);
    }
  };

  const generateSemiFinalDraw = async (roundId: string, draw: { team1: string; team2: string; adjudicator: string; room: string }, motions: { motion_1: string; motion_2: string; motion_3: string }) => {
    try {
      // Create debate
      const availableMotions = [motions.motion_1, motions.motion_2, motions.motion_3].filter(m => m && m.trim() !== '');
      const randomMotion = availableMotions.length > 0 
        ? availableMotions[Math.floor(Math.random() * availableMotions.length)]
        : motions.motion_1;

      const { data: debate, error: debateError } = await supabase
        .from('debates')
        .insert({
          round_id: roundId,
          room_id: draw.room,
          motion_used: randomMotion,
          status: 'pending'
        })
        .select()
        .single();

      if (debateError) throw debateError;

      // Assign teams (AP format: government vs opposition)
      await supabase
        .from('debate_teams')
        .insert([
          {
            debate_id: debate.id,
            team_id: draw.team1,
            position: 'government'
          },
          {
            debate_id: debate.id,
            team_id: draw.team2,
            position: 'opposition'
          }
        ]);

      // Assign adjudicator as chair
      await supabase
        .from('debate_adjudicators')
        .insert({
          debate_id: debate.id,
          adjudicator_id: draw.adjudicator,
          role: 'chair'
        });

      // Update round status to ongoing to make it public
      await supabase
        .from('rounds')
        .update({ status: 'ongoing' })
        .eq('id', roundId);

    } catch (error: any) {
      console.error('Error generating semi-final draw:', error);
      throw error;
    }
  };

  const generateFinals = async () => {
    if (!tournamentId) return;

    try {
      // Find all semi-final rounds
      const { data: semiFinals, error: semiFinalsError } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', tournamentId)
        .like('name', 'Semi-Final%')
        .eq('round_type', 'outround');

      if (semiFinalsError) throw semiFinalsError;

      if (!semiFinals || semiFinals.length < 2) {
        alert('Please complete both semi-finals first');
        return;
      }

      // Check if finals already exists
      const { data: existingFinals } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', tournamentId)
        .ilike('name', '%Final%')
        .neq('name', 'Semi-Final 1')
        .neq('name', 'Semi-Final 2');

      if (existingFinals && existingFinals.length > 0) {
        if (!confirm('A finals round already exists. Create another?')) return;
      }

      // Get winners from each semi-final (rank 1 teams)
      const winners: string[] = [];

      for (const semiFinal of semiFinals) {
        // Get debates in this semi-final
        const { data: debates } = await supabase
          .from('debates')
          .select('id')
          .eq('round_id', semiFinal.id);

        if (!debates || debates.length === 0) {
          alert(`Semi-Final "${semiFinal.name}" has no debates. Please generate draws first.`);
          return;
        }

        // Get winning team (rank 1) from the first debate in this semi-final
        // Each semi-final should have exactly one debate with 2 teams
        const debate = debates[0]; // Get first debate
        
        const { data: debateTeams } = await supabase
          .from('debate_teams')
          .select('*, teams(*)')
          .eq('debate_id', debate.id)
          .eq('rank', 1)
          .limit(1);

        if (debateTeams && debateTeams.length > 0) {
          winners.push(debateTeams[0].team_id);
        } else {
          alert(`Semi-Final "${semiFinal.name}" results are not complete. Please enter results first.`);
          return;
        }
      }

      if (winners.length < 2) {
        alert('Could not determine winners from both semi-finals. Please ensure results are entered.');
        return;
      }

      // Find the last round number
      const { data: lastRound } = await supabase
        .from('rounds')
        .select('*')
        .eq('tournament_id', tournamentId)
        .order('round_number', { ascending: false })
        .limit(1);

      const lastRoundNumber = lastRound && lastRound.length > 0 ? lastRound[0].round_number : 0;

      // Create Finals round
      const finalsData: any = {
        tournament_id: tournamentId,
        round_number: lastRoundNumber + 1,
        name: 'Finals',
        motion_1: '',
        motion_2: '',
        motion_3: '',
        info_slide: '',
        status: 'setup'
      };
      
      try {
        finalsData.round_type = 'outround';
      } catch (e) {
        // Column might not exist - migration not run
      }

      const { data: finalsRound, error: finalsError } = await supabase
        .from('rounds')
        .insert(finalsData)
        .select()
        .single();

      if (finalsError) {
        if (finalsError.message.includes('round_type') || finalsError.message.includes('column')) {
          throw new Error('Database migration not run. Please run the migration file: supabase/migrations/20251026100948_add_breaks_feature.sql in your Supabase SQL Editor first.');
        }
        throw finalsError;
      }

      // Record breaking teams for Finals
      for (let i = 0; i < winners.length; i++) {
        await supabase
          .from('breaking_teams')
          .insert({
            tournament_id: tournamentId,
            team_id: winners[i],
            round_id: finalsRound.id,
            break_rank: i + 1,
            broke_to_round_id: finalsRound.id
          });
      }

      alert('Finals round created! Winners from both semi-finals have been automatically qualified. Now edit the Finals round to add motions, then generate the draw.');
      fetchData();
      checkForFinalsEligibility(); // Refresh the check
    } catch (error: any) {
      alert('Error generating finals: ' + error.message);
      console.error(error);
    }
  };

  const canGenerateFinals = () => {
    if (!tournamentId) return false;
    
    // Check if both semi-finals exist and are completed
    const semiFinals = rounds.filter(r => 
      r.name?.startsWith('Semi-Final') && r.round_type === 'outround'
    );

    if (semiFinals.length < 2) return false;

    // Check if finals already exists
    const finalsExists = rounds.some(r => 
      r.name === 'Finals' && r.round_type === 'outround'
    );

    // Check if both semi-finals have completed debates
    const bothHaveCompletedDebates = semiFinals.every(sf => {
      // This will be checked when we try to generate finals
      return true;
    });

    return !finalsExists && semiFinals.every(sf => sf.status === 'completed');
  };

  const openFinalsDrawModal = async () => {
    if (!tournamentId) return;

    // Find the Finals round
    const finalsRound = rounds.find(r => r.name === 'Finals' && r.round_type === 'outround');
    if (!finalsRound) {
      alert('Finals round not found. Please generate finals first.');
      return;
    }

    setFinalsRoundId(finalsRound.id);
    
    // Check if motions are already set
    if (finalsRound.motion_1) {
      setFinalsMotions({
        motion_1: finalsRound.motion_1 || '',
        motion_2: finalsRound.motion_2 || '',
        motion_3: finalsRound.motion_3 || ''
      });
    } else {
      setFinalsMotions({ motion_1: '', motion_2: '', motion_3: '' });
    }

    // Fetch qualified teams
    const { data: qualifiedTeams } = await supabase
      .from('breaking_teams')
      .select('*, teams(*, institutions(name))')
      .eq('broke_to_round_id', finalsRound.id)
      .order('break_rank');
    
    setQualifiedFinalists(qualifiedTeams || []);

    // Reset draw settings
    setFinalsDraw({ adjudicator: '', room: '' });

    setShowFinalsModal(true);
  };

  const generateFinalsDraw = async () => {
    if (!finalsRoundId || !tournamentId) return;

    // Validate motions
    if (!finalsMotions.motion_1) {
      alert('Please enter at least Motion 1 for the finals');
      return;
    }

    // Validate adjudicator and room
    if (!finalsDraw.adjudicator || !finalsDraw.room) {
      alert('Please select an adjudicator and room for the finals');
      return;
    }

    try {
      // Update finals round with motions
      await supabase
        .from('rounds')
        .update({
          motion_1: finalsMotions.motion_1,
          motion_2: finalsMotions.motion_2 || null,
          motion_3: finalsMotions.motion_3 || null
        })
        .eq('id', finalsRoundId);

      // Get teams that have broken to finals
      const { data: breakingTeamsData } = await supabase
        .from('breaking_teams')
        .select('*, teams(*)')
        .eq('broke_to_round_id', finalsRoundId)
        .order('break_rank');

      if (!breakingTeamsData || breakingTeamsData.length < 2) {
        alert('Finals round does not have 2 qualified teams. Please generate finals first.');
        return;
      }

      const finalists = breakingTeamsData.map(bt => ({
        ...bt.teams,
        break_rank: bt.break_rank
      }));

      // Create debate
      const availableMotions = [finalsMotions.motion_1, finalsMotions.motion_2, finalsMotions.motion_3].filter(m => m && m.trim() !== '');
      const randomMotion = availableMotions.length > 0 
        ? availableMotions[Math.floor(Math.random() * availableMotions.length)]
        : finalsMotions.motion_1;

      const { data: debate, error: debateError } = await supabase
        .from('debates')
        .insert({
          round_id: finalsRoundId,
          room_id: finalsDraw.room,
          motion_used: randomMotion,
          status: 'pending'
        })
        .select()
        .single();

      if (debateError) throw debateError;

      // Assign teams (AP format: government vs opposition)
      await supabase
        .from('debate_teams')
        .insert([
          {
            debate_id: debate.id,
            team_id: finalists[0].id,
            position: 'government'
          },
          {
            debate_id: debate.id,
            team_id: finalists[1].id,
            position: 'opposition'
          }
        ]);

      // Assign adjudicator as chair
      await supabase
        .from('debate_adjudicators')
        .insert({
          debate_id: debate.id,
          adjudicator_id: finalsDraw.adjudicator,
          role: 'chair'
        });

      // Update round status to ongoing to make it public
      await supabase
        .from('rounds')
        .update({ status: 'ongoing' })
        .eq('id', finalsRoundId);

      alert('Finals draw generated successfully! The draw has been made public to team and adjudicator private URLs.');
      setShowFinalsModal(false);
      fetchData();
      if (selectedRound === finalsRoundId) {
        fetchDebates(finalsRoundId);
      }
    } catch (error: any) {
      alert('Error generating finals draw: ' + error.message);
      console.error(error);
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
          {isAdmin && tournamentId && (
            <>
              <button
                onClick={openBreaksModal}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Trophy className="w-5 h-5" />
                Generate Breaks
              </button>
              {canGenerateFinals() && (
                <button
                  onClick={generateFinals}
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  <Award className="w-5 h-5" />
                  Generate Finals
                </button>
              )}
            </>
          )}
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
                          {round.round_type && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              round.round_type === 'outround'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}>
                              {round.round_type === 'outround' ? 'Outround' : 'Inround'}
                            </span>
                          )}
                          {round.round_type && <span>•</span>}
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
                          {round.name === 'Finals' && round.round_type === 'outround' ? (
                            <button
                              onClick={(e) => { e.stopPropagation(); openFinalsDrawModal(); }}
                              className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                            >
                              Configure Finals Draw
                            </button>
                          ) : (
                            <button
                            onClick={(e) => { e.stopPropagation(); openDrawEditor(round.id); }}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                            Generate Draw
                            </button>
                          )}
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

      {/* Draw Editor Modal */}
      {showDrawEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-5xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Edit Draw</h2>
            <p className="text-slate-600 mb-4">Review and edit debates (teams, room, adjudicator, motion). When you confirm, the round will be published to private URLs.</p>

            <div className="space-y-4">
              {draftDebates.map((d, idx) => (
                <div key={idx} className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-slate-900">Debate {idx + 1}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Team 1 (Gov)</label>
                      <select
                        value={d.team1_id || ''}
                        onChange={(e) => {
                          const nd = [...draftDebates];
                          nd[idx].team1_id = e.target.value || null;
                          setDraftDebates(nd);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                      >
                        <option value="">Select team</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Team 2 (Opp)</label>
                      <select
                        value={d.team2_id || ''}
                        onChange={(e) => {
                          const nd = [...draftDebates];
                          nd[idx].team2_id = e.target.value || null;
                          setDraftDebates(nd);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                      >
                        <option value="">Select team</option>
                        {teams.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Room</label>
                      <select
                        value={d.room_id || ''}
                        onChange={(e) => {
                          const nd = [...draftDebates];
                          nd[idx].room_id = e.target.value || null;
                          setDraftDebates(nd);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                      >
                        <option value="">Select room</option>
                        {rooms.map(r => (
                          <option key={r.id} value={r.id}>{r.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Adjudicator (Chair)</label>
                      <select
                        value={d.adjudicator_id || ''}
                        onChange={(e) => {
                          const nd = [...draftDebates];
                          nd[idx].adjudicator_id = e.target.value || null;
                          setDraftDebates(nd);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-sm"
                      >
                        <option value="">Select adjudicator</option>
                        {adjudicators.map(a => (
                          <option key={a.id} value={a.id}>{a.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-2 lg:col-span-4">
                      <label className="block text-xs font-medium text-slate-700 mb-1">Motion</label>
                      <input
                        value={d.motion_used}
                        onChange={(e) => {
                          const nd = [...draftDebates];
                          nd[idx].motion_used = e.target.value;
                          setDraftDebates(nd);
                        }}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        placeholder="Enter motion"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {draftDebates.length === 0 && (
                <div className="text-slate-500">No debates to configure. Add teams/rooms or motions to this round and try again.</div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowDrawEditor(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDrawFromEditor}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                Publish Draw
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Breaks Modal */}
      {showBreaksModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Trophy className="w-6 h-6 text-purple-600" />
              Generate Breaks - Semi-Finals
            </h2>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Top 4 Teams:</strong> Select which teams will participate in each semi-final. 
                  Winners of both semi-finals will automatically qualify for the finals.
                </p>
              </div>

              {/* Top 4 Teams Display */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Top 4 Teams (Ranked by Points)</h3>
                <div className="grid grid-cols-2 gap-3">
                  {breakingTeams.map((team, index) => (
                    <div key={team.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-slate-900">#{index + 1}</div>
                          <div className="text-sm text-slate-700">{team.name}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            {team.institutions?.name || 'No Institution'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-slate-900">{team.total_points} pts</div>
                          <div className="text-xs text-slate-600">
                            Speaks: {team.total_speaks.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Motions for Semi-Finals */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Motions for Semi-Finals</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Motion 1 * (Required)
                    </label>
                    <textarea
                      value={semiFinalMotions.motion_1}
                      onChange={(e) => setSemiFinalMotions({ ...semiFinalMotions, motion_1: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
                      rows={2}
                      placeholder="e.g., THW support universal basic income"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Motion 2 (Optional)
                    </label>
                    <textarea
                      value={semiFinalMotions.motion_2}
                      onChange={(e) => setSemiFinalMotions({ ...semiFinalMotions, motion_2: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
                      rows={2}
                      placeholder="e.g., THW ban single-use plastics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Motion 3 (Optional)
                    </label>
                    <textarea
                      value={semiFinalMotions.motion_3}
                      onChange={(e) => setSemiFinalMotions({ ...semiFinalMotions, motion_3: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
                      rows={2}
                      placeholder="e.g., THW implement wealth tax"
                    />
                  </div>
                </div>
              </div>

              {/* Semi-Final Draws */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Configure Semi-Final Draws</h3>
                <div className="space-y-4">
                  {semiFinalDraws.map((draw, index) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4 bg-white">
                      <h4 className="font-semibold text-slate-900 mb-3">Semi-Final {index + 1}</h4>
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Team 1
                          </label>
                          <select
                            value={draw.team1}
                            onChange={(e) => {
                              const newDraws = [...semiFinalDraws];
                              newDraws[index].team1 = e.target.value;
                              setSemiFinalDraws(newDraws);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-white text-sm"
                          >
                            <option value="">Select Team</option>
                            {breakingTeams.map(team => (
                              <option key={team.id} value={team.id}>
                                {team.name} ({team.total_points} pts)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center justify-center">
                          <ArrowRight className="w-5 h-5 text-slate-400" />
                          <span className="mx-2 text-slate-600 font-medium">vs</span>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Team 2
                          </label>
                          <select
                            value={draw.team2}
                            onChange={(e) => {
                              const newDraws = [...semiFinalDraws];
                              newDraws[index].team2 = e.target.value;
                              setSemiFinalDraws(newDraws);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-white text-sm"
                          >
                            <option value="">Select Team</option>
                            {breakingTeams.map(team => (
                              <option key={team.id} value={team.id}>
                                {team.name} ({team.total_points} pts)
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* Adjudicator and Room */}
                      <div className="grid grid-cols-2 gap-3 mt-3">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Adjudicator *
                          </label>
                          <select
                            value={draw.adjudicator}
                            onChange={(e) => {
                              const newDraws = [...semiFinalDraws];
                              newDraws[index].adjudicator = e.target.value;
                              setSemiFinalDraws(newDraws);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-white text-sm"
                            required
                          >
                            <option value="">Select Adjudicator</option>
                            {adjudicators.map(adj => (
                              <option key={adj.id} value={adj.id}>
                                {adj.name} (Strength: {adj.strength})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Room *
                          </label>
                          <select
                            value={draw.room}
                            onChange={(e) => {
                              const newDraws = [...semiFinalDraws];
                              newDraws[index].room = e.target.value;
                              setSemiFinalDraws(newDraws);
                            }}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-white text-sm"
                            required
                          >
                            <option value="">Select Room</option>
                            {rooms.map(room => (
                              <option key={room.id} value={room.id}>
                                {room.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Clicking "Generate Draws" will create the semi-final rounds, assign teams, adjudicators, and rooms, and make everything public to team and adjudicator private URLs. After adjudicators submit results, winners will automatically qualify for finals.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBreaksModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={generateBreaks}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                >
                  Generate Draws
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Configure Finals Draw Modal */}
      {showFinalsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-600" />
              Configure Finals Draw
            </h2>

            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Finals:</strong> Configure the motions, adjudicator, and room for the finals debate.
                  The two teams that won their semi-finals will automatically be assigned.
                </p>
              </div>

              {/* Qualified Teams Display */}
              {qualifiedFinalists.length >= 2 && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Qualified Teams</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {qualifiedFinalists.map((bt: any, index: number) => (
                      <div key={bt.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-slate-900">Finalist {index + 1}</div>
                            <div className="text-sm text-slate-700">{bt.teams?.name || 'Team'}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              {bt.teams?.institutions?.name || 'No Institution'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-slate-900">{bt.teams?.total_points || 0} pts</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Motions for Finals */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Motions for Finals</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Motion 1 * (Required)
                    </label>
                    <textarea
                      value={finalsMotions.motion_1}
                      onChange={(e) => setFinalsMotions({ ...finalsMotions, motion_1: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
                      rows={2}
                      placeholder="e.g., THW support universal basic income"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Motion 2 (Optional)
                    </label>
                    <textarea
                      value={finalsMotions.motion_2}
                      onChange={(e) => setFinalsMotions({ ...finalsMotions, motion_2: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
                      rows={2}
                      placeholder="e.g., THW ban single-use plastics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Motion 3 (Optional)
                    </label>
                    <textarea
                      value={finalsMotions.motion_3}
                      onChange={(e) => setFinalsMotions({ ...finalsMotions, motion_3: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none text-sm"
                      rows={2}
                      placeholder="e.g., THW implement wealth tax"
                    />
                  </div>
                </div>
              </div>

              {/* Adjudicator and Room */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Assignment</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Adjudicator *
                    </label>
                    <select
                      value={finalsDraw.adjudicator}
                      onChange={(e) => setFinalsDraw({ ...finalsDraw, adjudicator: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-white text-sm"
                      required
                    >
                      <option value="">Select Adjudicator</option>
                      {adjudicators.map(adj => (
                        <option key={adj.id} value={adj.id}>
                          {adj.name} (Strength: {adj.strength})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Room *
                    </label>
                    <select
                      value={finalsDraw.room}
                      onChange={(e) => setFinalsDraw({ ...finalsDraw, room: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-white text-sm"
                      required
                    >
                      <option value="">Select Room</option>
                      {rooms.map(room => (
                        <option key={room.id} value={room.id}>
                          {room.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Clicking "Generate Draw" will create the finals debate, assign the two qualified teams, adjudicator, and room, and make everything public to team and adjudicator private URLs.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowFinalsModal(false)}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={generateFinalsDraw}
                  className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors font-semibold"
                >
                  Generate Draw
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
