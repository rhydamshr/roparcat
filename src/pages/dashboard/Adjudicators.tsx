import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit2, Trash2, Search, UserCheck, Share2, Check, Upload, Download } from 'lucide-react';

type Institution = {
  id: string;
  name: string;
};

type Adjudicator = {
  id: string;
  name: string;
  institution_id: string | null;
  strength: number;
  email: string | null;
  phone: string | null;
  institutions?: Institution;
};

export default function Adjudicators() {
  const { isAdmin } = useAuth();
  const [adjudicators, setAdjudicators] = useState<Adjudicator[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    institution_id: '',
    strength: 5,
    email: '',
    phone: ''
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
      const [adjsRes, institutionsRes] = await Promise.all([
        supabase
          .from('adjudicators')
          .select('*, institutions(id, name)')
          .order('name'),
        supabase
          .from('institutions')
          .select('id, name')
          .order('name')
      ]);

      if (adjsRes.error) throw adjsRes.error;
      if (institutionsRes.error) throw institutionsRes.error;

      setAdjudicators(adjsRes.data || []);
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

    try {
      const data = {
        name: formData.name,
        institution_id: formData.institution_id || null,
        strength: formData.strength,
        email: formData.email || null,
        phone: formData.phone || null
      };

      if (editingId) {
        const { error } = await supabase
          .from('adjudicators')
          .update(data)
          .eq('id', editingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('adjudicators')
          .insert(data);

        if (error) throw error;
      }

      setShowModal(false);
      setFormData({ name: '', institution_id: '', strength: 5, email: '', phone: '' });
      setEditingId(null);
      fetchData();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleEdit = (adj: Adjudicator) => {
    setEditingId(adj.id);
    setFormData({
      name: adj.name,
      institution_id: adj.institution_id || '',
      strength: adj.strength,
      email: adj.email || '',
      phone: adj.phone || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this adjudicator?')) return;

    try {
      const { error } = await supabase
        .from('adjudicators')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchData();
    } catch (error) {
      console.error('Error deleting adjudicator:', error);
    }
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', institution_id: '', strength: 5, email: '', phone: '' });
    setShowModal(true);
    setError('');
  };

  const handleShare = (adj: Adjudicator) => {
    const url = `${window.location.origin}/adjudicator/${adj.id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(adj.id);
    setTimeout(() => setCopiedId(null), 2000);
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

      const adjudicators = [];
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length !== headers.length) continue;
        
        const adjudicator: any = {};
        headers.forEach((header, index) => {
          adjudicator[header] = values[index] || null;
        });
        
        if (adjudicator.name) {
          // Find institution by name if provided
          if (adjudicator.institution) {
            const institution = institutions.find(inst => 
              inst.name.toLowerCase() === adjudicator.institution.toLowerCase()
            );
            adjudicator.institution_id = institution?.id || null;
            delete adjudicator.institution;
          }
          
          // Convert strength to number
          if (adjudicator.strength) {
            adjudicator.strength = parseFloat(adjudicator.strength);
          }
          
          adjudicators.push(adjudicator);
        }
      }

      if (adjudicators.length === 0) {
        throw new Error('No valid adjudicators found in CSV');
      }

      const { error } = await supabase
        .from('adjudicators')
        .insert(adjudicators);

      if (error) throw error;

      setShowImportModal(false);
      setImportData('');
      fetchData();
      alert(`Successfully imported ${adjudicators.length} adjudicators`);
    } catch (error: any) {
      setImportError(error.message);
    }
  };

  const handleExport = () => {
    const csv = adjudicators.map(adj => ({
      name: adj.name,
      institution: adj.institutions?.name || '',
      strength: adj.strength,
      email: adj.email || '',
      phone: adj.phone || ''
    }));

    const headers = Object.keys(csv[0]).join(',');
    const rows = csv.map(row => Object.values(row).join(','));
    const csvContent = [headers, ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'adjudicators.csv';
    a.click();
  };

  const filteredAdjudicators = adjudicators.filter(adj =>
    adj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adj.institutions?.name.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-slate-900">Adjudicators</h1>
          <p className="text-slate-600 mt-1">Manage tournament adjudicators</p>
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
              Add Adjudicator
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
              placeholder="Search adjudicators..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
            />
          </div>
        </div>

        {filteredAdjudicators.length === 0 ? (
          <div className="text-center py-12">
            <UserCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No adjudicators found</p>
          </div>
        ) : (
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
                  <th className="text-left px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Contact
                  </th>
                  {isAdmin && (
                    <th className="text-right px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredAdjudicators.map((adj) => (
                  <tr key={adj.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {adj.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {adj.institutions?.name || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                        {adj.strength}/10
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {adj.email || adj.phone || '-'}
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleShare(adj)}
                            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Copy URL"
                          >
                            {copiedId === adj.id ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => handleEdit(adj)}
                            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(adj.id)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {editingId ? 'Edit Adjudicator' : 'Add Adjudicator'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
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
                  Strength (1-10)
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  step="0.5"
                  value={formData.strength}
                  onChange={(e) => setFormData({ ...formData, strength: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
                />
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
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Import Adjudicators</h2>
            
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">CSV Format:</h3>
              <p className="text-sm text-blue-800 mb-2">Required columns: name, institution, strength, email (optional), phone (optional)</p>
              <p className="text-xs text-blue-700">Example:</p>
              <pre className="text-xs bg-white p-2 rounded border mt-1">
{`name,institution,strength,email,phone
Prof. Sarah Williams,Harvard University,9.5,sarah@harvard.edu,+1-617-555-0123
Dr. Michael Chen,Oxford University,9.0,michael@oxford.edu,+44-20-7946-0958`}
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
