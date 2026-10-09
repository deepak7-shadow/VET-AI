import React, { useState, useRef } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Animal } from '../../types';
import { 
  X, 
  Upload, 
  Download, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Layers, 
  Table as TableIcon,
  RefreshCw
} from 'lucide-react';

interface BulkAnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAnimals: Animal[]) => void;
}

interface RowItem {
  id: string; // local temp key
  animal_id: string;
  species: string;
  breed: string;
  age: number;
  gender: string;
  herd_group: string;
  farm: string;
  notes: string;
  error?: string;
}

const SPECIES_OPTIONS = ['Cattle', 'Buffalo', 'Goat', 'Sheep'];
const DEFAULT_BREEDS: Record<string, string> = {
  Cattle: 'Holstein Friesian',
  Buffalo: 'Murrah',
  Goat: 'Boer',
  Sheep: 'Dorper'
};

const DEFAULT_IMAGES: Record<string, string> = {
  Cattle: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=800&q=80',
  Buffalo: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=800&q=80',
  Goat: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=800&q=80',
  Sheep: 'https://images.unsplash.com/photo-1484557052118-f32bd25b45b5?auto=format&fit=crop&w=800&q=80'
};

export const BulkAnimalModal: React.FC<BulkAnimalModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<'rows' | 'csv'>('rows');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Rows state
  const defaultFarm = profile?.farm_name || 'Green Valley Dairy';
  const [rows, setRows] = useState<RowItem[]>([
    { id: '1', animal_id: '', species: 'Cattle', breed: 'Holstein Friesian', age: 3, gender: 'Female', herd_group: 'Milking Herd A', farm: defaultFarm, notes: '' },
    { id: '2', animal_id: '', species: 'Cattle', breed: 'Holstein Friesian', age: 2.5, gender: 'Female', herd_group: 'Milking Herd A', farm: defaultFarm, notes: '' },
    { id: '3', animal_id: '', species: 'Cattle', breed: 'Jersey', age: 4, gender: 'Female', herd_group: 'Milking Herd A', farm: defaultFarm, notes: '' },
  ]);

  // CSV State
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const [parsedCsvRows, setParsedCsvRows] = useState<RowItem[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleAddRow = () => {
    const nextIdx = rows.length + 1;
    setRows(prev => [
      ...prev,
      {
        id: String(Date.now() + Math.random()),
        animal_id: '',
        species: prev[prev.length - 1]?.species || 'Cattle',
        breed: prev[prev.length - 1]?.breed || 'Holstein Friesian',
        age: 3,
        gender: 'Female',
        herd_group: prev[prev.length - 1]?.herd_group || 'Milking Herd A',
        farm: defaultFarm,
        notes: ''
      }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (rows.length <= 1) return;
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const handleRowChange = (id: string, field: keyof RowItem, value: any) => {
    setRows(prev => prev.map(r => {
      if (r.id !== id) return r;
      const updated = { ...r, [field]: value };
      if (field === 'species' && !r.breed) {
        updated.breed = DEFAULT_BREEDS[value] || 'Standard';
      }
      return updated;
    }));
  };

  // Download CSV template
  const handleDownloadTemplate = () => {
    const headers = ['animal_id', 'species', 'breed', 'age', 'gender', 'herd_group', 'farm', 'notes'];
    const sampleRows = [
      ['COW-201', 'Cattle', 'Holstein Friesian', '3.5', 'Female', 'Milking Herd A', defaultFarm, 'High producer'],
      ['BUF-105', 'Buffalo', 'Murrah', '4.0', 'Female', 'Pen 2 Buffalo', defaultFarm, 'Prime lactation'],
      ['GOAT-042', 'Goat', 'Boer', '2.0', 'Female', 'Goat Pasture 1', defaultFarm, 'Vaccinated spring'],
      ['SHP-018', 'Sheep', 'Dorper', '1.5', 'Male', 'Ram Pen', defaultFarm, 'Breeder stock']
    ];
    const csvContent = [headers.join(','), ...sampleRows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vet_ai_herd_import_template.csv';
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Parse CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setError(null);
    setCsvErrors([]);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) throw new Error('File is empty');

        const lines = text.split(/\r\n|\n/).filter(l => l.trim().length > 0);
        if (lines.length < 2) throw new Error('CSV must contain a header row and at least one animal record.');

        const headerLine = lines[0].toLowerCase();
        const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
        
        const idIdx = headers.indexOf('animal_id');
        const speciesIdx = headers.indexOf('species');
        const breedIdx = headers.indexOf('breed');
        const ageIdx = headers.indexOf('age');
        const genderIdx = headers.indexOf('gender');
        const herdGroupIdx = headers.indexOf('herd_group');
        const farmIdx = headers.indexOf('farm');
        const notesIdx = headers.indexOf('notes');

        if (idIdx === -1 || speciesIdx === -1) {
          throw new Error('CSV is missing required headers: "animal_id" and "species".');
        }

        const parsed: RowItem[] = [];
        const errors: string[] = [];
        const seenIds = new Set<string>();

        for (let i = 1; i < lines.length; i++) {
          const rowNum = i + 1;
          const rawRow = lines[i];
          // simple split handling quotes
          const cols = rawRow.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
          
          const rawId = cols[idIdx]?.trim().toUpperCase();
          if (!rawId) {
            errors.push(`Row ${rowNum}: Missing Animal ID`);
            continue;
          }

          if (seenIds.has(rawId)) {
            errors.push(`Row ${rowNum}: Duplicate Animal ID "${rawId}" found within file`);
            continue;
          }
          seenIds.add(rawId);

          const rawSpecies = cols[speciesIdx]?.trim() || 'Cattle';
          const validSpecies = SPECIES_OPTIONS.find(s => s.toLowerCase() === rawSpecies.toLowerCase()) || 'Cattle';
          const rawAge = parseFloat(cols[ageIdx] || '3.0') || 3.0;

          parsed.push({
            id: String(Date.now() + i),
            animal_id: rawId,
            species: validSpecies,
            breed: (breedIdx !== -1 && cols[breedIdx]) ? cols[breedIdx].trim() : DEFAULT_BREEDS[validSpecies] || 'Standard',
            age: Math.max(0.1, rawAge),
            gender: (genderIdx !== -1 && cols[genderIdx]?.trim().toLowerCase().startsWith('m')) ? 'Male' : 'Female',
            herd_group: (herdGroupIdx !== -1 && cols[herdGroupIdx]) ? cols[herdGroupIdx].trim() : 'General Herd',
            farm: (farmIdx !== -1 && cols[farmIdx]) ? cols[farmIdx].trim() : defaultFarm,
            notes: (notesIdx !== -1 && cols[notesIdx]) ? cols[notesIdx].trim() : ''
          });
        }

        if (parsed.length === 0) {
          throw new Error('No valid animal entries could be parsed from the file.');
        }

        setParsedCsvRows(parsed);
        setCsvErrors(errors);
      } catch (err: any) {
        setError(err.message || 'Failed to parse CSV file');
        setParsedCsvRows([]);
      }
    };
    reader.readAsText(file);
  };

  const handleBulkSubmit = async () => {
    setError(null);
    setSuccessMessage(null);

    const itemsToSubmit = mode === 'rows' ? rows : parsedCsvRows;

    // Validate
    const payloadAnimals: Partial<Animal>[] = [];
    const seenIds = new Set<string>();

    for (let i = 0; i < itemsToSubmit.length; i++) {
      const item = itemsToSubmit[i];
      const cleanId = item.animal_id.trim().toUpperCase();
      if (!cleanId) {
        setError(`Row #${i + 1} is missing an Animal Identifier.`);
        return;
      }
      if (seenIds.has(cleanId)) {
        setError(`Duplicate Identifier "${cleanId}" in registration list.`);
        return;
      }
      seenIds.add(cleanId);

      payloadAnimals.push({
        animal_id: cleanId,
        species: item.species,
        breed: item.breed || 'Standard',
        age: Number(item.age) || 3.0,
        gender: item.gender || 'Female',
        farm: item.farm || defaultFarm,
        herd_group: item.herd_group || 'General Herd',
        notes: item.notes || '',
        image_url: DEFAULT_IMAGES[item.species] || DEFAULT_IMAGES['Cattle'],
        status: 'Healthy',
        current_risk_score: 10,
        current_risk_level: 'LOW'
      });
    }

    if (payloadAnimals.length === 0) {
      setError('Please add at least one livestock animal.');
      return;
    }

    try {
      setLoading(true);
      const res = await api.bulkCreateAnimals(payloadAnimals);
      setSuccessMessage(`Successfully registered ${res.created_count} livestock animals!`);
      setTimeout(() => {
        onSuccess(res.animals);
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Failed to bulk register animals');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Bulk Livestock Registration</h2>
              <p className="text-xs text-slate-500">Register multiple animals via multi-row table or CSV import</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-100 flex items-center justify-between">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => { setMode('rows'); setError(null); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                mode === 'rows'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              <span>Multi-Row Entry ({rows.length})</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('csv'); setError(null); }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                mode === 'csv'
                  ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>CSV Spreadsheet Upload {parsedCsvRows.length > 0 && `(${parsedCsvRows.length})`}</span>
            </button>
          </div>

          {mode === 'csv' && (
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Template</span>
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-start space-x-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
              <div>{error}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center space-x-2.5">
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
              <div>{successMessage}</div>
            </div>
          )}

          {mode === 'rows' ? (
            <div className="space-y-3">
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Tag / ID *</th>
                      <th className="py-2.5 px-3">Species</th>
                      <th className="py-2.5 px-3">Breed</th>
                      <th className="py-2.5 px-3 w-16">Age</th>
                      <th className="py-2.5 px-3">Gender</th>
                      <th className="py-2.5 px-3">Herd Group</th>
                      <th className="py-2.5 px-3">Notes</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {rows.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder={`e.g. COW-${100 + idx}`}
                            value={row.animal_id}
                            onChange={(e) => handleRowChange(row.id, 'animal_id', e.target.value.toUpperCase())}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.species}
                            onChange={(e) => handleRowChange(row.id, 'species', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            {SPECIES_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            value={row.breed}
                            onChange={(e) => handleRowChange(row.id, 'breed', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.5"
                            min="0.1"
                            value={row.age}
                            onChange={(e) => handleRowChange(row.id, 'age', parseFloat(e.target.value) || 1)}
                            className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-2">
                          <select
                            value={row.gender}
                            onChange={(e) => handleRowChange(row.id, 'gender', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          >
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                          </select>
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="e.g. Milking A"
                            value={row.herd_group}
                            onChange={(e) => handleRowChange(row.id, 'herd_group', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            placeholder="Optional notes"
                            value={row.notes}
                            onChange={(e) => handleRowChange(row.id, 'notes', e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveRow(row.id)}
                            disabled={rows.length <= 1}
                            className={`p-1.5 rounded-lg transition-colors ${
                              rows.length <= 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-1">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-xl font-semibold transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Another Animal Row</span>
                </button>
                <div className="text-xs text-slate-500 font-medium">
                  Total animals ready to register: <span className="font-bold text-slate-800">{rows.length}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* CSV Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-emerald-50/20 transition-all group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform">
                  <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-slate-700 mb-1">
                  {csvFileName ? `File selected: ${csvFileName}` : 'Click or drag CSV spreadsheet here'}
                </h3>
                <p className="text-xs text-slate-400">
                  Supports standard CSV containing tags, species, age, and herd groups
                </p>
              </div>

              {csvErrors.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs space-y-1">
                  <div className="font-semibold flex items-center space-x-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>CSV Warning: {csvErrors.length} entries skipped</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 max-h-24 overflow-y-auto">
                    {csvErrors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              {/* Parsed Preview */}
              {parsedCsvRows.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Parsed Animals Preview ({parsedCsvRows.length})</span>
                    <span className="text-emerald-600 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ready for bulk import</span>
                    </span>
                  </div>
                  <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 uppercase font-bold sticky top-0 border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Tag / ID</th>
                          <th className="py-2 px-3">Species</th>
                          <th className="py-2 px-3">Breed</th>
                          <th className="py-2 px-3">Age</th>
                          <th className="py-2 px-3">Gender</th>
                          <th className="py-2 px-3">Herd Group</th>
                          <th className="py-2 px-3">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {parsedCsvRows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="py-1.5 px-3 font-semibold text-slate-800">{r.animal_id}</td>
                            <td className="py-1.5 px-3">{r.species}</td>
                            <td className="py-1.5 px-3 text-slate-600">{r.breed}</td>
                            <td className="py-1.5 px-3">{r.age} yrs</td>
                            <td className="py-1.5 px-3">{r.gender}</td>
                            <td className="py-1.5 px-3 font-medium text-emerald-700">{r.herd_group}</td>
                            <td className="py-1.5 px-3 text-slate-400 truncate max-w-xs">{r.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleBulkSubmit}
            disabled={loading || (mode === 'csv' && parsedCsvRows.length === 0)}
            className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Registering Animals...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Register {mode === 'rows' ? rows.length : parsedCsvRows.length} Animals</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
