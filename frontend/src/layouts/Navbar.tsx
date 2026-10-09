import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  RotateCcw, 
  ShieldCheck, 
  Loader2, 
  Menu, 
  ChevronDown, 
  User, 
  LogOut, 
  LogIn, 
  Settings as SettingsIcon,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onSimulationSuccess: (result: any) => void;
  onResetSuccess: () => void;
  onOpenAuth: () => void;
  onToggleMobileMenu: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentTab, 
  setCurrentTab,
  onSimulationSuccess, 
  onResetSuccess,
  onOpenAuth,
  onToggleMobileMenu
}) => {
  const { user, profile, isDemo, signOut } = useAuth();
  const [simulating, setSimulating] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showDemoMenu, setShowDemoMenu] = useState(false);
  const [isBackendHealthy, setIsBackendHealthy] = useState<boolean | null>(null);

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const demoMenuRef = useRef<HTMLDivElement>(null);

  // Verified health check
  useEffect(() => {
    api.checkHealth()
      .then(() => setIsBackendHealthy(true))
      .catch(() => setIsBackendHealthy(false));
    
    const interval = setInterval(() => {
      api.checkHealth()
        .then(() => setIsBackendHealthy(true))
        .catch(() => setIsBackendHealthy(false));
    }, 45000);

    return () => clearInterval(interval);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (demoMenuRef.current && !demoMenuRef.current.contains(e.target as Node)) {
        setShowDemoMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTitle = () => {
    switch (currentTab) {
      case 'dashboard': return 'Farm Health Dashboard';
      case 'animals': return 'Livestock Directory';
      case 'analysis': return 'AI Health Analysis Console';
      case 'agents': return 'Multi-Agent Intelligence';
      case 'alerts': return 'Early Warning Alerts';
      case 'reports': return 'Veterinary Clinical Reports';
      case 'settings': return 'Farm & System Settings';
      default: return 'Livestock Intelligence';
    }
  };

  const handleSimulate = async () => {
    try {
      setSimulating(true);
      setShowDemoMenu(false);
      const res = await api.simulateHealthEvent('COW-027');
      onSimulationSuccess(res);
    } catch (err: any) {
      alert(`Simulation error: ${err.message}`);
    } finally {
      setSimulating(false);
    }
  };

  const handleReset = async () => {
    try {
      setResetting(true);
      setShowDemoMenu(false);
      await api.resetDemo();
      onResetSuccess();
    } catch (err: any) {
      alert(`Demo reset error: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E5EAF0] px-4 sm:px-6 flex items-center justify-between z-30 sticky top-0">
      {/* Left: Mobile hamburger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg lg:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-[#172033] tracking-tight">{getTitle()}</h1>
        </div>

        {/* Verified Server & DB Health Indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#F7F9FC] border border-[#E5EAF0] text-[11px] text-[#667085]">
          {isBackendHealthy === true ? (
            <>
              <span className="w-2 h-2 rounded-full bg-[#16845B]" />
              <span className="font-medium text-[#16845B]">System Online</span>
            </>
          ) : isBackendHealthy === false ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="font-medium text-amber-700">Offline Fallback</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
              <span>Verifying Connection...</span>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions & User Controls */}
      <div className="flex items-center gap-2.5">
        {/* Safety Disclaimer button */}
        <button
          onClick={() => setShowDisclaimer(true)}
          className="hidden sm:flex text-xs text-[#667085] hover:text-[#172033] items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#E5EAF0] hover:bg-[#F7F9FC] transition-colors"
          title="Clinical Safety Protocol"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-[#16845B]" />
          <span>Safety Notice</span>
        </button>

        {/* Demo Mode Dropdown Panel */}
        <div className="relative" ref={demoMenuRef}>
          <button
            onClick={() => setShowDemoMenu(!showDemoMenu)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-[#C4EBD5] bg-[#EAF7F0] text-[#16845B] hover:bg-[#d8f2e3] flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-[#16845B]" />
            <span className="font-semibold">Demo Sandbox</span>
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showDemoMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E5EAF0] rounded-xl shadow-xl p-3 z-50 text-left animate-in fade-in duration-150">
              <div className="border-b border-[#E5EAF0] pb-2 mb-2">
                <p className="text-xs font-bold text-[#172033]">Demonstration Controls</p>
                <p className="text-[11px] text-[#667085]">
                  Test acute illness detection workflow on Holstein cow COW-027.
                </p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleSimulate}
                  disabled={simulating || resetting}
                  className="w-full py-2 px-3 bg-[#16845B] hover:bg-[#126b49] text-white text-xs font-semibold rounded-lg flex items-center justify-between transition-colors disabled:opacity-60"
                >
                  <span className="flex items-center gap-1.5">
                    {simulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 text-amber-200 fill-amber-200" />}
                    <span>Simulate Fever (COW-027)</span>
                  </span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded">Risk 78</span>
                </button>

                <button
                  onClick={handleReset}
                  disabled={simulating || resetting}
                  className="w-full py-1.5 px-3 bg-[#F7F9FC] hover:bg-slate-100 text-[#172033] border border-[#E5EAF0] text-xs font-medium rounded-lg flex items-center justify-between transition-colors disabled:opacity-60"
                >
                  <span className="flex items-center gap-1.5">
                    {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5 text-slate-500" />}
                    <span>Reset to Healthy Baseline</span>
                  </span>
                  <span className="text-[10px] text-[#16845B]">Risk 18</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Farmer Profile Menu */}
        <div className="relative" ref={profileMenuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-[#E5EAF0] hover:bg-[#F7F9FC] transition-colors"
          >
            <div className="w-7 h-7 rounded-lg bg-[#EAF7F0] text-[#16845B] font-bold text-xs flex items-center justify-center border border-[#C4EBD5]">
              {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : 'F'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-[#172033] leading-none">
                {profile?.full_name || (isDemo ? 'John Miller (Demo)' : 'Farmer')}
              </p>
              <p className="text-[10px] text-[#667085] leading-none mt-0.5">
                {profile?.farm_name || 'Green Valley Dairy'}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-60 bg-white border border-[#E5EAF0] rounded-xl shadow-xl py-2 z-50 text-left animate-in fade-in duration-150">
              <div className="px-4 py-2 border-b border-[#E5EAF0]">
                <p className="text-xs font-bold text-[#172033]">{profile?.full_name || 'Farmer Account'}</p>
                <p className="text-[11px] text-[#667085] truncate">{profile?.email || (isDemo ? 'demo.farmer@greenvalley.farm' : '')}</p>
                <span className="inline-block mt-1 text-[10px] font-semibold bg-[#EAF7F0] text-[#16845B] px-1.5 py-0.5 rounded">
                  {isDemo ? 'Sandbox Demo Account' : 'Verified Farmer'}
                </span>
              </div>

              <div className="py-1">
                <button
                  onClick={() => { setCurrentTab('settings'); setShowProfileMenu(false); }}
                  className="w-full px-4 py-2 text-xs text-[#172033] hover:bg-[#F7F9FC] flex items-center gap-2 transition-colors"
                >
                  <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>Farm Settings & Profile</span>
                </button>
              </div>

              <div className="border-t border-[#E5EAF0] pt-1">
                {user ? (
                  <button
                    onClick={() => { signOut(); setShowProfileMenu(false); }}
                    className="w-full px-4 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                ) : (
                  <button
                    onClick={() => { onOpenAuth(); setShowProfileMenu(false); }}
                    className="w-full px-4 py-2 text-xs text-[#16845B] hover:bg-[#EAF7F0] font-semibold flex items-center gap-2 transition-colors"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In / Create Account</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Safety Protocol Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E5EAF0] max-w-md w-full rounded-2xl p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 text-[#16845B] mb-3">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="font-bold text-lg text-[#172033]">Clinical Decision Support Protocol</h3>
            </div>
            <p className="text-sm text-[#667085] leading-relaxed mb-4">
              VET-AI provides AI-assisted health-risk monitoring and early disease screening based on multi-sensor telemetry, computer vision, and veterinary literature.
            </p>
            <div className="bg-[#FFFBEB] border border-[#FDE68A] p-3 rounded-xl text-xs text-[#92400E] mb-5 space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
                <span>Mandatory Clinical Limitations</span>
              </p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Does <strong>NOT</strong> provide definitive medical diagnosis.</li>
                <li>Never auto-prescribes drugs, antibiotics, or treatment dosages.</li>
                <li>Always consult a licensed herd veterinarian for clinical evaluation.</li>
              </ul>
            </div>
            <button
              onClick={() => setShowDisclaimer(false)}
              className="w-full py-2.5 bg-[#16845B] hover:bg-[#126b49] text-white text-sm font-semibold rounded-xl shadow-xs transition-colors"
            >
              Acknowledge & Close
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
