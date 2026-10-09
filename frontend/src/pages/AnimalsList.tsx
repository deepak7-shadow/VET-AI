import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  ChevronRight, 
  Activity, 
  RefreshCw, 
  Sparkles,
  Plus,
  Eye,
  XCircle,
  Building,
  CheckCircle2,
  AlertTriangle,
  Layers
} from 'lucide-react';
import { api } from '../services/api';
import { Animal } from '../types';
import { AddAnimalModal } from '../components/animals/AddAnimalModal';
import { BulkAnimalModal } from '../components/animals/BulkAnimalModal';

interface AnimalsListProps {
  onSelectAnimal: (id: string) => void;
  onAnalyzeAnimal: (animalId: string) => void;
}

export const AnimalsList: React.FC<AnimalsListProps> = ({ onSelectAnimal, onAnalyzeAnimal }) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

  const fetchAnimals = async () => {
    try {
      setLoading(true);
      const res = await api.getAnimals(selectedSpecies, selectedStatus);
      setAnimals(res);
    } catch (err: any) {
      console.error('Failed to load animals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, [selectedSpecies, selectedStatus]);

  const filteredAnimals = animals.filter(a => {
    const q = search.toLowerCase();
    return (
      a.animal_id.toLowerCase().includes(q) ||
      a.species.toLowerCase().includes(q) ||
      (a.breed && a.breed.toLowerCase().includes(q)) ||
      (a.farm && a.farm.toLowerCase().includes(q))
    );
  });

  const clearFilters = () => {
    setSearch('');
    setSelectedSpecies('ALL');
    setSelectedStatus('ALL');
  };

  const getRiskBadge = (level: string = 'LOW', score: any = 0) => {
    const normalized = (level || 'LOW').toUpperCase();
    const numScore = parseFloat(score) || 0;
    if (normalized === 'CRITICAL') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#B91C1C]" />
          CRITICAL ({numScore.toFixed(0)})
        </span>
      );
    }
    if (normalized === 'HIGH') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C2410C]" />
          HIGH RISK ({numScore.toFixed(0)})
        </span>
      );
    }
    if (normalized === 'MODERATE') {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#FEF9C3] text-[#854D0E] border border-[#FEF08A]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#854D0E]" />
          MODERATE ({numScore.toFixed(0)})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#EAF7F0] text-[#16845B] border border-[#C4EBD5]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#16845B]" />
        HEALTHY ({numScore.toFixed(0)})
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Controls */}
      <div className="bg-white border border-[#E5EAF0] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">Livestock Directory</h2>
          <p className="text-xs text-[#667085] mt-1">
            Tracking {animals.length} registered livestock across automated health telemetry pens
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="px-4 py-2 border border-emerald-600/40 text-emerald-700 bg-emerald-50/60 hover:bg-emerald-100 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
          >
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Bulk / CSV Import</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-[#16845B] hover:bg-[#126b49] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Register Individual</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#E5EAF0] rounded-2xl p-4 shadow-xs flex flex-wrap items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input 
            type="text"
            placeholder="Search by tag, breed, farm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#172033] placeholder-slate-400 focus:outline-none focus:border-[#16845B] focus:bg-white transition-colors"
          />
        </div>

        {/* Species Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#667085]">Species:</label>
          <select
            value={selectedSpecies}
            onChange={(e) => setSelectedSpecies(e.target.value)}
            className="px-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#16845B]"
          >
            <option value="ALL">All Species</option>
            <option value="Cattle">Cattle</option>
            <option value="Buffalo">Buffalo</option>
            <option value="Goat">Goat</option>
            <option value="Sheep">Sheep</option>
          </select>
        </div>

        {/* Health Risk Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-[#667085]">Status:</label>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#16845B]"
          >
            <option value="ALL">All Statuses</option>
            <option value="Healthy">Healthy (Low Risk)</option>
            <option value="Monitoring">Monitoring (Moderate)</option>
            <option value="High Risk">High / Critical Risk</option>
          </select>
        </div>

        {/* Clear Filters */}
        {(search || selectedSpecies !== 'ALL' || selectedStatus !== 'ALL') && (
          <button
            onClick={clearFilters}
            className="text-xs text-[#667085] hover:text-[#172033] flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <XCircle className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Livestock Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#16845B] animate-spin" />
          <p className="text-xs text-[#667085]">Retrieving herd records from Supabase...</p>
        </div>
      ) : filteredAnimals.length === 0 ? (
        <div className="bg-white border border-[#E5EAF0] rounded-2xl p-12 text-center max-w-md mx-auto shadow-xs">
          <Activity className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-sm text-[#172033]">No Livestock Found</h3>
          <p className="text-xs text-[#667085] mt-1 mb-4">No animals match your selected filters.</p>
          <button
            onClick={clearFilters}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-[#172033] text-xs font-semibold rounded-lg"
          >
            Clear Search Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredAnimals.map((animal) => (
            <div
              key={animal.id}
              className="bg-white border border-[#E5EAF0] hover:border-slate-300 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Animal Image & Top Badges */}
                <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                  <img
                    src={animal.image_url || 'https://images.unsplash.com/photo-1546445317-29f4545e9d53'}
                    alt={animal.animal_id}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white font-mono font-bold text-xs tracking-wider">
                      {animal.animal_id}
                    </span>
                  </div>
                  <div className="absolute top-3 right-3">
                    {getRiskBadge(animal.current_risk_level, animal.current_risk_score)}
                  </div>
                </div>

                {/* Content details */}
                <div className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base text-[#172033]">
                        {animal.breed || animal.species}
                      </h3>
                      <p className="text-xs text-[#667085] flex items-center gap-1.5 mt-0.5">
                        <Building className="w-3.5 h-3.5 text-slate-400" />
                        <span>{animal.farm || 'Green Valley Dairy'}</span>
                      </p>
                    </div>
                    <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                      {animal.species}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E5EAF0] text-[11px] text-[#667085]">
                    <div>Age: <strong className="text-[#172033]">{animal.age || 2.0} yrs</strong></div>
                    <div>Gender: <strong className="text-[#172033]">{animal.gender || 'Female'}</strong></div>
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="p-4 pt-0 grid grid-cols-2 gap-2 border-t border-[#E5EAF0] mt-2">
                <button
                  onClick={() => onSelectAnimal(animal.animal_id)}
                  className="w-full py-2 px-3 bg-[#F7F9FC] hover:bg-slate-100 border border-[#E5EAF0] text-[#172033] text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Profile</span>
                </button>

                <button
                  onClick={() => onAnalyzeAnimal(animal.animal_id)}
                  className="w-full py-2 px-3 bg-[#16845B] hover:bg-[#126b49] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Analyze</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Animal Modal */}
      <AddAnimalModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAnimalAdded={(newAnimal) => {
          setAnimals(prev => [newAnimal, ...prev]);
        }}
      />

      {/* Bulk Animal Modal */}
      <BulkAnimalModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={(newAnimals) => {
          setAnimals(prev => [...newAnimals, ...prev]);
        }}
      />
    </div>
  );
};
