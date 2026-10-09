import React, { useState } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { Animal } from '../../types';
import { X, Plus, Sparkles, AlertCircle, CheckCircle2, Image } from 'lucide-react';

interface AddAnimalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnimalAdded: (newAnimal: Animal) => void;
}

const DEFAULT_LIVESTOCK_IMAGES = [
  { label: 'Holstein Dairy Cow', url: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=800&q=80' },
  { label: 'Black Angus Cattle', url: 'https://images.unsplash.com/photo-1596733430284-f7437764b14d?auto=format&fit=crop&w=800&q=80' },
  { label: 'Murrah Water Buffalo', url: 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=800&q=80' },
  { label: 'Nubian Dairy Goat', url: 'https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=800&q=80' },
  { label: 'Hereford Pastured Cow', url: 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=800&q=80' },
];

export const AddAnimalModal: React.FC<AddAnimalModalProps> = ({ isOpen, onClose, onAnimalAdded }) => {
  const { profile } = useAuth();
  const [animalId, setAnimalId] = useState('');
  const [species, setSpecies] = useState('Cattle');
  const [breed, setBreed] = useState('Holstein');
  const [age, setAge] = useState<number>(3.0);
  const [gender, setGender] = useState('Female');
  const [farm, setFarm] = useState(profile?.farm_name || 'Green Valley Dairy');
  const [imageUrl, setImageUrl] = useState(DEFAULT_LIVESTOCK_IMAGES[0].url);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanId = animalId.trim().toUpperCase();
    if (!cleanId) {
      setError('Please provide an Animal Identifier (e.g. COW-088).');
      return;
    }

    try {
      setLoading(true);
      const newAnimal = await api.createAnimal({
        animal_id: cleanId,
        species,
        breed,
        age: Number(age),
        gender,
        farm: farm || profile?.farm_name || 'My Farm',
        image_url: imageUrl,
        status: 'Healthy',
        current_risk_score: 12,
        current_risk_level: 'LOW'
      });
      onAnimalAdded(newAnimal);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to register livestock.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white border border-[#E5EAF0] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E5EAF0] bg-[#F7F9FC] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#172033]">Register New Livestock</h3>
            <p className="text-xs text-[#667085]">Add animal to herd biometric tracking and telemetry</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Animal Tag / Code *
              </label>
              <input
                type="text"
                required
                value={animalId}
                onChange={(e) => setAnimalId(e.target.value)}
                placeholder="e.g. COW-092"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] text-[#172033]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Species *
              </label>
              <select
                value={species}
                onChange={(e) => setSpecies(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] text-[#172033]"
              >
                <option value="Cattle">Cattle</option>
                <option value="Buffalo">Buffalo</option>
                <option value="Goat">Goat</option>
                <option value="Sheep">Sheep</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Breed
              </label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="Holstein"
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] text-[#172033]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Age (Years)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="25"
                value={age}
                onChange={(e) => setAge(parseFloat(e.target.value) || 1)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] text-[#172033]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Gender
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] text-[#172033]"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1">
              Farm Facility
            </label>
            <input
              type="text"
              value={farm}
              onChange={(e) => setFarm(e.target.value)}
              placeholder="Green Valley Dairy"
              className="w-full px-3 py-2 text-sm bg-white border border-[#E5EAF0] rounded-lg focus:outline-none focus:border-[#16845B] text-[#172033]"
            />
          </div>

          {/* Preset image selector */}
          <div>
            <label className="block text-xs font-semibold text-[#172033] mb-1.5 flex items-center justify-between">
              <span>Visual Image Preset</span>
              <span className="text-[10px] text-[#667085]">Used for Computer Vision Demeanor analysis</span>
            </label>
            <div className="grid grid-cols-5 gap-2">
              {DEFAULT_LIVESTOCK_IMAGES.map((img, i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setImageUrl(img.url)}
                  className={`relative rounded-lg overflow-hidden border-2 h-14 transition-all ${
                    imageUrl === img.url ? 'border-[#16845B] ring-2 ring-emerald-500/20' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  title={img.label}
                >
                  <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#E5EAF0] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#667085] hover:text-[#172033] hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-[#16845B] hover:bg-[#126b49] text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Registering...' : 'Save Livestock Record'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
