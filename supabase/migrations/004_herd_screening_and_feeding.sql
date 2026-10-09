-- VET-AI: Multi-Agent Herd Health Screening and Feeding Intelligence
-- Migration 004: Herd screening runs, screening run animals, feeding observations, feeding assessments, and herd summaries

-- 1. Extend animals table with herd group and notes if not present
ALTER TABLE animals ADD COLUMN IF NOT EXISTS herd_group TEXT DEFAULT 'General';
ALTER TABLE animals ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. screening_runs table
CREATE TABLE IF NOT EXISTS screening_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farm TEXT NOT NULL DEFAULT 'General Herd',
    species_filter TEXT DEFAULT 'ALL',
    user_id UUID,
    status TEXT DEFAULT 'IN_PROGRESS', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED'
    total_animals INT DEFAULT 0,
    screened_animals INT DEFAULT 0,
    failed_animals INT DEFAULT 0,
    needs_info_count INT DEFAULT 0,
    low_risk_count INT DEFAULT 0,
    medium_risk_count INT DEFAULT 0,
    high_risk_count INT DEFAULT 0,
    critical_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. screening_run_animals table (per-animal tracking within a screening run)
CREATE TABLE IF NOT EXISTS screening_run_animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES screening_runs(id) ON DELETE CASCADE,
    animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
    animal_code TEXT NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    farm TEXT,
    status TEXT DEFAULT 'PENDING', -- 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'NEEDS_MORE_INFO'
    initial_category TEXT DEFAULT 'NEEDS MORE INFORMATION', -- 'LOW RISK', 'NEEDS MORE INFORMATION', 'MEDIUM RISK', 'HIGH RISK', 'CRITICAL CONCERN'
    final_category TEXT,
    initial_risk_score NUMERIC DEFAULT 0,
    final_risk_score NUMERIC,
    observed_findings JSONB DEFAULT '[]'::jsonb,
    missing_information JSONB DEFAULT '[]'::jsonb,
    feeding_status TEXT DEFAULT 'NOT_REQUESTED', -- 'NOT_REQUESTED', 'REQUESTED', 'SUBMITTED', 'ANALYZED'
    recommended_next_step TEXT DEFAULT 'Awaiting preliminary screening',
    error_message TEXT,
    assessment_id UUID,
    report_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_run_animal UNIQUE(run_id, animal_id)
);

-- 4. feeding_observations table (farmer-submitted feeding telemetry)
CREATE TABLE IF NOT EXISTS feeding_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
    run_id UUID REFERENCES screening_runs(id) ON DELETE SET NULL,
    user_id UUID,
    observation_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    usual_routine TEXT DEFAULT 'Twice daily pasture and silage',
    estimated_intake_percent NUMERIC DEFAULT 100,
    appetite_change TEXT DEFAULT 'NORMAL', -- 'NORMAL', 'SLIGHT_DECREASE', 'MODERATE_DECREASE', 'REFUSING_FOOD', 'INCREASED', 'UNKNOWN'
    missed_sessions INT DEFAULT 0,
    feed_type TEXT DEFAULT 'Mixed ration',
    recent_feed_change TEXT DEFAULT 'No recent change',
    water_consumption TEXT DEFAULT 'NORMAL', -- 'NORMAL', 'INCREASED', 'DECREASED', 'NOT_OBSERVED'
    onset_timing TEXT DEFAULT 'TODAY', -- 'TODAY', 'PAST_24H', 'PAST_48H', 'OVER_3_DAYS', 'UNKNOWN'
    behavior_notes TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. feeding_assessments table (Feeding Intelligence Agent evaluations)
CREATE TABLE IF NOT EXISTS feeding_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
    run_id UUID REFERENCES screening_runs(id) ON DELETE SET NULL,
    observation_id UUID REFERENCES feeding_observations(id) ON DELETE SET NULL,
    feeding_status TEXT NOT NULL DEFAULT 'INSUFFICIENT_DATA', -- 'NORMAL_PATTERN_REPORTED', 'POSSIBLE_REDUCED_INTAKE', 'POSSIBLE_INCREASED_INTAKE', 'UNUSUAL_FEEDING_PATTERN', 'INSUFFICIENT_DATA', 'BASELINE_NOT_ESTABLISHED'
    baseline_available BOOLEAN DEFAULT false,
    baseline_source TEXT DEFAULT 'none',
    comparison JSONB DEFAULT '{}'::jsonb,
    evidence JSONB DEFAULT '[]'::jsonb,
    confidence TEXT DEFAULT 'moderate', -- 'low', 'moderate', 'high'
    limitations JSONB DEFAULT '[]'::jsonb,
    recommended_next_step TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. herd_summary_reports table
CREATE TABLE IF NOT EXISTS herd_summary_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES screening_runs(id) ON DELETE CASCADE UNIQUE,
    farm TEXT NOT NULL DEFAULT 'General Herd',
    summary_content JSONB DEFAULT '{}'::jsonb,
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performant queries
CREATE INDEX IF NOT EXISTS idx_screening_runs_created ON screening_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_screening_run_animals_run ON screening_run_animals(run_id);
CREATE INDEX IF NOT EXISTS idx_screening_run_animals_animal ON screening_run_animals(animal_id);
CREATE INDEX IF NOT EXISTS idx_feeding_obs_animal ON feeding_observations(animal_id);
CREATE INDEX IF NOT EXISTS idx_feeding_assess_animal ON feeding_assessments(animal_id);
CREATE INDEX IF NOT EXISTS idx_animals_herd_group ON animals(herd_group);
