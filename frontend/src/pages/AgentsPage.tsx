import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  Activity, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Sparkles,
  Layers,
  BookOpen,
  FileText,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { AgentRun } from '../types';

export const AgentsPage: React.FC = () => {
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgentRuns = async () => {
    try {
      setLoading(true);
      const res = await api.getAgentActivity();
      setAgentRuns(res);
    } catch (err: any) {
      console.error('Failed to load agent activities:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgentRuns();
  }, []);

  const agentDefinitions = [
    { name: 'Orchestrator Agent', role: 'Workflow Coordinator', description: 'Dispatches sub-agents in parallel, handles fallbacks, and aggregates multi-modal risk assessments.' },
    { name: 'Sensor Agent', role: 'Physiological Telemetry', description: 'Ingests body temperature and collar sensors; computes deviations against species baseline.' },
    { name: 'Behavior Agent', role: 'Ethological Baseline', description: 'Analyzes feed intake duration and activity indices; detects lethargy and social isolation.' },
    { name: 'Vision Agent', role: 'Visual Demeanor CV', description: 'Inspects photos for depressed posture, ear droop, and abnormal discharge with confidence scoring.' },
    { name: 'Risk Agent', role: 'Explainable Risk Scoring', description: 'Synthesizes weighted evidence into transparent 0–100 health-risk scores and severity levels.' },
    { name: 'Knowledge Agent', role: 'Veterinary RAG Literature', description: 'Queries Supabase veterinary literature store for peer-reviewed clinical guidelines matching symptoms.' },
    { name: 'Report Agent', role: 'Clinical Decision Support', description: 'Generates structured clinical summaries and action steps with veterinary safety disclaimers.' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-[#E5EAF0] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-[#172033] tracking-tight">Multi-Agent Intelligence Swarm</h2>
            <span className="text-xs font-semibold bg-[#EAF7F0] text-[#16845B] border border-[#C4EBD5] px-2.5 py-0.5 rounded-full">
              7 Active Sub-Agents
            </span>
          </div>
          <p className="text-xs text-[#667085] mt-1 max-w-2xl">
            Autonomous multi-agent execution architecture providing real-time livestock health screening, literature grounding, and clinical explanation.
          </p>
        </div>

        <button
          onClick={fetchAgentRuns}
          className="px-3.5 py-2 bg-white border border-[#E5EAF0] hover:bg-slate-50 text-[#172033] text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs self-start md:self-auto"
        >
          <RefreshCw className="w-4 h-4 text-[#16845B]" />
          <span>Refresh Activity</span>
        </button>
      </div>

      {/* Agent Roster Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agentDefinitions.map((agent, i) => (
          <div key={i} className="bg-white border border-[#E5EAF0] rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-[#172033]">{agent.name}</span>
              <span className="text-[10px] font-semibold bg-[#EAF7F0] text-[#16845B] px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-xs font-medium text-[#16845B]">{agent.role}</p>
            <p className="text-xs text-[#667085] leading-relaxed">{agent.description}</p>
          </div>
        ))}
      </div>

      {/* Recent Agent Execution Runs Table */}
      <div className="bg-white border border-[#E5EAF0] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-[#16845B]" />
            <h3 className="font-bold text-sm text-[#172033]">Recent Execution History</h3>
          </div>
          <span className="text-xs text-[#667085]">{agentRuns.length} Recorded Runs</span>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 text-[#16845B] animate-spin" />
            <p className="text-xs text-[#667085]">Retrieving agent run records...</p>
          </div>
        ) : agentRuns.length === 0 ? (
          <div className="p-8 text-center bg-[#F7F9FC] rounded-xl text-xs text-[#667085]">
            No recent agent executions recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F9FC] text-[#667085] border-b border-[#E5EAF0]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Agent Name</th>
                  <th className="py-3 px-4 font-semibold">Animal Target</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Latency</th>
                  <th className="py-3 px-4 font-semibold">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF0] text-[#172033]">
                {agentRuns.slice(0, 15).map((run) => (
                  <tr key={run.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-[#172033] flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16845B]" />
                      {run.agent_name}
                    </td>
                    <td className="py-3 px-4 font-mono">{run.animal_code || 'Herd Telemetry'}</td>
                    <td className="py-3 px-4">
                      <span className="bg-[#EAF7F0] text-[#16845B] px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {run.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{run.execution_time_ms} ms</td>
                    <td className="py-3 px-4 text-[#667085]">
                      {new Date(run.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
