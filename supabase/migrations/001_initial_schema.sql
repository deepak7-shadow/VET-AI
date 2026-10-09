-- VET-AI: Multi-Agent Livestock Health Intelligence
-- Migration 001: Initial Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop existing tables if they exist (clean slate)
DROP TABLE IF EXISTS agent_runs CASCADE;
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS risk_assessments CASCADE;
DROP TABLE IF EXISTS image_analysis CASCADE;
DROP TABLE IF EXISTS health_observations CASCADE;
DROP TABLE IF EXISTS knowledge_documents CASCADE;
DROP TABLE IF EXISTS animals CASCADE;

-- 1. animals table
CREATE TABLE animals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id TEXT UNIQUE NOT NULL,
    species TEXT NOT NULL,
    breed TEXT,
    age NUMERIC,
    gender TEXT,
    farm TEXT,
    image_url TEXT,
    status TEXT DEFAULT 'Healthy',
    current_risk_score NUMERIC DEFAULT 0,
    current_risk_level TEXT DEFAULT 'LOW',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying animals
CREATE INDEX idx_animals_animal_id ON animals(animal_id);
CREATE INDEX idx_animals_status ON animals(status);
CREATE INDEX idx_animals_risk_level ON animals(current_risk_level);
CREATE INDEX idx_animals_species ON animals(species);

-- 2. health_observations table
CREATE TABLE health_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
    temperature NUMERIC,
    feeding_percentage NUMERIC,
    activity_percentage NUMERIC,
    behavior_notes TEXT,
    observation_source TEXT DEFAULT 'IoT Collar Sensor',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_observations_animal_id ON health_observations(animal_id);
CREATE INDEX idx_observations_created_at ON health_observations(created_at DESC);

-- 3. image_analysis table
CREATE TABLE image_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
    image_url TEXT,
    observations JSONB DEFAULT '[]'::jsonb,
    risk_indicators JSONB DEFAULT '[]'::jsonb,
    confidence NUMERIC DEFAULT 0.0,
    model_name TEXT DEFAULT 'VET-Vision Agent (Gemini Flash Vision)',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_image_analysis_animal_id ON image_analysis(animal_id);
CREATE INDEX idx_image_analysis_created_at ON image_analysis(created_at DESC);

-- 4. risk_assessments table
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
    risk_score NUMERIC NOT NULL,
    risk_level TEXT NOT NULL,
    confidence NUMERIC DEFAULT 0.85,
    factors JSONB DEFAULT '[]'::jsonb,
    evidence JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_risk_assessments_animal_id ON risk_assessments(animal_id);
CREATE INDEX idx_risk_assessments_created_at ON risk_assessments(created_at DESC);

-- 5. alerts table
CREATE TABLE alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
    severity TEXT NOT NULL, -- 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'OPEN', -- 'OPEN', 'ACKNOWLEDGED', 'RESOLVED'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ
);

CREATE INDEX idx_alerts_animal_id ON alerts(animal_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_alerts_severity ON alerts(severity);
CREATE INDEX idx_alerts_created_at ON alerts(created_at DESC);

-- 6. reports table
CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
    summary TEXT,
    recommendations TEXT,
    evidence JSONB DEFAULT '{}'::jsonb,
    risk_score NUMERIC,
    risk_level TEXT,
    report_content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_animal_id ON reports(animal_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);

-- 7. agent_runs table
CREATE TABLE agent_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    animal_id UUID REFERENCES animals(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    status TEXT NOT NULL, -- 'RUNNING', 'COMPLETED', 'FAILED', 'WARNING'
    input_data JSONB DEFAULT '{}'::jsonb,
    output_data JSONB DEFAULT '{}'::jsonb,
    execution_time_ms NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agent_runs_animal_id ON agent_runs(animal_id);
CREATE INDEX idx_agent_runs_created_at ON agent_runs(created_at DESC);
CREATE INDEX idx_agent_runs_agent_name ON agent_runs(agent_name);

-- 8. knowledge_documents table
CREATE TABLE knowledge_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    source TEXT NOT NULL,
    category TEXT NOT NULL,
    embedding JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_knowledge_category ON knowledge_documents(category);

-- Trigger to update updated_at on animals
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_animals_updated_at
BEFORE UPDATE ON animals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

-- Allow public/anon read and write access for development & hackathon demo
CREATE POLICY "Public full access to animals" ON animals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to health_observations" ON health_observations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to image_analysis" ON image_analysis FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to risk_assessments" ON risk_assessments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to alerts" ON alerts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to reports" ON reports FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to agent_runs" ON agent_runs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public full access to knowledge_documents" ON knowledge_documents FOR ALL USING (true) WITH CHECK (true);

-- Create livestock-images storage bucket if storage schema exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        INSERT INTO storage.buckets (id, name, public)
        VALUES ('livestock-images', 'livestock-images', true)
        ON CONFLICT (id) DO NOTHING;

        -- Allow public storage access
        INSERT INTO storage.policies (name, bucket_id, definition)
        SELECT 'Public Access', 'livestock-images', 'true'
        WHERE NOT EXISTS (
            SELECT 1 FROM storage.policies WHERE bucket_id = 'livestock-images' AND name = 'Public Access'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL; -- Ignore storage policy error if permissions restricted
END $$;
