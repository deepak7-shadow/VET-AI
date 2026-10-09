import React, { useEffect, useState } from 'react';
import { 
  Layers, 
  Activity, 
  AlertTriangle, 
  ShieldAlert, 
  Cpu, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight, 
  ChevronRight,
  TrendingDown,
  Sparkles,
  Play
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { api } from '../services/api';
import { DashboardData } from '../types';
import { useAuth } from '../context/AuthContext';
import { ExcretaScreeningModal } from '../components/ExcretaScreeningModal';
import { AIAgentVisualizationHero } from '../components/AIAgentVisualizationHero';
import { FrameScrollShowcase } from '../components/FrameScrollShowcase';

interface DashboardProps {
  onNavigateToAnimal: (id: string) => void;
  onNavigateToAnalysis: (animalId?: string) => void;
  onNavigateToAgents: () => void;
  onNavigateToAlerts?: () => void;
  onOpenAddAnimal?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  onNavigateToAnimal, 
  onNavigateToAnalysis, 
  onNavigateToAgents,
  onNavigateToAlerts,
  onOpenAddAnimal
}) => {
  const { profile } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExcretaModalOpen, setIsExcretaModalOpen] = useState(false);
  const [showcaseMode, setShowcaseMode] = useState<'SCROLL_ANIMATION' | 'TELEMETRY'>('SCROLL_ANIMATION');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.getDashboardData();
      setData(res);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 20000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#16845B] animate-spin" />
          <p className="text-sm text-[#667085] font-medium">Loading Herd Intelligence...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-red-900 shadow-xs">
          <h3 className="font-bold text-base">Unable to connect to database</h3>
          <p className="text-xs mt-1 text-red-700">{error}</p>
          <button 
            onClick={fetchDashboard}
            className="mt-4 px-4 py-2 bg-[#16845B] hover:bg-[#126b49] text-white text-xs font-semibold rounded-lg shadow-xs"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const { stats, trends, recent_alerts, recent_agents } = data;

  const distribution = stats?.distribution || {
    low: stats?.low_count ?? stats?.healthy_count ?? 0,
    moderate: stats?.moderate_count ?? stats?.monitoring_count ?? 0,
    high: stats?.high_count ?? 0,
    critical: stats?.critical_count ?? 0
  };

  const riskPieData = [
    { name: 'Low Risk', value: distribution.low || 0, color: '#16845B' },
    { name: 'Moderate', value: distribution.moderate || 0, color: '#B7791F' },
    { name: 'High', value: distribution.high || 0, color: '#D97732' },
    { name: 'Critical', value: distribution.critical || 0, color: '#D14343' },
  ].filter(d => d.value > 0);

  const attentionCount = (stats?.monitoring_count ?? stats?.moderate_count ?? 0) + 
                         (stats?.high_risk_count ?? ((stats?.high_count ?? 0) + (stats?.critical_count ?? 0)));

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* View Switcher Bar */}
      <div className="card-surface p-2 sm:p-2.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          <button
            onClick={() => setShowcaseMode('SCROLL_ANIMATION')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              showcaseMode === 'SCROLL_ANIMATION'
                ? 'bg-[#16845B] text-white shadow-md shadow-emerald-900/15'
                : 'bg-[#F7F9FC] text-[#667085] hover:text-[#172033] hover:bg-slate-100'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>3D Frame Scroll Walkthrough</span>
          </button>
          <button
            onClick={() => setShowcaseMode('TELEMETRY')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              showcaseMode === 'TELEMETRY'
                ? 'bg-[#16845B] text-white shadow-md shadow-emerald-900/15'
                : 'bg-[#F7F9FC] text-[#667085] hover:text-[#172033] hover:bg-slate-100'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Live Telemetry Digital Twin</span>
          </button>
        </div>

        <div className="text-[11px] text-[#667085] font-medium hidden md:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#16845B] animate-pulse" />
          <span>Interactive 50 FPS Sequence • Scroll-Scrub Ready</span>
        </div>
      </div>

      {/* Hero Showcase Switcher: Frame Scroll Animation vs Live Telemetry Arena */}
      {showcaseMode === 'SCROLL_ANIMATION' ? (
        <FrameScrollShowcase
          totalFrames={120}
          onNavigateToAnalysis={onNavigateToAnalysis}
          onOpenExcretaModal={() => setIsExcretaModalOpen(true)}
        />
      ) : (
        <AIAgentVisualizationHero
          onNavigateToAnalysis={onNavigateToAnalysis}
          onOpenExcretaModal={() => setIsExcretaModalOpen(true)}
          onOpenAddAnimal={onOpenAddAnimal}
          stats={stats}
        />
      )}

      {/* 2. Key Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Animals */}
        <div className="card-surface p-4.5 sm:p-5 card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Total Herd</span>
            <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2.5 tracking-tight">{stats.total_animals}</p>
          <p className="text-[11px] text-[#667085] mt-1 truncate">Active registered livestock</p>
        </div>

        {/* Healthy / Low Risk */}
        <div className="card-surface p-4.5 sm:p-5 card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Healthy Status</span>
            <div className="p-2 rounded-xl bg-[#EAF7F0] text-[#16845B]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#16845B] mt-2.5 tracking-tight">{stats.healthy_count}</p>
          <p className="text-[11px] text-[#667085] mt-1 truncate">Vitals within baseline</p>
        </div>

        {/* Needs Attention */}
        <div className="card-surface p-4.5 sm:p-5 card-interactive">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Needs Attention</span>
            <div className="p-2 rounded-xl bg-[#FFEDD5] text-[#C2410C]">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#C2410C] mt-2.5 tracking-tight">{attentionCount}</p>
          <p className="text-[11px] text-[#667085] mt-1 truncate">
            {stats.high_risk_count ?? 0} High • {stats.monitoring_count ?? 0} Monitored
          </p>
        </div>

        {/* Open Alerts */}
        <div 
          onClick={() => onNavigateToAlerts && onNavigateToAlerts()}
          className="card-surface p-4.5 sm:p-5 card-interactive cursor-pointer hover:border-red-300"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Active Alerts</span>
            <div className="p-2 rounded-xl bg-[#FEE2E2] text-[#B91C1C]">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#B91C1C] mt-2.5 tracking-tight">{stats.open_alerts}</p>
          <p className="text-[11px] text-red-700 font-medium mt-1 flex items-center gap-1 truncate">
            <span>Require acknowledgment</span>
            <ArrowRight className="w-3 h-3 shrink-0" />
          </p>
        </div>

        {/* Average Risk Score */}
        <div className="card-surface p-4.5 sm:p-5 card-interactive col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#667085]">Herd Risk Index</span>
            <div className="p-2 rounded-xl bg-[#EFF6FF] text-[#1D4ED8]">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-[#172033] mt-2.5 tracking-tight">
            {stats.avg_risk_score} <span className="text-xs font-normal text-slate-400">/ 100</span>
          </p>
          <p className="text-[11px] text-[#667085] mt-1 truncate">Weighted multi-agent average</p>
        </div>
      </div>

      {/* 3. Charts & Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* 7-Day Herd Telemetry Trends */}
        <div className="lg:col-span-2 card-surface p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="font-bold text-sm text-[#172033]">7-Day Herd Telemetry Trends</h3>
              <p className="text-xs text-[#667085] mt-0.5">Core body temperature vs. baseline feed capacity</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-[#16845B]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#16845B]" />
                Temperature (°C)
              </span>
              <span className="flex items-center gap-1.5 text-[#3877C8]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#3877C8]" />
                Feed Capacity (%)
              </span>
            </div>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16845B" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16845B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date_label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} domain={[36, 42]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#FFFFFF', 
                    borderColor: '#E5EAF0', 
                    borderRadius: '12px',
                    fontSize: '12px',
                    boxShadow: '0 8px 16px -4px rgba(0,0,0,0.08)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="avg_temperature" 
                  stroke="#16845B" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#tempGradient)" 
                  name="Avg Temp (°C)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Distribution Donut */}
        <div className="card-surface p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-sm text-[#172033]">Herd Risk Classification</h3>
            <p className="text-xs text-[#667085] mt-0.5">Stratified by autonomous risk assessment</p>
          </div>

          <div className="h-48 my-2 relative flex items-center justify-center">
            {riskPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#FFFFFF', 
                      borderColor: '#E5EAF0', 
                      borderRadius: '8px',
                      fontSize: '11px' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 className="w-8 h-8 text-[#16845B] mb-2" />
                <p className="text-xs font-semibold text-[#172033]">Clean Slate</p>
                <p className="text-[11px] text-[#667085]">Register livestock to start risk monitoring.</p>
              </div>
            )}
            
            {riskPieData.length > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-[#172033]">{stats.total_animals}</span>
                <span className="text-[10px] text-[#667085] font-semibold uppercase tracking-wider">Head</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-3 border-t border-[#E5EAF0] text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#16845B] shrink-0" />
              <span className="text-[#667085] truncate">Low:</span>
              <span className="font-bold text-[#172033] ml-auto">{distribution.low}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B7791F] shrink-0" />
              <span className="text-[#667085] truncate">Mod:</span>
              <span className="font-bold text-[#172033] ml-auto">{distribution.moderate}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97732] shrink-0" />
              <span className="text-[#667085] truncate">High:</span>
              <span className="font-bold text-[#172033] ml-auto">{distribution.high}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D14343] shrink-0" />
              <span className="text-[#667085] truncate">Crit:</span>
              <span className="font-bold text-[#172033] ml-auto">{distribution.critical}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Priority Alerts & Agent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Alerts */}
        <div className="card-surface p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#B91C1C]" />
              <h3 className="font-bold text-sm text-[#172033]">Urgent Clinical Alerts</h3>
            </div>
            {onNavigateToAlerts && (
              <button 
                onClick={onNavigateToAlerts}
                className="text-xs text-[#16845B] hover:underline font-semibold flex items-center gap-1"
              >
                <span>View all alerts</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {recent_alerts.length === 0 ? (
            <div className="p-8 text-center bg-[#F7F9FC] rounded-2xl border border-dashed border-[#E5EAF0]">
              <CheckCircle2 className="w-8 h-8 text-[#16845B] mx-auto mb-2" />
              <p className="text-xs font-semibold text-[#172033]">No Open Clinical Alerts</p>
              <p className="text-[11px] text-[#667085] mt-0.5">All monitored livestock are within acceptable parameters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recent_alerts.slice(0, 3).map((alert) => (
                <div 
                  key={alert.id}
                  onClick={() => alert.animal_id && onNavigateToAnimal(alert.animal_id)}
                  className="p-3.5 bg-[#F7F9FC] hover:bg-slate-100/80 border border-[#E5EAF0] rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between mb-1.5 gap-2">
                    <span className="font-bold text-xs text-[#172033] flex items-center gap-1.5 truncate">
                      <span className="w-2 h-2 rounded-full bg-[#D14343] shrink-0" />
                      {alert.animal_id} • {alert.title}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      alert.severity === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      alert.severity === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-[#667085] line-clamp-2 leading-relaxed">
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Live Multi-Agent Execution Log */}
        <div className="card-surface p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#16845B]" />
              <h3 className="font-bold text-sm text-[#172033]">Recent Agent Activities</h3>
            </div>
            <button 
              onClick={onNavigateToAgents}
              className="text-xs text-[#16845B] hover:underline font-semibold flex items-center gap-1"
            >
              <span>Agent pipeline</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recent_agents.length === 0 ? (
              <div className="p-8 text-center bg-[#F7F9FC] rounded-2xl border border-dashed border-[#E5EAF0]">
                <Cpu className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#172033]">Agents Standing By</p>
                <p className="text-[11px] text-[#667085] mt-0.5">Run screening to trigger multi-agent pipeline executions.</p>
              </div>
            ) : (
              recent_agents.slice(0, 4).map((agent) => (
                <div 
                  key={agent.id}
                  className="p-3 bg-[#F7F9FC] border border-[#E5EAF0] rounded-xl flex items-center justify-between text-xs gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#EAF7F0] text-[#16845B] font-bold flex items-center justify-center text-[11px] shrink-0">
                      {agent.agent_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-[#172033] truncate">{agent.agent_name}</p>
                      <p className="text-[11px] text-[#667085] truncate">{agent.animal_code || 'Herd Telemetry'}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="inline-block text-[10px] font-semibold text-[#16845B] bg-[#EAF7F0] px-2 py-0.5 rounded-full">
                      {agent.status}
                    </span>
                    <p className="text-[10px] text-[#667085] mt-0.5">{agent.execution_time_ms} ms</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Field Manure & Urine Screening Modal */}
      <ExcretaScreeningModal
        isOpen={isExcretaModalOpen}
        onClose={() => setIsExcretaModalOpen(false)}
        onNavigateToAnimal={onNavigateToAnimal}
        onAnalysisSuccess={() => {
          fetchDashboard();
        }}
      />
    </div>
  );
};
