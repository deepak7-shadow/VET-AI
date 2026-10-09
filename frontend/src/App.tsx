import React, { useState, useCallback, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { Sidebar } from './layouts/Sidebar';
import { Navbar } from './layouts/Navbar';
import { Dashboard } from './pages/Dashboard';
import { AnimalsList } from './pages/AnimalsList';
import { AnimalProfile } from './pages/AnimalProfile';
import { AIAnalysis } from './pages/AIAnalysis';
import { AgentsPage } from './pages/AgentsPage';
import { AlertsPage } from './pages/AlertsPage';
import { ReportsPage } from './pages/ReportsPage';
import { AuthModal } from './components/auth/AuthModals';

// ─────────────────────────────────────────────────────────────────────────────
// Error Boundary to prevent any blank screen crashes
// ─────────────────────────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error('UI Error caught by boundary:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-[#F7F9FC] p-6">
          <div className="bg-white border border-[#E5EAF0] rounded-2xl p-8 max-w-md w-full shadow-lg text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h2 className="text-lg font-bold text-[#172033]">Application Recovery</h2>
            <p className="text-xs text-[#667085] leading-relaxed">
              {this.state.error?.message || 'An unexpected rendering error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-4 py-2 bg-[#16845B] hover:bg-[#126b49] text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Inline Settings Page
// ─────────────────────────────────────────────────────────────────────────────
const SettingsPage: React.FC = () => (
  <div className="p-6 max-w-4xl mx-auto space-y-6">
    <div>
      <h2 className="text-lg font-bold text-[#172033]">System Architecture & Settings</h2>
      <p className="text-sm text-[#667085] mt-0.5">VET-AI multi-agent system configuration</p>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[
        { label: 'Backend', value: 'FastAPI + Python 3.11', icon: '⚡', status: 'Running on :8000' },
        { label: 'Database', value: 'Supabase PostgreSQL', icon: '🗄️', status: 'mlmilvhgicvxjarfgpyj' },
        { label: 'AI Engine', value: 'Gemini 2.0 Flash', icon: '🤖', status: 'google-genai SDK' },
        { label: 'Frontend', value: 'React 19 + Vite 8', icon: '⚛️', status: 'Running on :5173' },
        { label: 'Multi-Agent', value: '6 Specialist Agents', icon: '🧠', status: 'Orchestrator Pattern' },
        { label: 'RAG System', value: 'Supabase knowledge_documents', icon: '📚', status: 'Full-text retrieval' },
        { label: 'Computer Vision', value: 'Gemini Vision API', icon: '👁️', status: 'Image analysis + fallback' },
        { label: 'Risk Engine', value: 'Weighted multi-modal scoring', icon: '⚖️', status: '0-100 explainable score' },
      ].map(item => (
        <div key={item.label} className="card-surface rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{item.icon}</span>
            <div>
              <div className="font-bold text-sm text-[#172033]">{item.label}</div>
              <div className="text-xs text-[#667085]">{item.value}</div>
            </div>
          </div>
          <div className="text-[11px] font-mono text-[#16845B] bg-[#EAF7F0] border border-[#C4EBD5] rounded px-2 py-1">{item.status}</div>
        </div>
      ))}
    </div>
    <div className="card-surface rounded-2xl p-5">
      <h3 className="font-bold text-[#172033] mb-3">Supabase Schema Tables</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {['animals', 'health_observations', 'image_analysis', 'risk_assessments', 'alerts', 'reports', 'agent_runs', 'knowledge_documents'].map(t => (
          <div key={t} className="text-xs font-mono bg-[#F7F9FC] border border-[#E5EAF0] rounded-lg px-3 py-2 text-[#172033]">
            {t}
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Root App Shell
// ─────────────────────────────────────────────────────────────────────────────
type Tab = 'dashboard' | 'animals' | 'analysis' | 'agents' | 'alerts' | 'reports' | 'settings';

function AppShell() {
  const [currentTab, setCurrentTab] = useState<Tab>('dashboard');
  const [selectedAnimalId, setSelectedAnimalId] = useState<string | null>(null);
  const [analysisAnimalId, setAnalysisAnimalId] = useState<string | undefined>(undefined);
  const [openAlertsCount, setOpenAlertsCount] = useState(0);
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Poll open alert count every 15s for sidebar badge
  useEffect(() => {
    const fetchAlertCount = async () => {
      try {
        const res = await fetch('/api/alerts?status=OPEN');
        if (res.ok) {
          const data = await res.json();
          setOpenAlertsCount(Array.isArray(data) ? data.length : 0);
        }
      } catch { /* ignore */ }
    };
    fetchAlertCount();
    const interval = setInterval(fetchAlertCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const navigateToAnimal = useCallback((id: string) => {
    setSelectedAnimalId(id);
    setCurrentTab('animals');
  }, []);

  const navigateToAnalysis = useCallback((animalId?: string) => {
    if (animalId) setAnalysisAnimalId(animalId);
    setCurrentTab('analysis');
  }, []);

  const navigateToAgents = useCallback(() => {
    setCurrentTab('agents');
  }, []);

  const handleSimulationSuccess = useCallback((result: any) => {
    setSimulationResult(result);
    setCurrentTab('analysis');
    setAnalysisAnimalId('COW-027');
  }, []);

  const handleResetSuccess = useCallback(() => {
    setSimulationResult(null);
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setCurrentTab(tab as Tab);
    if (tab !== 'animals') setSelectedAnimalId(null);
    setMobileMenuOpen(false);
  }, []);

  const renderPage = () => {
    if (currentTab === 'animals' && selectedAnimalId) {
      return (
        <AnimalProfile
          animalId={selectedAnimalId}
          onBack={() => setSelectedAnimalId(null)}
          onAnalyzeAnimal={(id) => navigateToAnalysis(id)}
          onSimulationSuccess={(res) => {
            setSimulationResult(res);
            setCurrentTab('analysis');
            setAnalysisAnimalId('COW-027');
          }}
        />
      );
    }

    switch (currentTab) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigateToAnimal={navigateToAnimal}
            onNavigateToAnalysis={navigateToAnalysis}
            onNavigateToAgents={navigateToAgents}
          />
        );
      case 'animals':
        return (
          <AnimalsList
            onSelectAnimal={(id) => setSelectedAnimalId(id)}
            onAnalyzeAnimal={(id) => navigateToAnalysis(id)}
          />
        );

      case 'analysis':
        return (
          <AIAnalysis
            initialAnimalId={analysisAnimalId || 'COW-027'}
            onAnalysisComplete={(res) => {
              setSimulationResult(res);
              setOpenAlertsCount(prev => res.alert ? prev + 1 : prev);
            }}
          />
        );
      case 'agents':
        return <AgentsPage />;
      case 'alerts':
        return <AlertsPage onNavigateToAnimal={navigateToAnimal} />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F9FC] bg-topo-pattern">
      {/* Sidebar */}
      <Sidebar
        currentTab={selectedAnimalId ? 'animals' : currentTab}
        setCurrentTab={handleTabChange}
        openAlertsCount={openAlertsCount}
        mobileOpen={mobileMenuOpen}
        setMobileOpen={setMobileMenuOpen}
      />

      {/* Main Content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          currentTab={selectedAnimalId ? 'animals' : currentTab}
          setCurrentTab={handleTabChange}
          onOpenAuth={() => setAuthModalOpen(true)}
          onToggleMobileMenu={() => setMobileMenuOpen(prev => !prev)}
        />

        {/* Simulation Result Toast */}
        {simulationResult && currentTab !== 'analysis' && (
          <div className="mx-6 mt-3 bg-[#FEE2E2] border border-[#FECACA] text-[#B91C1C] text-xs rounded-xl px-4 py-3 flex items-center justify-between">
            <span>
              🔴 Simulation complete — COW-027 Risk:{' '}
              <strong>{simulationResult?.analysis_result?.risk?.risk_score ?? simulationResult?.risk?.risk_score ?? '?'}/100</strong>{' '}
              ({simulationResult?.analysis_result?.risk?.risk_level ?? simulationResult?.risk?.risk_level ?? 'HIGH'})
            </span>
            <button
              onClick={() => setSimulationResult(null)}
              className="ml-4 text-[#B91C1C] hover:text-red-800 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scrollable Page Area */}
        <main className="flex-1 overflow-y-auto">
          {renderPage()}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </ErrorBoundary>
  );
}
