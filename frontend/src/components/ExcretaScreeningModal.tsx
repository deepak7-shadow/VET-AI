import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Upload, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Sparkles, 
  Loader2, 
  Activity, 
  FileText, 
  ChevronRight,
  Info,
  RefreshCw,
  Droplet
} from 'lucide-react';
import { api } from '../services/api';
import { Animal, MultiAgentAnalysisResult } from '../types';

interface ExcretaScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedAnimalId?: string;
  onAnalysisSuccess?: (animalId: string, result: MultiAgentAnalysisResult) => void;
  onNavigateToAnimal?: (animalId: string) => void;
}

// Prototype sample images from clinical test set
const CLINICAL_PRESETS = [
  {
    id: 'coccidiosis_bloody',
    name: 'Coccidiosis (Bloody Stool)',
    sampleType: 'manure_closeup',
    icon: '💩',
    description: 'Hemorrhagic diarrhea with blood clots & dark red flecks',
    imageUrl: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53',
    suggestedNotes: 'Severe bloody diarrhea, weak calf, tenesmus'
  },
  {
    id: 'salmonellosis_watery',
    name: 'Salmonellosis (Watery Scour)',
    sampleType: 'manure_closeup',
    icon: '💩',
    description: 'Profuse watery scour, foul odor, yellowish-green fibrin casts',
    imageUrl: 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e',
    suggestedNotes: 'Foul-smelling yellowish watery diarrhea, acute pyrexia'
  },
  {
    id: 'leptospirosis_urine',
    name: 'Leptospirosis (Dark Red Urine)',
    sampleType: 'urine_sample',
    icon: '🧪',
    description: 'Port-wine / reddish-brown hemoglobinuria discoloration',
    imageUrl: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9',
    suggestedNotes: 'Port-wine colored red urine, jaundice, drop in milk yield'
  },
  {
    id: 'uti_cloudy_urine',
    name: 'UTI / Kidney (Turbid Urine)',
    sampleType: 'urine_sample',
    icon: '🧪',
    description: 'Cloudy, purulent sediment, painful urination posturing',
    imageUrl: 'https://images.unsplash.com/photo-1596733430284-f7437764b1a9',
    suggestedNotes: 'Turbid cloudy urine, frequent arched-back urination posturing'
  },
  {
    id: 'healthy_manure',
    name: 'Healthy Normal Manure',
    sampleType: 'manure_closeup',
    icon: '🌿',
    description: 'Well-formed brown/greenish consistency without blood or mucus',
    imageUrl: 'https://images.unsplash.com/photo-1546445317-29f4545e9d53',
    suggestedNotes: 'Normal manure consistency, standard rumination observed'
  }
];

