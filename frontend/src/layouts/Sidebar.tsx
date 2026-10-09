import React from 'react';
import { 
  LayoutDashboard, 
  Layers, 
  Sparkles, 
  Bell, 
  FileText, 
  Cpu, 
  Settings, 
  ShieldCheck,
  Activity,
  X,
  Stethoscope
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAlertsCount: number;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  setCurrentTab, 
  openAlertsCount,
  mobileOpen = false,
  setMobileOpen
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'animals', label: 'Livestock Registry', icon: Layers },
    { id: 'analysis', label: 'AI Health Screening', icon: Sparkles },
    { id: 'agents', label: 'Agent Intelligence', icon: Cpu },
    { id: 'alerts', label: 'Clinical Alerts', icon: Bell, badge: openAlertsCount },
    { id: 'reports', label: 'Veterinary Reports', icon: FileText },
    { id: 'settings', label: 'System Settings', icon: Settings },
  ];

  const handleSelect = (tabId: string) => {
    setCurrentTab(tabId);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        className={`fixed lg:static top-0 bottom-0 left-0 z-50 w-64 bg-white/95 backdrop-blur-md border-r border-[#E5EAF0] flex flex-col justify-between shrink-0 select-none transition-transform duration-200 ease-in-out ${
          mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-5 border-b border-[#E5EAF0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#16845B] to-[#0F5C3E] flex items-center justify-center shadow-md shadow-emerald-900/15">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg tracking-tight text-[#172033]">VET-AI</span>
                  <span className="text-[10px] font-bold bg-[#EAF7F0] text-[#16845B] border border-[#C4EBD5] px-2 py-0.5 rounded-full">
                    SaaS
                  </span>
                </div>
                <p className="text-[11px] text-[#667085] font-medium tracking-tight">Multi-Agent Intelligence</p>
              </div>
            </div>

            {/* Mobile Close Button */}
            {setMobileOpen && (
              <button 
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg lg:hidden transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#EAF7F0] text-[#16845B] shadow-xs border border-[#C4EBD5]/60'
                      : 'text-[#667085] hover:text-[#172033] hover:bg-[#F7F9FC]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-[#16845B]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Multi-Agent Footnote & Protocol Card */}
        <div className="p-4 border-t border-[#E5EAF0] bg-[#F7F9FC]/80">
          <div className="card-surface p-3.5 rounded-xl border border-[#E5EAF0] shadow-xs">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#16845B] animate-pulse" />
                <span className="text-[11px] font-bold text-[#172033] uppercase tracking-wider">6 AI Agents</span>
              </div>
              <span className="text-[10px] font-semibold text-[#16845B] bg-[#EAF7F0] px-1.5 py-0.5 rounded-md">
                Active
              </span>
            </div>
            <p className="text-[10px] text-[#667085] leading-relaxed">
              Sensors • Vision • Behavior • Risk • RAG Docs • CDSS Support
            </p>
          </div>

          <div className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] text-[#667085]">
            <ShieldCheck className="w-3.5 h-3.5 text-[#16845B]" />
            <span>Clinical Decision Support Platform</span>
          </div>
        </div>
      </aside>
    </>
  );
};
