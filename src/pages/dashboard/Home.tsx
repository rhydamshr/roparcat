import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, UserCheck, Building2, DoorOpen, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type Stats = {
  teams: number;
  adjudicators: number;
  institutions: number;
  rooms: number;
  tournaments: number;
};

export default function Home() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({
    teams: 0,
    adjudicators: 0,
    institutions: 0,
    rooms: 0,
    tournaments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [teams, adjudicators, institutions, rooms, tournaments] = await Promise.all([
        supabase.from('teams').select('id', { count: 'exact', head: true }),
        supabase.from('adjudicators').select('id', { count: 'exact', head: true }),
        supabase.from('institutions').select('id', { count: 'exact', head: true }),
        supabase.from('rooms').select('id', { count: 'exact', head: true }),
        supabase.from('tournaments').select('id', { count: 'exact', head: true })
      ]);

      setStats({
        teams: teams.count || 0,
        adjudicators: adjudicators.count || 0,
        institutions: institutions.count || 0,
        rooms: rooms.count || 0,
        tournaments: tournaments.count || 0
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      label: 'Institutions',
      value: stats.institutions,
      icon: Building2,
      color: 'bg-blue-500',
      path: '/dashboard/institutions'
    },
    {
      label: 'Teams',
      value: stats.teams,
      icon: Users,
      color: 'bg-green-500',
      path: '/dashboard/teams'
    },
    {
      label: 'Adjudicators',
      value: stats.adjudicators,
      icon: UserCheck,
      color: 'bg-orange-500',
      path: '/dashboard/adjudicators'
    },
    {
      label: 'Rooms',
      value: stats.rooms,
      icon: DoorOpen,
      color: 'bg-purple-500',
      path: '/dashboard/rooms'
    },
    {
      label: 'Tournaments',
      value: stats.tournaments,
      icon: Trophy,
      color: 'bg-red-500',
      path: '/dashboard/tournaments'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-600 mt-1">Welcome to the tournament management system</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-8">
        {statCards.map((card) => (
          <button
            key={card.label}
            onClick={() => navigate(card.path)}
            className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all hover:scale-105 text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-1">{card.value}</h3>
            <p className="text-slate-600 text-sm">{card.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/dashboard/tournaments')}
              className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <p className="font-medium text-slate-900">Create New Tournament</p>
              <p className="text-sm text-slate-600">Start organizing a new debate tournament</p>
            </button>
            <button
              onClick={() => navigate('/dashboard/teams')}
              className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <p className="font-medium text-slate-900">Register Teams</p>
              <p className="text-sm text-slate-600">Add new teams to the system</p>
            </button>
            <button
              onClick={() => navigate('/dashboard/rounds')}
              className="w-full text-left px-4 py-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <p className="font-medium text-slate-900">Manage Rounds</p>
              <p className="text-sm text-slate-600">Create and manage tournament rounds</p>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                1
              </div>
              <div>
                <p className="font-medium text-slate-900">Add Institutions</p>
                <p className="text-sm text-slate-600">Register participating universities or organizations</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                2
              </div>
              <div>
                <p className="font-medium text-slate-900">Register Teams & Adjudicators</p>
                <p className="text-sm text-slate-600">Add teams and judges to the system</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                3
              </div>
              <div>
                <p className="font-medium text-slate-900">Setup Rooms</p>
                <p className="text-sm text-slate-600">Configure available debate rooms</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-slate-900 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                4
              </div>
              <div>
                <p className="font-medium text-slate-900">Create Tournament & Rounds</p>
                <p className="text-sm text-slate-600">Set up tournament structure and generate draws</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