export const ExcretaScreeningModal: React.FC<ExcretaScreeningModalProps> = ({
  isOpen,
  onClose,
  preselectedAnimalId,
  onAnalysisSuccess,
  onNavigateToAnimal
}) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(preselectedAnimalId || 'COW-027');
  const [sampleType, setSampleType] = useState<'manure_closeup' | 'urine_sample'>('manure_closeup');
  const [imageUrl, setImageUrl] = useState<string>('https://images.unsplash.com/photo-1546445317-29f4545e9d53');
  const [previewName, setPreviewName] = useState<string>('Standard Clinical Reference');
  const [behaviorNotes, setBehaviorNotes] = useState<string>('');
  const [uploading, setUploading] = useState<boolean>(false);
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<MultiAgentAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      api.getAnimals()
        .then(list => {
          setAnimals(list);
          if (!preselectedAnimalId && list.length > 0) {
            setSelectedAnimalId(list[0].animal_id);
          }
        })
        .catch(err => console.warn('Could not fetch animals list for modal', err));
      
      if (preselectedAnimalId) {
        setSelectedAnimalId(preselectedAnimalId);
      }
    }
  }, [isOpen, preselectedAnimalId]);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      // Upload via backend API
      const res = await api.uploadImage(file);
      setImageUrl(res.url);
      setPreviewName(file.name);
    } catch (err: any) {
      // Fallback: create local object URL / base64
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
        setPreviewName(file.name);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploading(false);
    }
  };

  const selectPreset = (preset: typeof CLINICAL_PRESETS[0]) => {
    setSampleType(preset.sampleType as any);
    setImageUrl(preset.imageUrl);
    setPreviewName(preset.name);
    setBehaviorNotes(preset.suggestedNotes);
  };

  const handleRunScreening = async () => {
    if (!selectedAnimalId) {
      setError('Please select an animal from your herd');
      return;
    }
    if (!imageUrl) {
      setError('Please provide or capture a sample image');
      return;
    }

    try {
      setAnalyzing(true);
      setError(null);
      
      const analysisResult = await api.runExcretaAgentAnalysis({
        animal_id: selectedAnimalId,
        image_url: imageUrl,
        sample_type: sampleType,
        behavior_notes: behaviorNotes
      });

      setResult(analysisResult);
      if (onAnalysisSuccess) {
        onAnalysisSuccess(selectedAnimalId, analysisResult);
      }
    } catch (err: any) {
      setError(err.message || 'Excreta multi-agent screening failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const selectedAnimal = animals.find(a => a.animal_id === selectedAnimalId);
  const excretaData = (result?.vision as any)?.excreta_screening;
  const triageReport = excretaData?.veterinary_triage_report;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white border border-[#E5EAF0] rounded-2xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-[#E5EAF0] flex items-center justify-between bg-linear-to-r from-emerald-50/60 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EAF7F0] text-[#16845B] border border-[#C4EBD5] flex items-center justify-center font-bold text-lg shadow-xs">
              💩
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-[#172033]">
                  Field Manure & Urine Screening
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#16845B] text-white">
                  YOLO26 Visual AI
                </span>
              </div>
              <p className="text-xs text-[#667085]">
                Screen manure or urine photos for Coccidiosis, Salmonellosis, BVD, Leptospirosis, & UTI/Kidney infection
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            <>
              {/* 1. Animal Selection */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  1. Select Target Livestock Animal
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <select
                    value={selectedAnimalId}
                    onChange={(e) => setSelectedAnimalId(e.target.value)}
                    className="w-full text-xs font-medium border border-[#E5EAF0] rounded-xl px-3 py-2.5 bg-white text-[#172033] focus:outline-hidden focus:border-[#16845B]"
                  >
                    {animals.map((a) => (
                      <option key={a.id || a.animal_id} value={a.animal_id}>
                        {a.animal_id} — {a.breed || a.species} ({a.farm || 'Herd'})
                      </option>
                    ))}
                  </select>

                  {selectedAnimal && (
                    <div className="p-2.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-xs flex items-center justify-between">
                      <span className="font-semibold text-[#172033]">{selectedAnimal.animal_id}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedAnimal.current_risk_level === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        selectedAnimal.current_risk_level === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        Current: {selectedAnimal.current_risk_level || 'LOW'} ({selectedAnimal.current_risk_score || 0})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 2. Sample Category Selection */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  2. Choose Sample Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setSampleType('manure_closeup')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      sampleType === 'manure_closeup'
                        ? 'border-[#16845B] bg-[#EAF7F0]/40 ring-2 ring-[#16845B]/20'
                        : 'border-[#E5EAF0] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">💩</span>
                      <span className="font-bold text-xs text-[#172033]">Manure / Stool ("Poop")</span>
                    </div>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      Screens for Coccidiosis, Salmonellosis, BVD, & general digestive scours.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSampleType('urine_sample')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      sampleType === 'urine_sample'
                        ? 'border-[#16845B] bg-[#EAF7F0]/40 ring-2 ring-[#16845B]/20'
                        : 'border-[#E5EAF0] hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">🧪</span>
                      <span className="font-bold text-xs text-[#172033]">Urine Sample</span>
                    </div>
                    <p className="text-[11px] text-[#667085] leading-relaxed">
                      Screens for Leptospirosis (red/port-wine), UTI, Kidney infection, & hematuria.
                    </p>
                  </button>
                </div>
              </div>

              {/* 3. Image Upload or Preset Selection */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  3. Field Photo of Excreta
                </label>
                
                {/* File Dropzone */}
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#CBD5E1] hover:border-[#16845B] rounded-2xl p-5 text-center cursor-pointer bg-[#F8FAFC] hover:bg-emerald-50/20 transition-all group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  {uploading ? (
                    <div className="flex flex-col items-center gap-2 py-4">
                      <Loader2 className="w-8 h-8 text-[#16845B] animate-spin" />
                      <p className="text-xs text-[#667085] font-medium">Uploading field photograph...</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 py-2">
                      <div className="w-10 h-10 rounded-full bg-white shadow-xs border border-[#E2E8F0] flex items-center justify-center text-[#16845B] group-hover:scale-105 transition-transform">
                        <Camera className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-[#172033]">
                        Click to take photo or upload image
                      </p>
                      <p className="text-[11px] text-[#667085]">
                        Selected: <span className="font-semibold text-[#16845B]">{previewName}</span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Preset sample buttons for instant testing */}
                <div className="mt-3">
                  <span className="text-[11px] font-semibold text-[#667085] mb-1.5 block">
                    Or select a clinical test preset to try immediately:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {CLINICAL_PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => selectPreset(p)}
                        className={`text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                          previewName === p.name
                            ? 'bg-[#16845B] text-white border-[#16845B] shadow-xs'
                            : 'bg-white border-[#E5EAF0] text-[#172033] hover:bg-slate-50'
                        }`}
                      >
                        <span>{p.icon}</span>
                        <span>{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. Farmer Field Observations (Optional) */}
              <div>
                <label className="block text-xs font-bold text-[#172033] mb-1.5">
                  4. Farmer Field Observations (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Bloody flecks / dark red',
                    'Foul odor & watery scour',
                    'Port-wine red urine',
                    'Cloudy urine sediment',
                    'Straining when defecating/urinating',
                    'Normal consistency'
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setBehaviorNotes(prev => prev ? `${prev}, ${chip}` : chip)}
                      className="text-[10px] font-medium px-2.5 py-1 rounded-md bg-[#F1F5F9] hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={behaviorNotes}
                  onChange={(e) => setBehaviorNotes(e.target.value)}
                  placeholder="e.g. Calf observed straining, watery dark red stool noticed during morning inspection"
                  className="w-full text-xs font-medium border border-[#E5EAF0] rounded-xl p-3 bg-white text-[#172033] focus:outline-hidden focus:border-[#16845B]"
                />
              </div>
            </>
          ) : (
            /* Analysis Results Screen */
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Risk Banner */}
              <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                result.risk?.risk_level === 'CRITICAL' ? 'bg-red-50/70 border-red-200' :
                result.risk?.risk_level === 'HIGH' ? 'bg-orange-50/70 border-orange-200' :
                result.risk?.risk_level === 'MODERATE' ? 'bg-amber-50/70 border-amber-200' :
                'bg-emerald-50/70 border-emerald-200'
              }`}>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl">
                      {result.risk?.risk_level === 'CRITICAL' || result.risk?.risk_level === 'HIGH' ? '🚨' : '✅'}
                    </span>
                    <h4 className="font-bold text-sm text-[#172033]">
                      Multi-Agent Screening Completed for {selectedAnimalId}
                    </h4>
                  </div>
                  <p className="text-xs text-[#667085] mt-1">
                    Vision Agent, YOLO26 Disease Classifier, Risk Agent, and Report Agent analyzed the sample.
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-3xl font-extrabold text-[#172033]">
                    {result.risk?.risk_score?.toFixed(0)} <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mt-1 ${
                    result.risk?.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    result.risk?.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    result.risk?.risk_level === 'MODERATE' ? 'bg-amber-100 text-amber-800' :
                    'bg-emerald-100 text-emerald-800'
                  }`}>
                    {result.risk?.risk_level} RISK
                  </span>
                </div>
              </div>

              {/* YOLO26 Classifier Findings */}
              {excretaData && (
                <div className="p-4 bg-white border border-[#E5EAF0] rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#16845B]" />
                      <h5 className="font-bold text-xs text-[#172033]">
                        YOLO26 Visual Screening Diagnosis Probability
                      </h5>
                    </div>
                    <span className="text-[10px] font-mono text-[#667085]">
                      Model: {excretaData.model || 'YOLO26-Cattle-Triage'}
                    </span>
                  </div>

                  <div className="p-3 bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-[#667085] uppercase tracking-wider block">
                        Top Visual Indication
                      </span>
                      <span className="text-base font-bold text-[#172033]">
                        {excretaData.top_indication}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold text-[#16845B]">
                        {excretaData.top_probability}%
                      </span>
                      <span className="text-[10px] text-[#667085] block">Confidence Likelihood</span>
                    </div>
                  </div>

                  {/* 7-Class Distribution Progress Bars */}
                  {excretaData.class_probabilities && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-semibold text-[#667085] block">
                        7-Class Visual Probability Spectrum:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(excretaData.class_probabilities).map(([cName, prob]: any) => (
                          <div key={cName} className="p-2 bg-[#F8FAFC] rounded-lg border border-[#F1F5F9] text-xs">
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-medium text-[#172033] text-[11px] truncate max-w-[170px]">{cName}</span>
                              <span className="font-bold text-[#16845B] text-[11px]">{prob}%</span>
                            </div>
                            <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#16845B] rounded-full transition-all duration-500" 
                                style={{ width: `${Math.min(100, prob)}%` }} 
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Mandatory Confirmatory Tests */}
                  {triageReport?.recommended_confirmatory_diagnostics && (
                    <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                        <span>Mandatory Confirmatory Laboratory Tests:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-800">
                        {triageReport.recommended_confirmatory_diagnostics.map((test: string, idx: number) => (
                          <li key={idx}>{test}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Multi-Agent Factor Synthesis */}
              {result.risk?.factors && (
                <div className="p-4 bg-white border border-[#E5EAF0] rounded-2xl shadow-xs space-y-2">
                  <h5 className="font-bold text-xs text-[#172033] flex items-center gap-2">
                    <Activity className="w-4 h-4 text-[#16845B]" />
                    Multi-Agent Contributing Risk Factors
                  </h5>
                  <div className="space-y-1.5">
                    {result.risk.factors.map((f: any, i: number) => (
                      <div key={i} className="p-2.5 bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-[#172033]">{f.name}</span>
                          <p className="text-[11px] text-[#667085]">{f.detail}</p>
                        </div>
                        <span className="font-mono font-bold text-xs text-[#16845B] bg-[#EAF7F0] px-2 py-0.5 rounded-md">
                          {f.weight}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Regulatory Veterinary Disclaimer */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-[11px] text-slate-600">
                <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p>
                  <strong>Veterinary Clinical Safety Advisory:</strong> Visual inspection of manure or urine alone cannot definitively diagnose diseases like coccidiosis, salmonellosis, and BVD. Laboratory confirmation via PCR, culture, or ELISA is strictly required before prescribing medical treatment.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-[#E5EAF0] bg-[#F7F9FC] flex items-center justify-between">
          {!result ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#E5EAF0] hover:bg-slate-100 text-[#667085] text-xs font-semibold rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={analyzing || uploading}
                onClick={handleRunScreening}
                className="px-5 py-2.5 bg-[#16845B] hover:bg-[#126b49] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs disabled:opacity-60"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Multi-Agent Pipeline Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Run Multi-Agent Visual Screening</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setResult(null);
                  setError(null);
                }}
                className="px-4 py-2 border border-[#E5EAF0] bg-white hover:bg-slate-50 text-[#172033] text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Screen Another Sample</span>
              </button>

              <div className="flex items-center gap-2">
                {onNavigateToAnimal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onNavigateToAnimal(selectedAnimalId);
                    }}
                    className="px-4 py-2 bg-white border border-[#16845B] text-[#16845B] hover:bg-emerald-50 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <span>View Animal Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-[#16845B] hover:bg-[#126b49] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                >
                  Done
                </button>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
