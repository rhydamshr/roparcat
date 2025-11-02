import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Search, Users, Upload, Download, Share2 } from 'lucide-react';

type Institution = {
  id: string;
  name: string;
};

type Team = {
  id: string;
  name: string;
  institution_id: string | null;
  speaker_names: string[];
  total_points: number;
  total_speaks: number;
  rounds_count: number;
  institutions?: Institution;
};

export default function Teams() {
  const { isAdmin } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    institution_id: '',
    speaker_names: ['', '', ''] // 3 speakers for Asian Parliamentary
  });
  const [error, setError] = useState('');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importData, setImportData] = useState('');
  const [importError, setImportError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [teamsRes, institutionsRes] = await Promise.all([
        supabase
          .from('teams')
          .select('*, institutions(id, name)')
          .order('name'),
        supabase
          .from('institutions')
          .select('id, name')
          .order('name')
      ]);

      if (teamsRes.error) throw teamsRes.error;
      if (institutionsRes.error) throw institutionsRes.error;

      setTeams(teamsRes.data || []);
      setInstitutions(institutionsRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const filteredSpeakers = formData.speaker_names.filter(name => name.trim() !== '');

    try {
      if (editingId) {
        const { error } = await supabase
          .from('teams')
          .update({
            name: formData.name,
            institution_id: formData.institution_id || null,
            speaker_names: filteredSpeakers
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('teams')
          .insert({
            name: formData.name,
            institution_id: formData.institution_id || null,
            speaker_names: filteredSpeakers
          });

        if (error) throw error;
      }

      setShowModal(false);
      setFormData({ name: '', institution_id: '', speaker_names: ['', '', ''] });
      setEditingId(null);
      fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEdit = (team: Team) => {
    setEditingId(team.id);
    // Ensure at least 3 speaker fields for Asian Parliamentary
    const speakers = team.speaker_names.length > 0 ? team.speaker_names : ['', '', ''];
    while (speakers.length < 3) {
      speakers.push('');
    }
    setFormData({
      name: team.name,
      institution_id: team.institution_id || '',
      speaker_names: speakers.slice(0, 3) // Keep only first 3
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team?')) return;

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting team:', error);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', institution_id: '', speaker_names: ['', '', ''] });
    setShowModal(true);
    setError('');
  };

  const updateSpeaker = (index: number, value: string) => {
    const newSpeakers = [...formData.speaker_names];
    newSpeakers[index] = value;
    setFormData({ ...formData, speaker_names: newSpeakers });
  };

  const addSpeakerField = () => {
    setFormData({ ...formData, speaker_names: [...formData.speaker_names, ''] });
  };

  const removeSpeakerField = (index: number) => {
    const newSpeakers = formData.speaker_names.filter((_, i) => i !== index);
    setFormData({ ...formData, speaker_names: newSpeakers });
  };

  const handleExport = () => {
    const csv = teams.map(team => ({
      name: team.name,
      institution: team.institutions?.name || '',
      speaker1: team.speaker_names[0] || '',
      speaker2: team.speaker_names[1] || '',
      speaker3: team.speaker_names[2] || ''
    }));

    const headers = Object.keys(csv[0]).join(',');
    const rows = csv.map(row => Object.values(row).join(','));
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teams.csv';
    a.click();
  };

  const handleImport = async () => {
    setImportError('');
    
    try {
      const lines = importData.trim().split('\n');
      if (lines.length < 2) {
        throw new Error('CSV must have at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim());
      if (!headers.includes('name')) {
        throw new Error('CSV must include a "name" column');
      }

      const teams = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;
        
        const team: any = {};
        headers.forEach((header, index) => {
          team[header] = values[index] || null;
        });
        
        if (team.name) {
          // Find institution by name if provided
          if (team.institution) {
            const institution = institutions.find(inst => 
              inst.name.toLowerCase() === team.institution.toLowerCase()
            );
            team.institution_id = institution?.id || null;
            delete team.institution;
          }
          
          // Collect speaker names
          const speakerNames = [];
          if (team.speaker1) speakerNames.push(team.speaker1);
          if (team.speaker2) speakerNames.push(team.speaker2);
          if (team.speaker3) speakerNames.push(team.speaker3);
          
          team.speaker_names = speakerNames;
          
          // Remove individual speaker columns
          delete team.speaker1;
          delete team.speaker2;
          delete team.speaker3;
          
          teams.push(team);
        }
      }

      if (teams.length === 0) {
        throw new Error('No valid teams found in CSV');
      }

      const { error } = await supabase
        .from('teams')
        .insert(teams);

      if (error) throw error;

      setShowImportModal(false);
      setImportData('');
      fetchData();
      alert(`Successfully imported ${teams.length} teams`);
    } catch (error: any) {
      setImportError(error.message);
    }
  };

  const handleShare = async (teamId: string) => {
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/team/${teamId}`;
    
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Link copied to clipboard!\n\nShare this URL with the team:\n' + shareUrl);
    } catch (error) {
      // Fallback if clipboard API fails
      const textarea = document.createElement('textarea');
      textarea.value = shareUrl;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      alert('Link copied to clipboard!\n\nShare this URL with the team:\n' + shareUrl);
    }
  };

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.institutions?.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-slate-900">Teams</h1>
          <p className="text-slate-600 mt-1">Manage participating teams</p>
        </div>
        {isAdmin && (
          <div className="flex gap-2">
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export CSV
            </button>
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <Upload className="w-5 h-5" />
              Import CSV
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Team
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {filteredTeams.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No teams found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Team Name
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Institution
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Speakers
                  </th>
                  <th className="text-center px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Points
                  </th>
                  {isAdmin && (
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredTeams.map((team) => (
                  <tr key={team.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {team.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {team.institutions?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {team.speaker_names.length > 0 ? team.speaker_names.join(', ') : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-center font-medium text-slate-900">
                      {team.total_points}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleShare(team.id)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Share team link"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(team)}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(team.id)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 my-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {editingId ? 'Edit Team' : 'Add Team'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Team Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                  placeholder="e.g., Harvard A"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Institution
                </label>
                <select
                  value={formData.institution_id}
                  onChange={(e) => setFormData({ ...formData, institution_id: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none bg-white"
                >
                  <option value="">Select Institution</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.id}>{inst.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Speakers (3 required for Asian Parliamentary)
                </label>
                {formData.speaker_names.map((speaker, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={speaker}
                      onChange={(e) => updateSpeaker(index, e.target.value)}
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                      placeholder={`Speaker ${index + 1} ${index === 0 ? '(First)' : index === 1 ? '(Second)' : index === 2 ? '(Third)' : ''}`}
                    />
                    {formData.speaker_names.length > 3 && (
                      <button
                        type="button"
                        onClick={() => removeSpeakerField(index)}
                        className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {formData.speaker_names.length < 6 && (
                  <button
                    type="button"
                    onClick={addSpeakerField}
                    className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" />
                    Add Speaker
                  </button>
                )}
                {formData.speaker_names.length === 3 && (
                  <p className="text-xs text-blue-600 mt-1">✓ Ready for Asian Parliamentary (3 speakers)</p>
                )}
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
                  {editingId ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Import Teams</h2>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">CSV Format:</h3>
              <p className="text-sm text-blue-800 mb-2">Required columns: name, institution, speaker1, speaker2, speaker3</p>
              <p className="text-xs text-blue-700">Example:</p>
              <pre className="text-xs bg-white p-2 rounded border mt-1">
{`name,institution,speaker1,speaker2,speaker3
Oxford Union,Oxford University,Alice Johnson,Bob Smith,Carol Davis
Cambridge Union,Cambridge University,David Wilson,Eva Brown,Frank Miller`}
              </pre>
            </div>

            {importError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {importError}
              </div>
            )}

            <textarea
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              className="w-full h-64 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none font-mono text-sm"
              placeholder="Paste your CSV data here..."
            />

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowImportModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="flex-1 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
