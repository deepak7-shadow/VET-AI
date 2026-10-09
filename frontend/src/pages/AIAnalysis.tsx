import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Upload, 
  Activity, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  BookOpen, 
  FileText, 
  HelpCircle, 
  Camera, 
  Layers, 
  Loader2, 
  Download,
  Thermometer,
  Utensils,
  Footprints,
  Cpu,
  ArrowRight,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import { Animal, MultiAgentAnalysisResult } from '../types';

interface AIAnalysisProps {
  initialAnimalId?: string;
  onAnalysisComplete?: (res: MultiAgentAnalysisResult) => void;
}

export const AIAnalysis: React.FC<AIAnalysisProps> = ({ 
  initialAnimalId = 'COW-027', 
  onAnalysisComplete 
}) => {
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [selectedAnimalId, setSelectedAnimalId] = useState(initialAnimalId);
  
  // Telemetry Input Fields
  const [temperature, setTemperature] = useState<number>(38.5);
  const [feeding, setFeeding] = useState<number>(100);
  const [activity, setActivity] = useState<number>(100);
  const [behaviorNotes, setBehaviorNotes] = useState<string>('Normal standing posture, ruminating calmly');
  const [observationSource, setObservationSource] = useState<'MANUAL' | 'IOT' | 'DEMO'>('MANUAL');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Execution States
  const [analyzing, setAnalyzing] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [result, setResult] = useState<MultiAgentAnalysisResult | null>(null);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Analysis Mode Switcher
  const [analysisMode, setAnalysisMode] = useState<'MULTIMODAL' | 'YOLO26'>('MULTIMODAL');

  // YOLO26 Classifier State
  const [yoloSampleType, setYoloSampleType] = useState<string>('manure_closeup');
  const [yoloSelectedClass, setYoloSelectedClass] = useState<string>('coccidiosis');
  const [yoloAnalyzing, setYoloAnalyzing] = useState(false);
  const [yoloResult, setYoloResult] = useState<any>(null);

  const handleRunYoloScreening = async () => {
    try {
      setYoloAnalyzing(true);
      setError(null);
      const samplePath = `ml/data/test/${yoloSelectedClass}/IMG-${yoloSelectedClass.slice(0,3).toUpperCase()}-00040.jpg`;
      const res = await api.yoloScreenImage({
        image_url: imagePreview && !imagePreview.startsWith('data:') && !imagePreview.startsWith('blob:') ? imagePreview : samplePath,
        sample_type: yoloSampleType,
        animal_id: selectedAnimalId,
        farm_id: animals.find(a => a.animal_id === selectedAnimalId)?.farm || 'FARM-VALLEY-01'
      });
      setYoloResult(res);
    } catch (err: any) {
      setError(err.message || 'YOLO screening failed');
    } finally {
      setYoloAnalyzing(false);
    }
  };

  useEffect(() => {
    api.getAnimals().then(res => {
      setAnimals(res);
      const found = res.find(a => a.animal_id === selectedAnimalId);
      if (found && found.image_url) {
        setImagePreview(found.image_url);
      }
    }).catch(console.error);
  }, []);

  const handleAnimalSelect = (id: string) => {
    setSelectedAnimalId(id);
    const found = animals.find(a => a.animal_id === id);
    if (found) {
      if (found.image_url) setImagePreview(found.image_url);
      if (found.animal_id === 'COW-027') {
        setTemperature(38.5);
        setFeeding(100);
        setActivity(100);
        setBehaviorNotes('Normal standing posture, ruminating calmly');
        setObservationSource('MANUAL');
      } else if (found.animal_id === 'COW-052') {
        setTemperature(40.2);
        setFeeding(60);
        setActivity(54);
        setBehaviorNotes('High fever, nasal discharge, head drooping');
        setObservationSource('IOT');
      }
    }
  };

  const handleApplyPreset = () => {
    setTemperature(40.1);
    setFeeding(65);
    setActivity(58);
    setBehaviorNotes('Acute lethargy, bilateral ear drooping, isolated from herd bunk, refusing grain');
    setObservationSource('MANUAL');
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      try {
        const uploadRes = await api.uploadImage(file);
        if (uploadRes.url) {
          setImagePreview(uploadRes.url);
        }
      } catch (err) {
        console.warn('Local preview used; upload error:', err);
      }
    }
  };

  const handleRunAnalysis = async () => {
    try {
      setAnalyzing(true);
      setError(null);

      const payload = {
        animal_id: selectedAnimalId,
        temperature: Number(temperature),
        feeding_percentage: Number(feeding),
        activity_percentage: Number(activity),
        behavior_notes: behaviorNotes,
        image_url: imagePreview || undefined
      };

      const analysisRes = await api.runFullAnalysis(payload);
      setResult(analysisRes);
      if (onAnalysisComplete) {
        onAnalysisComplete(analysisRes);
      }
    } catch (err: any) {
      setError(err?.message || 'Multi-agent analysis failed. Please verify input data.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!result || !result.report) return;
    try {
      setDownloadingPdf(true);
      await api.downloadReportPdf(result.report.report_id, result.animal.animal_id);
    } catch (err: any) {
      alert(`PDF download failed: ${err.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-[#E5EAF0] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">AI Health Analysis Console</h2>
            <span className="text-[11px] font-semibold bg-[#EAF7F0] text-[#16845B] border border-[#C4EBD5] px-2.5 py-0.5 rounded-full">
              Multi-Agent Engine
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1 max-w-2xl">
            Synthesizes physical computer vision, thermal sensors, rumination deviations, and authoritative veterinary guidelines into explainable risk scores.
          </p>
        </div>

        <button
          onClick={handleApplyPreset}
          className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors self-start md:self-auto shadow-xs"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Apply Acute Fever Preset (COW-027)</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Mode Navigation Tabs */}
      <div className="flex border-b border-[#E5EAF0] gap-4 mb-2">
        <button
          onClick={() => setAnalysisMode('MULTIMODAL')}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
            analysisMode === 'MULTIMODAL'
              ? 'border-[#16845B] text-[#16845B]'
              : 'border-transparent text-[#667085] hover:text-[#172033]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Multimodal Agent Pipeline (Vision + Sensors + RAG)</span>
        </button>
        <button
          onClick={() => setAnalysisMode('YOLO26')}
          className={`pb-3 text-sm font-semibold transition-colors flex items-center gap-2 border-b-2 ${
            analysisMode === 'YOLO26'
              ? 'border-[#16845B] text-[#16845B]'
              : 'border-transparent text-[#667085] hover:text-[#172033]'
          }`}
        >
          <Cpu className="w-4 h-4 text-emerald-600" />
          <span>YOLO26 Disease Risk Triage (5 Target Diseases + Controls)</span>
        </button>
      </div>

      {analysisMode === 'MULTIMODAL' ? (
        /* Main Analysis Layout: Inputs Left, Pipeline/Results Right */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multimodal Inputs (5 Cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#16845B]" />
              <span>1. Livestock Subject & Visuals</span>
            </h3>

            {/* Animal Selection */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Monitored Animal Identifier
              </label>
              {animals.length > 0 ? (
                <select
                  value={selectedAnimalId}
                  onChange={(e) => handleAnimalSelect(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#16845B] focus:bg-white"
                >
                  {animals.map(a => (
                    <option key={a.id} value={a.animal_id}>
                      {a.animal_id} — {a.breed || a.species} ({a.farm || 'Herd'})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="Enter Animal ID (e.g. COW-001)"
                  value={selectedAnimalId}
                  onChange={(e) => setSelectedAnimalId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#16845B] focus:bg-white"
                />
              )}
            </div>

            {/* Image Preview & Upload */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Subject Visual (Computer Vision)
              </label>
              <div className="relative h-44 rounded-xl overflow-hidden border border-[#E5EAF0] bg-slate-50 group">
                {imagePreview ? (
                  <img src={imagePreview} alt="Animal Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <Camera className="w-8 h-8 mb-1" />
                    <span className="text-xs">No image provided</span>
                  </div>
                )}
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white cursor-pointer">
                  <Upload className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">Upload New Photo</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
              </div>
            </div>

            {/* Source of Telemetry */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Telemetry Channel Source
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setObservationSource('MANUAL')}
                  className={`py-1.5 px-2 rounded-lg border text-center font-medium transition-colors ${
                    observationSource === 'MANUAL' ? 'bg-[#EAF7F0] border-[#C4EBD5] text-[#16845B]' : 'bg-[#F7F9FC] border-[#E5EAF0] text-[#667085]'
                  }`}
                >
                  Manual Field
                </button>
                <button
                  type="button"
                  onClick={() => setObservationSource('IOT')}
                  className={`py-1.5 px-2 rounded-lg border text-center font-medium transition-colors ${
                    observationSource === 'IOT' ? 'bg-[#EFF6FF] border-[#BFDBFE] text-[#1D4ED8]' : 'bg-[#F7F9FC] border-[#E5EAF0] text-[#667085]'
                  }`}
                >
                  IoT Collar
                </button>
                <button
                  type="button"
                  onClick={() => setObservationSource('DEMO')}
                  className={`py-1.5 px-2 rounded-lg border text-center font-medium transition-colors ${
                    observationSource === 'DEMO' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-[#F7F9FC] border-[#E5EAF0] text-[#667085]'
                  }`}
                >
                  Simulation
                </button>
              </div>
            </div>
          </div>

          {/* Vitals & Telemetry Sliders */}
          <div className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#16845B]" />
              <span>2. Biometrics & Sensor Vitals</span>
            </h3>

            {/* Temperature Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#172033] flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-rose-500" />
                  Core Temperature
                </span>
                <span className={`font-mono font-bold px-2 py-0.5 rounded ${
                  temperature > 39.5 ? 'bg-red-100 text-red-800' : 'bg-[#EAF7F0] text-[#16845B]'
                }`}>
                  {temperature.toFixed(1)}°C
                </span>
              </div>
              <input
                type="range"
                min="36.5"
                max="41.5"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-[#16845B] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#667085] mt-0.5">
                <span>36.5°C (Hypothermia)</span>
                <span>38.5°C Normal</span>
                <span>41.5°C (Pyrexia)</span>
              </div>
            </div>

            {/* Feeding Capacity Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#172033] flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-blue-500" />
                  Feed Intake Capacity
                </span>
                <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                  {feeding}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={feeding}
                onChange={(e) => setFeeding(parseInt(e.target.value))}
                className="w-full accent-[#16845B] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-[#667085] mt-0.5">
                <span>20% (Severe Anorexia)</span>
                <span>100% (Normal Intake)</span>
              </div>
            </div>

            {/* Activity Slider */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-semibold text-[#172033] flex items-center gap-1.5">
                  <Footprints className="w-3.5 h-3.5 text-amber-500" />
                  Herd Locomotion / Activity
                </span>
                <span className="font-mono font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded">
                  {activity}%
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="100"
                step="5"
                value={activity}
                onChange={(e) => setActivity(parseInt(e.target.value))}
                className="w-full accent-[#16845B] cursor-pointer"
              />
            </div>

            {/* Behavioral notes */}
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Visual Demeanor & Field Notes
              </label>
              <textarea
                rows={2}
                value={behaviorNotes}
                onChange={(e) => setBehaviorNotes(e.target.value)}
                placeholder="Observed posture, discharge, social isolation..."
                className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#16845B] focus:bg-white resize-none"
              />
            </div>

            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="w-full py-3 bg-[#16845B] hover:bg-[#126b49] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {analyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Orchestrating 6 Specialist Agents...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Execute Multi-Agent Assessment</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Execution Timeline & Results (7 Cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Agent Pipeline Visualizer */}
          <div className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#16845B]" />
              <span>Multi-Agent Swarm Orchestration</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              <div className={`p-3 rounded-xl border transition-colors ${
                analyzing ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-[#F7F9FC] border-[#E5EAF0] text-[#172033]'
              }`}>
                <span className="font-bold block">1. Sensor Agent</span>
                <span className="text-[10px] text-[#667085]">Thermal & Vitals</span>
              </div>
              <div className={`p-3 rounded-xl border transition-colors ${
                analyzing ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-[#F7F9FC] border-[#E5EAF0] text-[#172033]'
              }`}>
                <span className="font-bold block">2. Behavior Agent</span>
                <span className="text-[10px] text-[#667085]">Rumination Baselines</span>
              </div>
              <div className={`p-3 rounded-xl border transition-colors ${
                analyzing ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-[#F7F9FC] border-[#E5EAF0] text-[#172033]'
              }`}>
                <span className="font-bold block">3. Vision Agent</span>
                <span className="text-[10px] text-[#667085]">Postural CV Demeanor</span>
              </div>
              <div className={`p-3 rounded-xl border transition-colors ${
                analyzing ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-[#F7F9FC] border-[#E5EAF0] text-[#172033]'
              }`}>
                <span className="font-bold block">4. Risk Agent</span>
                <span className="text-[10px] text-[#667085]">Weighted Risk Scoring</span>
              </div>
              <div className={`p-3 rounded-xl border transition-colors ${
                analyzing ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-[#F7F9FC] border-[#E5EAF0] text-[#172033]'
              }`}>
                <span className="font-bold block">5. Knowledge Agent</span>
                <span className="text-[10px] text-[#667085]">Veterinary RAG Match</span>
              </div>
              <div className={`p-3 rounded-xl border transition-colors ${
                analyzing ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-[#F7F9FC] border-[#E5EAF0] text-[#172033]'
              }`}>
                <span className="font-bold block">6. Report Agent</span>
                <span className="text-[10px] text-[#667085]">Clinical Decision Report</span>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          {result && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Risk Score Summary Card */}
              <div className="bg-white border border-[#E5EAF0] rounded-2xl p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-[#667085]">Multi-Agent Synthesis Result</span>
                    <h3 className="text-xl font-bold text-[#172033] tracking-tight">Explainable Risk Score</h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowWhyModal(true)}
                      className="px-3 py-1.5 bg-[#F7F9FC] hover:bg-slate-100 border border-[#E5EAF0] text-[#172033] text-xs font-medium rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-[#16845B]" />
                      <span>Explain Score</span>
                    </button>

                    <button
                      onClick={handleDownloadPdf}
                      disabled={downloadingPdf}
                      className="px-3.5 py-1.5 bg-[#16845B] hover:bg-[#126b49] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs disabled:opacity-60"
                    >
                      {downloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>

                {/* Score Banner */}
                <div className="p-4 bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl flex items-center gap-6">
                  <div className="text-center shrink-0">
                    <div className={`text-4xl font-extrabold ${
                      result.risk.risk_level === 'HIGH' || result.risk.risk_level === 'CRITICAL' ? 'text-[#D14343]' :
                      result.risk.risk_level === 'MODERATE' ? 'text-[#B7791F]' : 'text-[#16845B]'
                    }`}>
                      {result.risk.risk_score}
                      <span className="text-base text-slate-400 font-normal"> / 100</span>
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085]">
                      {result.risk.risk_level} RISK
                    </span>
                  </div>

                  <div className="flex-1 space-y-2 text-xs">
                    <div className="flex justify-between text-[#667085]">
                      <span>Model Confidence: <strong>{Math.round(result.risk.confidence * 100)}%</strong></span>
                      <span>Prototype Decision Support Threshold</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          result.risk.risk_level === 'HIGH' || result.risk.risk_level === 'CRITICAL' ? 'bg-[#D14343]' :
                          result.risk.risk_level === 'MODERATE' ? 'bg-[#B7791F]' : 'bg-[#16845B]'
                        }`}
                        style={{ width: `${result.risk.risk_score}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Contributing factors */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  {result.risk.factors.map((f, i) => (
                    <div key={i} className="p-2.5 bg-white border border-[#E5EAF0] rounded-xl">
                      <span className="text-[#667085] text-[10px] block truncate">{f.name}</span>
                      <span className="font-bold text-[#172033] text-sm font-mono">{f.weight}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retrieved Veterinary Knowledge (RAG) */}
              <div className="bg-white border border-[#E5EAF0] rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-[#16845B]" />
                  <h3 className="font-bold text-sm text-[#172033]">Retrieved Veterinary Knowledge (RAG)</h3>
                </div>
                <p className="text-xs text-[#667085]">
                  Authoritative clinical literature matched against observed telemetry deviations:
                </p>

                <div className="space-y-3">
                  {result.knowledge.retrieved_documents.map((doc, idx) => (
                    <div key={idx} className="p-3.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#172033] text-sm">{doc.document}</span>
                        <span className="px-2 py-0.5 rounded bg-[#EAF7F0] text-[#16845B] text-[10px] font-semibold border border-[#C4EBD5]">
                          Relevance: {Math.round(doc.relevance * 100)}%
                        </span>
                      </div>
                      <p className="text-[#667085] leading-relaxed text-[11px]">{doc.relevant_information}</p>
                      <p className="text-[10px] text-slate-400">Source: {doc.source}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Generative AI Veterinary Clinical Summary */}
              <div className="bg-white border border-[#E5EAF0] rounded-2xl p-6 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#16845B]" />
                    <h3 className="font-bold text-sm text-[#172033]">Clinical Decision Support Assessment</h3>
                  </div>
                  <button
                    onClick={handleDownloadPdf}
                    disabled={downloadingPdf}
                    className="text-xs font-semibold text-[#16845B] hover:underline flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Report PDF</span>
                  </button>
                </div>

                <div className="p-4 bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-xs text-[#172033] whitespace-pre-wrap leading-relaxed font-sans">
                  {result.report.report_content}
                </div>

                {/* Mandatory Safety Notice */}
                <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-[11px] text-[#92400E] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                  <span>{result.report.disclaimer}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      ) : (
        /* YOLO26 Disease Risk Triage Layout (5 Target Diseases + Controls) */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Sample & Target Preset Selection (5 Cols) */}
          <div className="lg:col-span-5 space-y-5">
            <div className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#16845B]" />
                <span>1. Clinical Sample & Target Pathology</span>
              </h3>

              {/* Sample Type Selection */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Sample / Image Category
                </label>
                <select
                  value={yoloSampleType}
                  onChange={(e) => setYoloSampleType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-[#172033] focus:outline-none focus:border-[#16845B] focus:bg-white"
                >
                  <option value="manure_closeup">Manure Close-Up (Scour, Mucus, Frank Blood)</option>
                  <option value="urine_stream_perineal">Urine Stream / Perineal Region (Port-Wine, Turbid)</option>
                  <option value="full_calf_body">Full Calf Appearance (Lethargy, Dehydration)</option>
                  <option value="adult_cow_body">Adult Cow Body (Arched Posture, Flaccid Udder)</option>
                  <option value="head_mucous_membranes">Head & Mucous Membranes (Blunting, Petechiae)</option>
                </select>
              </div>

              {/* Prototype Disease Preset Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1">
                  Prototype Clinical Preset (Hold-out Test Split)
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'coccidiosis', label: 'Bovine Coccidiosis', desc: 'Eimeria spp. (Hemorrhagic scour)', badge: 'Disease' },
                    { id: 'salmonellosis', label: 'Bovine Salmonellosis', desc: 'S. enterica (Foul fibrinous diarrhea)', badge: 'Disease' },
                    { id: 'bvd', label: 'Bovine Viral Diarrhea', desc: 'BVDV (Watery mucoid scour)', badge: 'Disease' },
                    { id: 'leptospirosis', label: 'Bovine Leptospirosis', desc: 'Redwater port-wine hematuria', badge: 'Disease' },
                    { id: 'uti_kidney', label: 'UTI / Pyelonephritis', desc: 'Purulent turbid urine & stranguria', badge: 'Disease' },
                    { id: 'healthy', label: 'Healthy Control', desc: 'Normal formed manure / clear amber urine', badge: 'Control' },
                    { id: 'other_diarrhea', label: 'Other Diarrhea Control', desc: 'Nutritional / non-target viral scour', badge: 'Control' },
                  ].map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setYoloSelectedClass(p.id)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                        yoloSelectedClass === p.id
                          ? 'bg-[#EAF7F0] border-[#C4EBD5] text-[#16845B] font-semibold shadow-xs'
                          : 'bg-[#F7F9FC] border-[#E5EAF0] text-[#172033] hover:bg-slate-100'
                      }`}
                    >
                      <div>
                        <div className="font-bold">{p.label}</div>
                        <div className="text-[11px] text-[#667085]">{p.desc}</div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${p.badge === 'Control' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>
                        {p.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Run Button */}
              <button
                onClick={handleRunYoloScreening}
                disabled={yoloAnalyzing}
                className="w-full py-2.5 px-4 bg-[#16845B] hover:bg-[#126b49] disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                {yoloAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Running YOLO26 Visual Classifier...</span>
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    <span>Run YOLO26 Disease Risk Screening</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: YOLO26 Triage Report & Probabilities (7 Cols) */}
          <div className="lg:col-span-7 space-y-5">
            {yoloResult ? (
              <div className="space-y-5">
                {/* Executive Risk Banner */}
                <div className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5EAF0]">
                    <div>
                      <div className="text-xs text-[#667085] flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-[#16845B]" />
                        <span>Model: {yoloResult.model}</span>
                      </div>
                      <div className="text-base font-bold text-[#172033] mt-1">
                        Primary Finding: {yoloResult.top_indication}
                      </div>
                      <div className="text-xs text-[#667085]">
                        Calibrated Probability: <span className="font-mono font-bold text-[#172033]">{yoloResult.top_probability}%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-[11px] text-[#667085]">Calculated Risk</div>
                        <div className="text-2xl font-extrabold text-[#172033]">
                          {yoloResult.disease_risk_score} <span className="text-xs font-normal text-[#667085]">/ 100</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1.5 rounded-xl border text-xs font-bold ${
                        yoloResult.risk_tier.includes('CRITICAL') ? 'bg-red-100 text-red-800 border-red-300' :
                        yoloResult.risk_tier.includes('HIGH') ? 'bg-orange-100 text-orange-800 border-orange-300' :
                        yoloResult.risk_tier.includes('MEDIUM') ? 'bg-amber-100 text-amber-800 border-amber-300' :
                        'bg-emerald-100 text-emerald-800 border-emerald-300'
                      }`}>
                        {yoloResult.risk_tier}
                      </div>
                    </div>
                  </div>

                  {/* 7-Class Probability Distribution */}
                  <div className="pt-4 space-y-2">
                    <div className="text-xs font-bold text-[#172033] mb-2 flex items-center justify-between">
                      <span>7-Class Visual Probability Spectrum</span>
                      <span className="text-[10px] text-[#667085] font-normal">Softmax Calibrated</span>
                    </div>
                    {Object.entries(yoloResult.class_probabilities || {}).map(([cName, prob]: any) => (
                      <div key={cName} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#172033] text-[11px] font-medium">{cName}</span>
                          <span className="font-mono text-[11px] font-bold text-[#667085]">{prob}%</span>
                        </div>
                        <div className="w-full bg-[#E5EAF0] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              cName.includes('Healthy') ? 'bg-[#16845B]' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(100, prob)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Clinical Overlap Notice */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold">Pathological Overlap Alert</div>
                    <p className="text-[11px] leading-relaxed text-amber-800">
                      {yoloResult.veterinary_triage_report?.overlap_analysis}
                    </p>
                  </div>
                </div>

                {/* Mandated Confirmatory Diagnostic Tests */}
                <div className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#16845B]" />
                    <span>Required Laboratory Confirmatory Diagnostics</span>
                  </h4>
                  <div className="space-y-2">
                    {yoloResult.veterinary_triage_report?.recommended_confirmatory_diagnostics.map((test: string, idx: number) => (
                      <div key={idx} className="p-3 bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-xs text-[#172033] flex items-start gap-2.5">
                        <span className="font-mono font-bold text-[#16845B] text-[11px] shrink-0">#{idx + 1}</span>
                        <span>{test}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Supportive On-Farm Management */}
                <div className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-[#172033] uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Immediate On-Farm Supportive Protocol</span>
                  </h4>
                  <div className="space-y-2">
                    {yoloResult.veterinary_triage_report?.immediate_supportive_actions.map((act: string, idx: number) => (
                      <div key={idx} className="p-2.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-[#172033] flex items-start gap-2">
                        <ArrowRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                        <span>{act}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Regulatory Disclaimer */}
                <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-[11px] text-[#92400E] flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
                  <span>{yoloResult.regulatory_disclaimer}</span>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-slate-500 bg-white border border-[#E5EAF0] rounded-2xl space-y-2">
                <Cpu className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="font-semibold text-sm text-[#172033]">YOLO26 Custom Disease Risk Triage</div>
                <p className="max-w-md mx-auto text-[11px] text-[#667085]">
                  Select a clinical sample category (manure or urine) and pick one of the verified prototype disease presets (Coccidiosis, Salmonellosis, BVD, Leptospirosis, or UTI), then click Run to review the risk distribution and mandatory confirmatory tests.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Explainability Breakdown Modal */}
      {showWhyModal && result && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5EAF0] max-w-xl w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5EAF0] pb-3">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#16845B]" />
                <h3 className="font-bold text-base text-[#172033]">
                  Evidence Breakdown: Score {result.risk.risk_score}/100
                </h3>
              </div>
              <button 
                onClick={() => setShowWhyModal(false)}
                className="text-xs text-[#667085] hover:text-[#172033] font-semibold"
              >
                Close
              </button>
            </div>

            <p className="text-xs text-[#667085] leading-relaxed">
              Every point in the VET-AI risk score is grounded in verifiable evidence across physical vision, thermal deviations, and historical baseline deviations.
            </p>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {result.risk.factors.map((f, i) => (
                <div key={i} className="p-3 bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl flex items-start justify-between gap-4 text-xs">
                  <div>
                    <span className="font-bold text-[#172033]">{f.name}</span>
                    <p className="text-[11px] text-[#667085] mt-0.5">{f.detail}</p>
                    <span className="text-[10px] text-[#16845B] font-medium block mt-1">
                      Evidence Source: {f.evidence_type}
                    </span>
                  </div>
                  <span className="font-mono font-bold text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded">
                    {f.weight}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#E5EAF0] flex justify-end">
              <button
                onClick={() => setShowWhyModal(false)}
                className="px-4 py-2 bg-[#16845B] hover:bg-[#126b49] text-white text-xs font-semibold rounded-lg shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
