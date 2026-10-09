import React, { useEffect, useState } from 'react';
import { 
  Bell, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  Building,
  Check,
  CheckCheck,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';
import { Alert } from '../types';

interface AlertsPageProps {
  onNavigateToAnimal?: (animalId: string) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({ onNavigateToAnimal }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAlerts(statusFilter);
      setAlerts(res);
    } catch (err: any) {
      console.error('Failed to load alerts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [statusFilter]);

  const handleAcknowledge = async (id: string, animalCode?: string) => {
    try {
      await api.acknowledgeAlert(id);
      setActionSuccess(`Alert for ${animalCode || 'animal'} acknowledged.`);
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchAlerts();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const handleResolve = async (id: string, animalCode?: string) => {
    try {
      await api.resolveAlert(id);
      setActionSuccess(`Alert for ${animalCode || 'animal'} marked resolved.`);
      setTimeout(() => setActionSuccess(null), 3000);
      await fetchAlerts();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA]">CRITICAL</span>;
      case 'HIGH':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FFEDD5] text-[#C2410C] border border-[#FED7AA]">HIGH RISK</span>;
      case 'MODERATE':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF9C3] text-[#854D0E] border border-[#FEF08A]">MODERATE</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EAF7F0] text-[#16845B] border border-[#C4EBD5]">LOW</span>;
    }
  };

  const filterTabs = [
    { id: 'ALL', label: 'All Alerts' },
    { id: 'OPEN', label: 'Open (Action Required)' },
    { id: 'ACKNOWLEDGED', label: 'Acknowledged' },
    { id: 'RESOLVED', label: 'Resolved' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="card-surface p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">Early Warning Health Alerts</h2>
            <span className="text-xs font-semibold bg-[#FEE2E2] text-[#B91C1C] border border-[#FECACA] px-2.5 py-0.5 rounded-full">
              {alerts.filter(a => a.status === 'OPEN').length} Open
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#667085] mt-1 max-w-2xl font-medium">
            Automated alerts dispatched when biometric deviation thresholds indicate acute illness or severe herd risk.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {filterTabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-[#16845B] text-white shadow-xs'
                  : 'bg-[#F7F9FC] text-[#667085] hover:text-[#172033] hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 shadow-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Alerts Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <RefreshCw className="w-8 h-8 text-[#16845B] animate-spin" />
          <p className="text-xs text-[#667085]">Loading alert telemetry from Supabase...</p>
        </div>
      ) : alerts.length === 0 ? (
        <div className="card-surface p-12 text-center max-w-md mx-auto shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-[#16845B] mx-auto mb-3" />
          <h3 className="font-bold text-base text-[#172033]">All Clear — No Alerts</h3>
          <p className="text-xs text-[#667085] mt-1">
            No health alerts currently match your filter settings.
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="card-surface card-interactive p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2.5 py-1 rounded-md">
                    {alert.animal_id}
                  </span>
                  {getSeverityBadge(alert.severity)}
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    alert.status === 'OPEN' ? 'bg-red-50 text-red-700 border border-red-200' :
                    alert.status === 'ACKNOWLEDGED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    'bg-slate-100 text-slate-700'
                  }`}>
                    {alert.status}
                  </span>
                  <span className="text-xs text-[#667085] flex items-center gap-1 ml-auto sm:ml-0">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(alert.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </span>
                </div>

                <h3 className="font-bold text-sm text-[#172033]">{alert.title}</h3>
                <p className="text-xs text-[#667085] leading-relaxed">{alert.message}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-start md:self-auto">
                {onNavigateToAnimal && alert.animal_id && (
                  <button
                    onClick={() => onNavigateToAnimal(alert.animal_id)}
                    className="px-3 py-1.5 bg-[#F7F9FC] hover:bg-slate-100 border border-[#E5EAF0] text-[#172033] text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                  >
                    <span>Animal Profile</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                )}

                {alert.status === 'OPEN' && (
                  <button
                    onClick={() => handleAcknowledge(alert.id, alert.animal_id)}
                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Acknowledge</span>
                  </button>
                )}

                {alert.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolve(alert.id, alert.animal_id)}
                    className="px-3.5 py-1.5 bg-[#16845B] hover:bg-[#126b49] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                    <span>Resolve</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
