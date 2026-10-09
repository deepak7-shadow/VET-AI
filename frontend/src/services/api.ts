import { 
  Animal, 
  DashboardData, 
  Alert, 
  Report, 
  AgentRun, 
  MultiAgentAnalysisResult,
  ScreeningRun,
  ScreeningRunAnimal,
  FeedingObservationPayload,
  FeedingAssessment,
  HerdSummaryReport
} from '../types';
import { supabase } from '../lib/supabase';

const API_BASE = '/api';

async function getAuthHeaders(): Promise<HeadersInit> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.warn('Could not read auth session for API call', err);
  }
  return headers;
}

export const api = {
  // Health check
  async checkHealth(): Promise<{ status: string; service: string }> {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return res.json();
  },

  // Dashboard
  async getDashboardData(): Promise<DashboardData> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/dashboard/stats`, { headers });
    if (!res.ok) throw new Error('Failed to fetch dashboard statistics');
    return res.json();
  },

  // Animals
  async getAnimals(species?: string, status?: string): Promise<Animal[]> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (species && species !== 'ALL') params.append('species', species);
    if (status && status !== 'ALL') params.append('status', status);
    const res = await fetch(`${API_BASE}/animals?${params.toString()}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch animals');
    return res.json();
  },

  async getAnimal(id: string): Promise<Animal> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/animals/${id}`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch animal ${id}`);
    return res.json();
  },

  async createAnimal(payload: Partial<Animal>): Promise<Animal> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/animals`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to register livestock');
    }
    return res.json();
  },

  async bulkCreateAnimals(animals: Array<Partial<Animal>>): Promise<{ created_count: number; animals: Animal[] }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/animals/bulk`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ animals })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to bulk register livestock');
    }
    return res.json();
  },

  async getAnimalHistory(id: string): Promise<any> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/animals/${id}/history`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch history for animal ${id}`);
    return res.json();
  },

  // Multi-Agent Analysis
  async runFullAnalysis(payload: {
    animal_id: string;
    temperature: number;
    feeding_percentage: number;
    activity_percentage: number;
    behavior_notes?: string;
    image_url?: string;
  }): Promise<MultiAgentAnalysisResult> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/agent/analyze`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Multi-agent analysis failed');
    }
    return res.json();
  },

  // YOLO26 Custom Disease Risk Classifier
  async yoloScreenImage(payload: {
    image_url: string;
    sample_type?: string;
    animal_id?: string;
    farm_id?: string;
  }): Promise<{
    model: string;
    animal_id: string;
    farm_id: string;
    sample_type: string;
    disease_risk_score: number;
    risk_tier: string;
    top_indication: string;
    top_probability: number;
    class_probabilities: Record<string, number>;
    veterinary_triage_report: {
      summary: string;
      overlap_analysis: string;
      differential_diagnoses: Array<{ condition: string; visual_probability_pct: number }>;
      recommended_confirmatory_diagnostics: string[];
      immediate_supportive_actions: string[];
    };
    status: string;
    regulatory_disclaimer: string;
  }> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/analyze/yolo-screen`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'YOLO screening analysis failed');
    }
    return res.json();
  },

  // Demo Simulation
  async simulateHealthEvent(animal_id: string = 'COW-027'): Promise<any> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/demo/simulate-health-event`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        animal_id,
        target_temperature: 40.1,
        target_feeding: 65.0,
        target_activity: 58.0,
        notes: 'Simulated acute pyrexia, dropped appetite, lethargic posture, decreased herd interaction'
      }),
    });
    if (!res.ok) throw new Error('Failed to trigger simulated health event');
    return res.json();
  },

  async resetDemo(): Promise<any> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/demo/reset`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Failed to reset demo state');
    return res.json();
  },

  // Alerts
  async getAlerts(status?: string): Promise<Alert[]> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (status && status !== 'ALL') params.append('status', status);
    const res = await fetch(`${API_BASE}/alerts?${params.toString()}`, { headers });
    if (!res.ok) throw new Error('Failed to fetch alerts');
    return res.json();
  },

  async acknowledgeAlert(alert_id: string): Promise<any> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/alerts/${alert_id}/acknowledge`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Failed to acknowledge alert');
    return res.json();
  },

  async resolveAlert(alert_id: string): Promise<any> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/alerts/${alert_id}/resolve`, {
      method: 'POST',
      headers,
    });
    if (!res.ok) throw new Error('Failed to resolve alert');
    return res.json();
  },

  // Reports
  async getReports(): Promise<Report[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/reports`, { headers });
    if (!res.ok) throw new Error('Failed to fetch reports');
    return res.json();
  },

  async getReport(report_id: string): Promise<Report> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/reports/${report_id}`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch report ${report_id}`);
    return res.json();
  },

  // Download PDF Report
  async downloadReportPdf(reportId: string, animalId: string = 'ANIMAL'): Promise<void> {
    const headers: Record<string, string> = {};
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch (e) {
      // Demo fallback
    }

    const res = await fetch(`${API_BASE}/reports/${reportId}/download`, { headers });
    if (!res.ok) {
      throw new Error(`Failed to download report PDF (HTTP ${res.status})`);
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VET-AI_Report_${animalId}_${reportId.slice(0, 8)}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Export Reports History as CSV (sanitized against formula injection)
  exportReportsCsv(reports: Report[]): void {
    if (!reports || reports.length === 0) return;

    const sanitizeCell = (text: any) => {
      let str = String(text ?? '').replace(/"/g, '""');
      // Prevent formula injection
      if (/^[=\+\-@]/.test(str)) {
        str = "'" + str;
      }
      return `"${str}"`;
    };

    const headers = ['Report ID', 'Animal ID', 'Species', 'Breed', 'Farm', 'Risk Score', 'Risk Level', 'Summary', 'Created At'];
    const rows = reports.map(r => [
      sanitizeCell(r.id),
      sanitizeCell(r.animal_id),
      sanitizeCell(r.species || 'Cattle'),
      sanitizeCell(r.breed || 'Standard'),
      sanitizeCell(r.farm || 'Green Valley'),
      sanitizeCell(r.risk_score),
      sanitizeCell(r.risk_level),
      sanitizeCell(r.summary),
      sanitizeCell(r.created_at)
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `VET-AI_Reports_Export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  // Agent Intelligence
  async getAgentActivity(animal_id?: string): Promise<AgentRun[]> {
    const headers = await getAuthHeaders();
    const url = animal_id ? `${API_BASE}/agents/${animal_id}` : `${API_BASE}/agents`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error('Failed to fetch agent activities');
    return res.json();
  },

  // Upload image
  async uploadImage(file: File): Promise<{ url: string; filename: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Image upload failed');
    return res.json();
  },

  // Herd Screening Runs
  async getScreeningRuns(): Promise<ScreeningRun[]> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/screening/runs`, { headers });
    if (!res.ok) throw new Error('Failed to fetch herd screening runs');
    return res.json();
  },

  async getScreeningRun(runId: string): Promise<ScreeningRun> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/screening/runs/${runId}`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch screening run ${runId}`);
    const data = await res.json();
    // Backend returns { run: {...}, summary: {...} }
    return (data.run || data) as ScreeningRun;
  },

  async getScreeningRunAnimals(runId: string, category?: string): Promise<ScreeningRunAnimal[]> {
    const headers = await getAuthHeaders();
    const params = new URLSearchParams();
    if (category && category !== 'ALL') {
      params.append('category', category);
    }
    const res = await fetch(`${API_BASE}/screening/runs/${runId}/animals?${params.toString()}`, { headers });
    if (!res.ok) throw new Error(`Failed to fetch animals for screening run ${runId}`);
    return res.json();
  },

  async createScreeningRun(payload: {
    run_name: string;
    herd_group?: string;
    species?: string;
    animal_ids?: string[];
  }): Promise<ScreeningRun> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/screening/runs`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    // 202 Accepted = background task started successfully
    if (!res.ok && res.status !== 202) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to start herd screening run');
    }
    const data = await res.json();
    // Backend returns { run, message, total_animals, status }
    return (data.run || data) as ScreeningRun;
  },

  // Poll a screening run until it reaches COMPLETED or FAILED status
  async pollScreeningRun(
    runId: string,
    onProgress?: (run: ScreeningRun) => void,
    maxAttempts = 60,
    intervalMs = 3000
  ): Promise<ScreeningRun> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${API_BASE}/screening/runs/${runId}`, { headers });
        if (!res.ok) continue;
        const data = await res.json();
        const run = (data.run || data) as ScreeningRun;
        if (onProgress) onProgress(run);
        if (run.status === 'COMPLETED' || run.status === 'FAILED') {
          return run;
        }
      } catch (e) {
        // transient error — keep polling
      }
    }
    throw new Error('Screening timed out waiting for completion');
  },

  async retryScreeningRun(runId: string): Promise<ScreeningRun> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/screening/runs/${runId}/retry`, {
      method: 'POST',
      headers
    });
    if (!res.ok) throw new Error('Failed to retry screening run');
    return res.json();
  },

  // Feeding Follow-Up Questionnaire
  async submitFeedingQuestionnaire(payload: FeedingObservationPayload): Promise<any> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/screening/feeding-observation`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to submit feeding questionnaire');
    }
    return res.json();
  },

  async getFeedingAssessment(animalId: string): Promise<FeedingAssessment | null> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/screening/animals/${animalId}/feeding-assessment`, { headers });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch feeding assessment');
    return res.json();
  },

  // Herd & Screening PDF Downloads
  async downloadHerdPdf(runId: string, runName?: string): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/screening/runs/${runId}/pdf`, { headers });
    if (!res.ok) throw new Error('Failed to generate herd summary PDF');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `VET-AI_Herd_Screening_${runName ? runName.replace(/\s+/g, '_') : runId}.pdf`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  async downloadScreeningAnimalPdf(screeningAnimalId: string, animalCode?: string): Promise<void> {
    const headers = await getAuthHeaders();
    const res = await fetch(`${API_BASE}/screening/run-animals/${screeningAnimalId}/pdf`, { headers });
    if (!res.ok) throw new Error('Failed to generate animal screening report PDF');
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const filename = `VET-AI_Screening_Report_${animalCode || screeningAnimalId}.pdf`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
