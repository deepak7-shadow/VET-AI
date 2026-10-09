import React, { useState } from 'react';
import { 
  Sparkles, 
  Activity, 
  ShieldCheck, 
  Eye, 
  Thermometer, 
  Footprints, 
  Cpu, 
  Plus, 
  ChevronRight,
  TrendingUp,
  Scan,
  Zap
} from 'lucide-react';
import cowTwinImg from '../assets/cow_twin_full.png';

interface AIAgentVisualizationHeroProps {
  onNavigateToAnalysis: (animalId?: string) => void;
  onOpenExcretaModal: () => void;
  onOpenAddAnimal?: () => void;
  stats: {
    total_animals: number;
    healthy_count: number;
    monitoring_count?: number;
    moderate_count?: number;
    high_risk_count?: number;
    high_count?: number;
    critical_count?: number;
    avg_risk_score?: number;
  };
}

export const AIAgentVisualizationHero: React.FC<AIAgentVisualizationHeroProps> = ({
  onNavigateToAnalysis,
  onOpenExcretaModal,
  onOpenAddAnimal,
  stats
}) => {
  const [activeTelemetryTab, setActiveTelemetryTab] = useState<'vitals' | 'behavior' | 'vision'>('vitals');

  // Compute healthy percentage
  const total = stats.total_animals || 0;
  const healthy = stats.healthy_count || 0;
  const healthyPercent = total > 0 ? Math.round((healthy / total) * 100) : 100;
  const attentionCount = (stats.monitoring_count ?? stats.moderate_count ?? 0) + 
                         (stats.high_risk_count ?? ((stats.high_count ?? 0) + (stats.critical_count ?? 0)));

  return (
    <div className="card-elevated bg-white/95 backdrop-blur-md border border-[#E5EAF0] rounded-3xl p-5 sm:p-7 shadow-xl shadow-emerald-950/5 relative overflow-hidden">
      {/* Background ambient lighting glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-blue-500/3 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">
              AI Agent Visualization
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EAF7F0] border border-[#C4EBD5] text-[#16845B] text-xs font-semibold shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#16845B] animate-pulse" />
              <span>Live Screening Engine Active</span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1 font-medium">
            Multi-Agent Digital Twin Telemetry & Predictive Herd Health Intelligence
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenExcretaModal}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100/90 border border-amber-200 text-amber-900 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all shadow-xs"
            title="Screen manure or urine photos for disease signs"
          >
            <span className="text-sm">💩</span>
            <span>Screen Manure / Urine</span>
            <span className="bg-amber-200/90 text-amber-950 text-[10px] font-bold px-1.5 py-0.5 rounded-md">
              YOLO26
            </span>
          </button>

          {onOpenAddAnimal && (
            <button
              onClick={onOpenAddAnimal}
              className="px-3.5 py-2 bg-white border border-[#E5EAF0] hover:bg-slate-50 text-[#172033] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4 text-[#16845B]" />
              <span>Register Animal</span>
            </button>
          )}

          <button
            onClick={() => onNavigateToAnalysis()}
            className="btn-primary text-xs shadow-md shadow-emerald-900/15"
          >
            <Sparkles className="w-4 h-4" />
            <span>Run AI Screening</span>
          </button>
        </div>
      </div>

      {/* Main Hero Split Grid: 3D Twin Centerpiece + Herd Intelligence Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        
        {/* Left / Center: Interactive 3D Livestock Digital Twin Arena */}
        <div className="lg:col-span-8 bg-gradient-to-b from-[#F7F9FC]/90 via-[#F3F7F4]/60 to-[#EBF3ED]/40 rounded-2xl border border-[#E5EAF0] p-4 sm:p-6 relative min-h-[360px] sm:min-h-[420px] flex items-center justify-center overflow-hidden">
          
          {/* Holographic Radar Scanning Rings (SVG Overlay) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {/* Outer Slow Orbit Ring */}
            <div className="w-[340px] sm:w-[460px] h-[340px] sm:h-[460px] rounded-full border border-dashed border-[#16845B]/20 animate-radar-spin flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#16845B] shadow-sm shadow-[#16845B] -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Middle Reverse Pulse Ring */}
            <div className="absolute w-[280px] sm:w-[380px] h-[280px] sm:h-[380px] rounded-full border border-[#16845B]/25 animate-radar-spin-reverse flex items-center justify-center">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-xs translate-x-1/2 translate-y-1/2" />
            </div>

            {/* Elliptical Horizon Scan Rings */}
            <div className="absolute w-[360px] sm:w-[500px] h-[120px] sm:h-[160px] rounded-full border border-[#16845B]/30 animate-radar-pulse transform -rotate-6" />
            <div className="absolute w-[320px] sm:w-[440px] h-[90px] sm:h-[120px] rounded-full border border-[#16845B]/20 transform rotate-12" />
          </div>

          {/* Central 3D Livestock Model */}
          <div className="relative z-10 flex flex-col items-center justify-center">
            <div className="relative group cursor-pointer transition-transform duration-300 hover:scale-105">
              <img 
                src={cowTwinImg} 
                alt="VET-AI 3D Digital Twin Livestock Model" 
                className="w-64 sm:w-80 md:w-96 object-contain drop-shadow-2xl select-none"
              />
              
              {/* Radar Target Crosshairs on Core Anatomy */}
              <div className="absolute top-1/4 left-1/3 w-4 h-4 rounded-full border border-emerald-500 bg-emerald-500/20 animate-ping pointer-events-none" />
              <div className="absolute top-1/2 right-1/4 w-3.5 h-3.5 rounded-full border border-blue-500 bg-blue-500/20 animate-pulse pointer-events-none" />
            </div>

            {/* Base Shadow & Pedestal */}
            <div className="w-48 sm:w-64 h-4 bg-emerald-950/10 rounded-full blur-md -mt-2 pointer-events-none" />
          </div>

          {/* HUD Floating Telemetry Overlays */}
          
          {/* Top-Left HUD: Biometric Telemetry */}
          <div className="absolute top-4 left-4 z-20 hidden sm:block animate-hud-float">
            <div className="bg-white/95 backdrop-blur-md border border-[#E5EAF0] shadow-lg rounded-xl p-3 max-w-[210px]">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[10px] font-bold text-[#16845B] uppercase tracking-wider flex items-center gap-1">
                  <Thermometer className="w-3 h-3" />
                  Thermal Vitals
                </span>
                <span className="text-[9px] font-semibold bg-[#EAF7F0] text-[#16845B] px-1.5 py-0.2 rounded">
                  Optimal
                </span>
              </div>
              <div className="text-xs font-bold text-[#172033]">
                38.6°C <span className="text-[10px] font-normal text-[#667085]">• Core Temp</span>
              </div>
              <div className="text-[10px] text-[#667085] mt-0.5">
                Respiratory: 28 bpm (Calm)
              </div>
            </div>
          </div>

          {/* Top-Right HUD: Autonomous Behavior */}
          <div className="absolute top-4 right-4 z-20 hidden sm:block animate-hud-float" style={{ animationDelay: '1.5s' }}>
            <div className="bg-white/95 backdrop-blur-md border border-[#E5EAF0] shadow-lg rounded-xl p-3 max-w-[210px] text-right">
              <div className="flex items-center justify-end gap-1.5 mb-1.5">
                <span className="text-[9px] font-semibold bg-blue-50 text-[#1D4ED8] px-1.5 py-0.2 rounded">
                  Sound Gait
                </span>
                <span className="text-[10px] font-bold text-[#3877C8] uppercase tracking-wider flex items-center gap-1">
                  <Footprints className="w-3 h-3" />
                  Locomotion
                </span>
              </div>
              <div className="text-xs font-bold text-[#172033]">
                Score 1.0 <span className="text-[10px] font-normal text-[#667085]">/ 5.0</span>
              </div>
              <div className="text-[10px] text-[#667085] mt-0.5">
                Rumination: 485 min/day
              </div>
            </div>
          </div>

          {/* Bottom-Left HUD: Computer Vision Agent */}
          <div className="absolute bottom-4 left-4 z-20 hidden md:block animate-hud-float" style={{ animationDelay: '2.5s' }}>
            <div className="bg-white/95 backdrop-blur-md border border-[#E5EAF0] shadow-lg rounded-xl p-3 max-w-[200px]">
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#172033] mb-1">
                <Eye className="w-3 h-3 text-[#16845B]" />
                <span>Vision Agent</span>
              </div>
              <p className="text-[10px] text-[#667085] leading-tight">
                Posture: Standing Alert
                <br />
                Skin / Eye: Clear (0.00)
              </p>
            </div>
          </div>

          {/* Bottom-Right HUD: Multi-Agent Clinical Assessment */}
          <div className="absolute bottom-4 right-4 z-20 hidden md:block animate-hud-float" style={{ animationDelay: '3.5s' }}>
            <div className="bg-white/95 backdrop-blur-md border border-[#E5EAF0] shadow-lg rounded-xl p-3 max-w-[210px] text-right">
              <div className="flex items-center justify-end gap-1.5 text-[10px] font-bold text-[#172033] mb-1">
                <span>RAG Verified</span>
                <ShieldCheck className="w-3 h-3 text-[#16845B]" />
              </div>
              <div className="text-xs font-bold text-[#16845B]">
                {healthyPercent}% Baseline Health
              </div>
              <p className="text-[10px] text-[#667085] mt-0.5">
                Clinical risk within range
              </p>
            </div>
          </div>

          {/* Center Bottom Status Pill */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20">
            <div className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-[#E5EAF0] text-[11px] text-[#667085] font-medium shadow-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#16845B]" />
              <span>Multi-Modal Telemetry Active</span>
            </div>
          </div>
        </div>

        {/* Right: Herd Health Intelligence & Breakdown (Matching Reference Video Right Panel) */}
        <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
          
          {/* Herd Health Metric Ring Card */}
          <div className="bg-[#F7F9FC] border border-[#E5EAF0] rounded-2xl p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-sm text-[#172033]">Herd Health Index</h3>
                <p className="text-[11px] text-[#667085]">Autonomous aggregate score</p>
              </div>
              <span className="p-1.5 rounded-lg bg-white border border-[#E5EAF0] text-[#16845B]">
                <Activity className="w-4 h-4" />
              </span>
            </div>

            {/* Circular Progress Gauge */}
            <div className="flex items-center justify-center my-4">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  {/* Background Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#E5EAF0"
                    strokeWidth="8"
                  />
                  {/* Foreground Progress Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke="#16845B"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * healthyPercent) / 100}
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-[#172033] tracking-tight">
                    {healthyPercent}%
                  </span>
                  <span className="text-[10px] font-semibold text-[#16845B] uppercase tracking-wider">
                    Optimal
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Metrics Breakdown */}
            <div className="space-y-2 pt-2 border-t border-[#E5EAF0]">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#16845B]" />
                  Healthy Herd
                </span>
                <span className="font-bold text-[#172033]">{stats.healthy_count} head</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#B7791F]" />
                  Needs Attention
                </span>
                <span className="font-bold text-[#C2410C]">{attentionCount} head</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#667085] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#3877C8]" />
                  Total Registered
                </span>
                <span className="font-bold text-[#172033]">{stats.total_animals} head</span>
              </div>
            </div>
          </div>

          {/* Quick Screening Action Banner */}
          <div className="bg-gradient-to-br from-[#16845B] to-[#0F5C3E] rounded-2xl p-4 text-white shadow-md shadow-emerald-950/15">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-emerald-300" />
              <span className="text-xs font-bold uppercase tracking-wider">Instant Screening</span>
            </div>
            <p className="text-xs text-emerald-100 leading-relaxed mb-3">
              Deploy all 6 specialist agents on any animal for clinical disease risk detection.
            </p>
            <button
              onClick={() => onNavigateToAnalysis()}
              className="w-full py-2 bg-white text-[#16845B] hover:bg-emerald-50 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors shadow-xs"
            >
              <span>Screen Herd Now</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
