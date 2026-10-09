import React, { useEffect, useState } from 'react';
import { 
  ArrowLeft, 
  Activity, 
  Zap, 
  AlertTriangle, 
  FileText, 
  Thermometer, 
  Utensils, 
  Footprints, 
  RefreshCw,
  Eye,
  CheckCircle2,
  ShieldAlert,
  Download,
  Calendar,
  Building,
  Sparkles,
  Loader2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import { api } from '../services/api';
import { ExcretaScreeningModal } from '../components/ExcretaScreeningModal';

interface AnimalProfileProps {
  animalId: string;
  onBack: () => void;
  onAnalyzeAnimal: (animalId: string) => void;
  onSimulationSuccess?: (res: any) => void;
}

export const AnimalProfile: React.FC<AnimalProfileProps> = ({ 
  animalId, 
  onBack, 
  onAnalyzeAnimal
}) => {
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingReportId, setDownloadingReportId] = useState<string | null>(null);
  const [isExcretaModalOpen, setIsExcretaModalOpen] = useState(false);


  const fetchHistory = async () => {
    try {
      setLoading(true);
      const res = await api.getAnimalHistory(animalId);
      setHistory(res);
    } catch (err: any) {
      console.error('Failed to load animal profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [animalId]);

  const handleDownloadPdf = async (reportId: string) => {
    try {
      setDownloadingReportId(reportId);
      await api.downloadReportPdf(reportId, animalId);
    } catch (err: any) {
      alert(`PDF download failed: ${err.message}`);
    } finally {
      setDownloadingReportId(null);
    }
  };

  if (loading || !history) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#16845B] animate-spin" />
          <p className="text-xs text-[#667085]">Retrieving historical health observations...</p>
        </div>
      </div>
    );
  }

  const { animal, observations, risk_assessments, alerts, reports } = history;
  const riskScore = parseFloat(animal.current_risk_score) || 0;
  const riskLevel = (animal.current_risk_level || 'LOW').toUpperCase();

  // Chart telemetry formatting
  const chartData = (observations || []).slice(0, 15).reverse().map((o: any) => ({
    time: new Date(o.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit' }),
    temperature: parseFloat(o.temperature) || 38.5,
    feeding: parseFloat(o.feeding_percentage) || 100,
    activity: parseFloat(o.activity_percentage) || 100
  }));

  const latestObservation = observations && observations.length > 0 ? observations[0] : null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top back navigation & quick analyze */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button 
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#667085] hover:text-[#172033] bg-white border border-[#E5EAF0] px-3.5 py-2 rounded-xl transition-colors shadow-xs"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Livestock Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExcretaModalOpen(true)}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
          >
            <span className="text-sm">💩</span>
            <span>Screen Manure / Urine</span>
            <span className="bg-amber-200 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              YOLO26
            </span>
          </button>

          <button
            onClick={() => onAnalyzeAnimal(animal.animal_id)}
            className="px-4 py-2 bg-[#16845B] hover:bg-[#126b49] text-white text-xs font-semibold rounded-xl flex items-center gap-2 transition-colors shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            <span>Run AI Health Assessment</span>
          </button>
        </div>
      </div>


      {/* Hero Overview Card */}
      <div className="bg-white border border-[#E5EAF0] rounded-2xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="relative h-48 md:h-40 rounded-xl overflow-hidden bg-slate-100 border border-[#E5EAF0]">
          <img 
            src={animal.image_url || 'https://images.unsplash.com/photo-1546445317-29f4545e9d53'}
            alt={animal.animal_id}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-xs text-white text-xs font-mono font-bold px-2.5 py-1 rounded-md">
            {animal.animal_id}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-[#172033] tracking-tight">{animal.breed || animal.species}</h2>
            <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
              {animal.species}
            </span>
          </div>
          <p className="text-xs text-[#667085] flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-slate-400" />
            <span>Farm Facility: <strong>{animal.farm || 'Green Valley Dairy'}</strong></span>
          </p>
          <div className="pt-2 grid grid-cols-2 gap-2 text-xs text-[#667085]">
            <div>Age: <strong className="text-[#172033]">{animal.age || 2.0} years</strong></div>
            <div>Gender: <strong className="text-[#172033]">{animal.gender || 'Female'}</strong></div>
          </div>
        </div>

        <div className="p-4 bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#667085]">Autonomous Health Risk</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              riskLevel === 'CRITICAL' ? 'bg-[#FEE2E2] text-[#B91C1C]' :
              riskLevel === 'HIGH' ? 'bg-[#FFEDD5] text-[#C2410C]' :
              riskLevel === 'MODERATE' ? 'bg-[#FEF9C3] text-[#854D0E]' :
              'bg-[#EAF7F0] text-[#16845B]'
            }`}>
              {riskLevel}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#172033]">{riskScore.toFixed(0)}</span>
            <span className="text-xs text-slate-400">/ 100 risk score</span>
          </div>
          <p className="text-[11px] text-[#667085] mt-2">
            {riskScore < 30 ? 'Vitals stable. No clinical intervention indicated.' :
             riskScore < 60 ? 'Early biometric deviation. Monitor feed intake.' :
             'Acute pyrexia or feeding refusal. Veterinary evaluation advised.'}
          </p>
        </div>
      </div>

      {/* Vitals Telemetry Row */}
      {latestObservation && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-[#E5EAF0] rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="p-3 bg-[#EAF7F0] text-[#16845B] rounded-xl">
              <Thermometer className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#667085]">Core Temperature</p>
              <p className="text-xl font-bold text-[#172033]">{latestObservation.temperature || 38.5}°C</p>
              <p className="text-[10px] text-[#667085] mt-0.5">Normal baseline: 38.5°C</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5EAF0] rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="p-3 bg-[#EFF6FF] text-[#1D4ED8] rounded-xl">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#667085]">Feed Intake Capacity</p>
              <p className="text-xl font-bold text-[#172033]">{latestObservation.feeding_percentage || 100}%</p>
              <p className="text-[10px] text-[#667085] mt-0.5">Bunk feeding telemetry</p>
            </div>
          </div>

          <div className="bg-white border border-[#E5EAF0] rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="p-3 bg-[#FEF9C3] text-[#854D0E] rounded-xl">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-[#667085]">Collar Locomotion</p>
              <p className="text-xl font-bold text-[#172033]">{latestObservation.activity_percentage || 100}%</p>
              <p className="text-[10px] text-[#667085] mt-0.5">24h herd motion index</p>
            </div>
          </div>
        </div>
      )}

      {/* Historical Telemetry Chart */}
      {chartData.length > 0 && (
        <div className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#172033]">Telemetry Observation Timeline</h3>
              <p className="text-xs text-[#667085]">Continuous thermal and behavioral readings for {animal.animal_id}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 text-[#16845B]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16845B]" />
                Temperature (°C)
              </span>
              <span className="flex items-center gap-1.5 text-[#1D4ED8]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#1D4ED8]" />
                Feeding (%)
              </span>
            </div>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="time" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} domain={[36, 42]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderColor: '#E5EAF0', 
                    borderRadius: '12px',
                    fontSize: '11px' 
                  }} 
                />
                <Line type="monotone" dataKey="temperature" stroke="#16845B" strokeWidth={2} dot={{ r: 3 }} name="Temp (°C)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Associated Clinical Reports & Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reports with PDF Download */}
        <div className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#16845B]" />
              <h3 className="text-sm font-bold text-[#172033]">Clinical Decision Reports</h3>
            </div>
            <span className="text-xs text-[#667085]">{reports?.length || 0} Generated</span>
          </div>

          {!reports || reports.length === 0 ? (
            <div className="p-8 text-center bg-[#F7F9FC] rounded-xl border border-dashed border-[#E5EAF0]">
              <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-[#667085]">No clinical reports generated for this animal yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r: any) => (
                <div 
                  key={r.id}
                  className="p-3.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#172033]">
                        {new Date(r.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        r.risk_level === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                        r.risk_level === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                        'bg-emerald-100 text-emerald-800'
                      }`}>
                        {r.risk_level} ({r.risk_score})
                      </span>
                    </div>
                    <p className="text-[11px] text-[#667085] line-clamp-1">{r.summary}</p>
                  </div>

                  <button
                    onClick={() => handleDownloadPdf(r.id)}
                    disabled={downloadingReportId === r.id}
                    className="px-3 py-1.5 bg-[#16845B] hover:bg-[#126b49] text-white text-xs font-medium rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-xs shrink-0 disabled:opacity-60"
                  >
                    {downloadingReportId === r.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    <span>Download PDF</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Associated Alerts */}
        <div className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#B91C1C]" />
              <h3 className="text-sm font-bold text-[#172033]">Recent Health Alerts</h3>
            </div>
            <span className="text-xs text-[#667085]">{alerts?.length || 0} Alerts</span>
          </div>

          {!alerts || alerts.length === 0 ? (
            <div className="p-8 text-center bg-[#F7F9FC] rounded-xl border border-dashed border-[#E5EAF0]">
              <CheckCircle2 className="w-8 h-8 text-[#16845B] mx-auto mb-2" />
              <p className="text-xs text-[#667085]">No active or historical alerts for this animal.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {alerts.map((alert: any) => (
                <div 
                  key={alert.id}
                  className="p-3.5 bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl text-xs space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#172033]">{alert.title}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800">
                      {alert.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#667085] leading-relaxed">{alert.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Field Manure & Urine Screening Modal */}
      <ExcretaScreeningModal
        isOpen={isExcretaModalOpen}
        onClose={() => setIsExcretaModalOpen(false)}
        preselectedAnimalId={animal.animal_id}
        onAnalysisSuccess={() => {
          fetchHistory();
        }}
      />
    </div>
  );
};

