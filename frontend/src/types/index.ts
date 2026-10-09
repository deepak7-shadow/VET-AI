export interface Animal {
  id: string;
  animal_id: string;
  species: string;
  breed: string;
  age: number;
  gender: string;
  farm: string;
  image_url: string;
  status: 'Healthy' | 'Monitoring' | 'High Risk';
  current_risk_score: number;
  current_risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  herd_group?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface HealthObservation {
  id: string;
  animal_id: string;
  temperature: number;
  feeding_percentage: number;
  activity_percentage: number;
  behavior_notes?: string;
  observation_source: string;
  created_at: string;
}

export interface ImageObservation {
  indicator: string;
  finding: string;
  status: string;
}

export interface ImageAnalysis {
  id: string;
  animal_id: string;
  image_url: string;
  observations: ImageObservation[];
  risk_indicators: string[];
  confidence: number;
  model_name: string;
  created_at: string;
}

export interface RiskFactor {
  name: string;
  weight: string;
  numeric_weight: number;
  detail: string;
  evidence_type: string;
}

export interface RiskAssessment {
  id: string;
  animal_id: string;
  risk_score: number;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  confidence: number;
  factors: RiskFactor[];
  evidence: {
    temperature?: number;
    baseline_temperature?: number;
    temperature_deviation?: number;
    feeding_change?: number;
    activity_change?: number;
    visual_anomalies_count?: number;
    summary?: string;
  };
  created_at: string;
}

export interface Alert {
  id: string;
  animal_id: string;
  animal_id_code?: string;
  species?: string;
  breed?: string;
  farm?: string;
  severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  title: string;
  message: string;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED';
  created_at: string;
  acknowledged_at?: string;
}

export interface Report {
  id: string;
  animal_id: string;
  animal_id_code?: string;
  species?: string;
  breed?: string;
  farm?: string;
  image_url?: string;
  summary: string;
  recommendations: string;
  evidence: any;
  risk_score: number;
  risk_level: string;
  report_content: string;
  created_at: string;
}

export interface AgentRun {
  id: string;
  animal_id: string;
  animal_code?: string;
  species?: string;
  agent_name: string;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'WARNING';
  input_data: any;
  output_data: any;
  execution_time_ms: number;
  created_at: string;
}

export interface DashboardStats {
  total_animals: number;
  healthy_count: number;
  monitoring_count: number;
  high_risk_count: number;
  avg_risk_score: number;
  open_alerts: number;
  critical_count?: number;
  high_count?: number;
  moderate_count?: number;
  low_count?: number;
  healthy_percentage?: number;
  distribution: {
    low: number;
    moderate: number;
    high: number;
    critical: number;
  };
}

export interface DashboardData {
  stats: DashboardStats;
  trends: Array<{
    date_label: string;
    avg_temperature: number;
    avg_feeding: number;
    avg_activity: number;
    reading_count: number;
  }>;
  recent_alerts: Alert[];
  recent_agents: AgentRun[];
}

export interface MultiAgentAnalysisResult {
  animal: Animal;
  risk: {
    risk_score: number;
    risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    confidence: number;
    factors: RiskFactor[];
    evidence: any;
  };
  sensor: {
    temperature: number;
    baseline_temperature: number;
    temperature_deviation: number;
    feeding_change: number;
    activity_change: number;
    status_flag: string;
  };
  behavior: {
    baseline_feeding: number;
    current_feeding: number;
    feeding_change: number;
    baseline_activity: number;
    current_activity: number;
    activity_change: number;
    behavior_indicators: string[];
    summary: string;
  };
  vision: {
    observations: ImageObservation[];
    risk_indicators: string[];
    confidence: number;
    summary: string;
    inference_type?: string;
  };
  knowledge: {
    query_terms: string[];
    retrieved_documents: Array<{
      id: string;
      document: string;
      source: string;
      category: string;
      relevant_information: string;
      relevance: number;
    }>;
    match_count: number;
    summary: string;
  };
  report: {
    report_id: string;
    summary: string;
    recommendations: string;
    report_content: string;
    disclaimer: string;
  };
  alert?: Alert;
  orchestrator: {
    workflow_status: string;
    agents_executed: string[];
    risk_score: number;
    risk_level: string;
    alert_created: boolean;
    total_execution_time_ms: number;
  };
}

export type RiskCategory = 'LOW RISK' | 'NEEDS MORE INFORMATION' | 'MEDIUM RISK' | 'HIGH RISK' | 'CRITICAL CONCERN';

export interface ScreeningRun {
  id: string;
  run_name: string;
  herd_group?: string;
  species?: string;
  total_animals: number;
  screened_animals?: number;
  failed_animals?: number;
  low_risk_count: number;
  needs_info_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  critical_count: number;
  status: 'PENDING' | 'PROCESSING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  summary_metrics: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export interface ScreeningRunAnimal {
  id: string;
  run_id: string;
  animal_id: string;
  risk_category: RiskCategory;
  risk_score: number;
  confidence: number;
  observed_findings: string[];
  missing_information: string[];
  feeding_status?: string;
  appearance_status?: string;
  sensor_status?: string;
  recommended_actions: string[];
  requires_follow_up: boolean;
  questionnaire_completed: boolean;
  notes?: string;
  created_at: string;
  animal?: Animal;
}

export interface FeedingObservationPayload {
  animal_id: string;
  screening_animal_id?: string;
  run_id?: string;
  intake_level: 'NORMAL' | 'SLIGHT_REDUCTION' | 'MODERATE_REDUCTION' | 'SEVERE_REDUCTION' | 'NONE';
  appetite_trend: 'INCREASING' | 'STEADY' | 'DECLINING' | 'RAPID_DROP';
  water_consumption: 'NORMAL' | 'REDUCED' | 'ELEVATED' | 'ABSENT';
  chewing_cud_rate?: 'NORMAL' | 'REDUCED' | 'ABSENT';
  feed_type?: string;
  notes?: string;
}

export interface FeedingAssessment {
  id: string;
  animal_id: string;
  run_id?: string;
  status: string;
  baseline_intake_kg?: number;
  current_intake_level: string;
  deviation_percentage?: number;
  feeding_behavior_flag: string;
  veterinary_rationale: string;
  immediate_recommendation: string;
  created_at: string;
}

export interface HerdSummaryReport {
  id: string;
  run_id: string;
  total_screened: number;
  low_risk_count: number;
  needs_info_count: number;
  medium_risk_count: number;
  high_risk_count: number;
  critical_count: number;
  executive_summary: string;
  herd_level_findings: string[];
  recommended_immediate_interventions: string[];
  feeding_and_nutrition_advisories: string[];
  environmental_biosecurity_actions: string[];
  created_at: string;
}

