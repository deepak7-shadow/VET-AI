-- VET-AI: Multi-Agent Livestock Health Intelligence
-- Migration 002: Seed Data

-- 1. Insert 10 Seed Animals
INSERT INTO animals (id, animal_id, species, breed, age, gender, farm, image_url, status, current_risk_score, current_risk_level, created_at, updated_at)
VALUES
    ('a0000000-0000-0000-0000-000000000027', 'COW-027', 'Cattle', 'Holstein Friesian', 4.5, 'Female', 'Green Valley Dairy', 'https://images.unsplash.com/photo-1546445317-29f4545e9d53?auto=format&fit=crop&w=800&q=80', 'Healthy', 18, 'LOW', NOW() - INTERVAL '14 days', NOW()),
    ('a0000000-0000-0000-0000-000000000014', 'COW-014', 'Cattle', 'Jersey', 3.2, 'Female', 'Green Valley Dairy', 'https://images.unsplash.com/photo-1570042225831-d98fa7577f1e?auto=format&fit=crop&w=800&q=80', 'Healthy', 14, 'LOW', NOW() - INTERVAL '20 days', NOW()),
    ('a0000000-0000-0000-0000-000000000031', 'COW-031', 'Cattle', 'Angus', 2.8, 'Male', 'Highland Pastures', 'https://images.unsplash.com/photo-1596733430284-f7437764b14d?auto=format&fit=crop&w=800&q=80', 'Monitoring', 46, 'MODERATE', NOW() - INTERVAL '12 days', NOW()),
    ('a0000000-0000-0000-0000-000000000052', 'COW-052', 'Cattle', 'Holstein', 5.1, 'Female', 'Green Valley Dairy', 'https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=800&q=80', 'High Risk', 78, 'HIGH', NOW() - INTERVAL '25 days', NOW()),
    ('a0000000-0000-0000-0000-000000000063', 'COW-063', 'Cattle', 'Hereford', 3.9, 'Female', 'Meadowbrook Ranch', 'https://images.unsplash.com/photo-1527153857715-3908f2ae5e81?auto=format&fit=crop&w=800&q=80', 'Healthy', 22, 'LOW', NOW() - INTERVAL '30 days', NOW()),
    ('a0000000-0000-0000-0000-000000000011', 'GOAT-011', 'Goat', 'Boer', 2.1, 'Male', 'Sunnyside Farms', 'https://images.unsplash.com/photo-1524024973431-2ad916746881?auto=format&fit=crop&w=800&q=80', 'Healthy', 12, 'LOW', NOW() - INTERVAL '18 days', NOW()),
    ('a0000000-0000-0000-0000-000000000019', 'GOAT-019', 'Goat', 'Nubian', 1.8, 'Female', 'Sunnyside Farms', 'https://images.unsplash.com/photo-1560807707-8cc77767d783?auto=format&fit=crop&w=800&q=80', 'Monitoring', 52, 'MODERATE', NOW() - INTERVAL '15 days', NOW()),
    ('a0000000-0000-0000-0000-000000000004', 'BUFF-004', 'Buffalo', 'Murrah', 4.0, 'Female', 'Riverbank Dairy', 'https://images.unsplash.com/photo-1568644396922-5c3bfae12521?auto=format&fit=crop&w=800&q=80', 'Healthy', 15, 'LOW', NOW() - INTERVAL '22 days', NOW()),
    ('a0000000-0000-0000-0000-000000000009', 'BUFF-009', 'Buffalo', 'Nili-Ravi', 3.5, 'Female', 'Riverbank Dairy', 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=800&q=80', 'High Risk', 82, 'CRITICAL', NOW() - INTERVAL '10 days', NOW()),
    ('a0000000-0000-0000-0000-000000000072', 'COW-072', 'Cattle', 'Brown Swiss', 4.2, 'Female', 'Highland Pastures', 'https://images.unsplash.com/photo-1497752531616-c3afd9760a11?auto=format&fit=crop&w=800&q=80', 'Healthy', 19, 'LOW', NOW() - INTERVAL '8 days', NOW())
ON CONFLICT (animal_id) DO UPDATE SET
    status = EXCLUDED.status,
    current_risk_score = EXCLUDED.current_risk_score,
    current_risk_level = EXCLUDED.current_risk_level;

-- 2. Insert Historical Health Observations (Past 6 days for COW-027: Healthy baseline)
INSERT INTO health_observations (animal_id, temperature, feeding_percentage, activity_percentage, behavior_notes, observation_source, created_at)
VALUES
    ('a0000000-0000-0000-0000-000000000027', 38.4, 98.5, 99.0, 'Normal ruminating behavior, engaged with herd', 'IoT Collar Sensor', NOW() - INTERVAL '5 days'),
    ('a0000000-0000-0000-0000-000000000027', 38.5, 100.0, 98.2, 'Active grazing, normal water intake', 'IoT Collar Sensor', NOW() - INTERVAL '4 days'),
    ('a0000000-0000-0000-0000-000000000027', 38.6, 97.8, 101.4, 'Normal gait and posture observed during morning milking', 'Veterinary Inspection', NOW() - INTERVAL '3 days'),
    ('a0000000-0000-0000-0000-000000000027', 38.5, 99.2, 97.5, 'Normal resting cycles, responsive to ambient sounds', 'IoT Collar Sensor', NOW() - INTERVAL '2 days'),
    ('a0000000-0000-0000-0000-000000000027', 38.5, 100.0, 100.0, 'Optimal vitality, steady feed intake', 'IoT Collar Sensor', NOW() - INTERVAL '1 day'),
    ('a0000000-0000-0000-0000-000000000027', 38.5, 100.0, 100.0, 'Healthy baseline parameters verified', 'IoT Collar Sensor', NOW() - INTERVAL '2 hours');

-- Observations for COW-052 (High Risk: BRD / Mastitis signs)
INSERT INTO health_observations (animal_id, temperature, feeding_percentage, activity_percentage, behavior_notes, observation_source, created_at)
VALUES
    ('a0000000-0000-0000-0000-000000000052', 39.2, 85.0, 80.0, 'Slight drop in feeding duration', 'IoT Collar Sensor', NOW() - INTERVAL '3 days'),
    ('a0000000-0000-0000-0000-000000000052', 39.8, 72.0, 68.0, 'Elevated respiration, isolated from pen group', 'IoT Collar Sensor', NOW() - INTERVAL '2 days'),
    ('a0000000-0000-0000-0000-000000000052', 40.2, 60.0, 54.0, 'High fever, nasal discharge, head drooping', 'Automated Pen Vision', NOW() - INTERVAL '4 hours');

-- Observations for BUFF-009 (Critical Risk)
INSERT INTO health_observations (animal_id, temperature, feeding_percentage, activity_percentage, behavior_notes, observation_source, created_at)
VALUES
    ('a0000000-0000-0000-0000-000000000009', 40.5, 52.0, 48.0, 'Severe lethargy, persistent fever, refusal to feed', 'Veterinary Telemetry', NOW() - INTERVAL '6 hours');

-- 3. Veterinary Knowledge Base Documents
INSERT INTO knowledge_documents (title, content, source, category, embedding)
VALUES
(
    'Bovine Respiratory Disease Complex (BRD) Clinical Guidelines',
    'Bovine Respiratory Disease (BRD) is characterized by early pyrexia (rectal temperature exceeding 39.5°C/103.1°F), depressed feed intake (drop >25%), diminished herd activity (>30% reduction), drooping ears, and nasal discharge. Early intervention within 24-48 hours of sensor deviation dramatically improves clinical prognosis. Isolation and physical veterinary auscultation are recommended.',
    'Merck Veterinary Manual - Cattle Internal Medicine (11th Ed.)',
    'Respiratory & Infectious Disease',
    '[0.12, 0.45, -0.22, 0.89, -0.05]'::jsonb
),
(
    'Clinical Mastitis Early Warning Detection in Dairy Cattle',
    'Early mastitis signs include focal swelling or heat in the udder quarter, sudden decrease in milking yield (>15%), localized restlessness, elevated somatic cell counts, and mild hyperthermia (39.2°C - 39.8°C). Behavioral monitoring shows prolonged standing without feeding and reluctant ambulation.',
    'Journal of Dairy Science - Sensor Telemetry in Mastitis Detection (2023)',
    'Mammary Health & Milk Quality',
    '[0.33, 0.12, 0.67, -0.18, 0.41]'::jsonb
),
(
    'Subacute Ruminal Acidosis (SARA) and Feeding Behavior Dynamics',
    'SARA presents with erratic dry matter intake, reduced rumination time (<400 min/day), mild diarrhea, and lethargy. Daily feeding duration drop of >35% alongside fluctuating body temperature warrants feed bunk ration evaluation and fecal screening.',
    'World Association for Buiatrics Clinical Consensus',
    'Metabolic & Digestive Disorders',
    '[-0.15, 0.78, 0.29, 0.14, -0.55]'::jsonb
),
(
    'Bovine Lameness and Locomotion Scoring Protocols',
    'Locomotion scoring (Sprecher 1-5 scale) associates arched back posture during standing and walking, head bobbing, and shortened stride with foot lesions or digital dermatitis. Sensor activity drop >40% is a primary digital marker of Grade 3+ lameness.',
    'Bovine Locomotion Assessment Guidelines (Cornell Cooperative Extension)',
    'Musculoskeletal & Locomotion',
    '[0.05, -0.32, 0.81, 0.44, 0.19]'::jsonb
),
(
    'Heat Stress Assessment in Ruminants (THI Index)',
    'Temperature Humidity Index (THI) > 72 causes physiological heat load: elevated respiration rate (>60 breaths/min), body temperature >39.3°C, decreased rumination, and seeking water shade. Mitigation requires active ventilation, shade, and sprinkler cycling.',
    'FAO Livestock Physiology & Climate Adaptation Guide',
    'Environmental Stress & Welfare',
    '[0.41, 0.08, -0.52, 0.63, 0.27]'::jsonb
),
(
    'Caprine Enterotoxemia and Acute Toxic Shock Warning Indicators',
    'Goats exhibit hyperacute illness: sudden recumbency, ruminal hypomotility, high fever followed by hypothermia, acute feeding cessation, and severe distress. Prompt veterinary notification and isolation are mandatory.',
    'Goat Medicine & Health Protocols (Matthews 3rd Ed.)',
    'Caprine Health & Small Ruminants',
    '[-0.22, 0.64, 0.11, 0.72, -0.31]'::jsonb
);

-- 4. Seed Alerts
INSERT INTO alerts (id, animal_id, severity, title, message, status, created_at)
VALUES
(
    'c0000000-0000-0000-0000-000000000052',
    'a0000000-0000-0000-0000-000000000052',
    'HIGH',
    'High Fever & Respiratory Deviation Detected',
    'Animal COW-052 has demonstrated sustained hyperthermia (40.2°C, +1.7°C baseline deviation) accompanied by a 40% reduction in feeding and 46% reduction in activity over the last 24 hours. Veterinary auscultation recommended.',
    'OPEN',
    NOW() - INTERVAL '3 hours'
),
(
    'c0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000009',
    'CRITICAL',
    'Critical Pyrexia and Extreme Lethargy Alert',
    'BUFF-009 recorded severe acute pyrexia (40.5°C) with persistent feeding refusal (<52% baseline). Immediate clinical examination and herd isolation suggested.',
    'OPEN',
    NOW() - INTERVAL '5 hours'
);

-- 5. Seed Risk Assessments
INSERT INTO risk_assessments (animal_id, risk_score, risk_level, confidence, factors, evidence, created_at)
VALUES
(
    'a0000000-0000-0000-0000-000000000052',
    78,
    'HIGH',
    0.89,
    '[
        {"name": "Temperature Deviation", "weight": "+24", "detail": "Body temp 40.2°C (+1.7°C over baseline)"},
        {"name": "Feeding Reduction", "weight": "+20", "detail": "Feeding dropped 40% below historical norm"},
        {"name": "Activity Drop", "weight": "+18", "detail": "Activity down 46% with extended resting"},
        {"name": "Visual Anomaly", "weight": "+16", "detail": "Head drooping and ocular/nasal signs detected"}
    ]'::jsonb,
    '{
        "temperature": 40.2,
        "temperature_baseline": 38.5,
        "feeding_percentage": 60.0,
        "activity_percentage": 54.0,
        "summary": "Multi-agent consensus indicates high probability of acute systemic or respiratory inflammation."
    }'::jsonb,
    NOW() - INTERVAL '3 hours'
);

-- 6. Seed Reports
INSERT INTO reports (animal_id, summary, recommendations, evidence, risk_score, risk_level, report_content, created_at)
VALUES
(
    'a0000000-0000-0000-0000-000000000052',
    'Multi-agent intelligence identified a compound health risk in COW-052 characterized by sustained hyperthermia (40.2°C), acute anorexia, and reduced mobility.',
    '1. Isolate animal in clean, dry observation pen. 2. Request physical examination by attending herd veterinarian. 3. Ensure unrestricted access to fresh water and electrolyte fluids. 4. Monitor respiratory rate every 4 hours.',
    '{"temperature_deviation": 1.7, "feeding_change": -40.0, "activity_change": -46.0}'::jsonb,
    78,
    'HIGH',
    'VET-AI HEALTH ASSESSMENT REPORT\n=================================\nAnimal: COW-052 (Holstein Friesian, 5.1 yrs)\nFarm: Green Valley Dairy\nDate: Today\n\nEXECUTIVE SUMMARY:\nSensor and telemetry feeds flagged an acute deviation across thermal, behavioral, and nutritional markers. Risk Score: 78/100 (HIGH RISK).\n\nKEY OBSERVATIONS:\n- Core temperature: 40.2°C (+1.7°C vs baseline 38.5°C)\n- Feeding activity: 60% (-40% drop)\n- Locomotion & Herd Activity: 54% (-46% drop)\n- Visual AI: Detected abnormal head-down posture and decreased alertness.\n\nDIFFERENTIAL VETERINARY CONSIDERATIONS:\n- Early Bovine Respiratory Disease Complex (BRD)\n- Acute Toxic Mastitis / Systemic Bacteremia\n\nSAFETY NOTICE:\nVET-AI provides AI-assisted health-risk monitoring and decision support. It does not provide a definitive veterinary diagnosis. Consult a qualified veterinarian for clinical evaluation.',
    NOW() - INTERVAL '3 hours'
);

-- 7. Seed Agent Runs
INSERT INTO agent_runs (animal_id, agent_name, status, input_data, output_data, execution_time_ms, created_at)
VALUES
(
    'a0000000-0000-0000-0000-000000000052',
    'Orchestrator Agent',
    'COMPLETED',
    '{"animal_id": "COW-052", "trigger": "Scheduled Sensor Ingestion"}'::jsonb,
    '{"workflow": "All 6 specialist agents dispatched and synthesized successfully", "final_risk_score": 78}'::jsonb,
    1420,
    NOW() - INTERVAL '3 hours'
),
(
    'a0000000-0000-0000-0000-000000000052',
    'Vision Agent',
    'COMPLETED',
    '{"image_url": "https://images.unsplash.com/photo-1500595046743-cd271d694d30"}'::jsonb,
    '{"posture": "depressed", "head_position": "lowered", "ocular_discharge": "mild", "confidence": 0.88}'::jsonb,
    480,
    NOW() - INTERVAL '3 hours'
),
(
    'a0000000-0000-0000-0000-000000000052',
    'Sensor Agent',
    'COMPLETED',
    '{"raw_temperature": 40.2, "baseline_temp": 38.5}'::jsonb,
    '{"temperature_deviation": 1.7, "severity": "HIGH_PYREXIA"}'::jsonb,
    180,
    NOW() - INTERVAL '3 hours'
),
(
    'a0000000-0000-0000-0000-000000000052',
    'Behavior Agent',
    'COMPLETED',
    '{"feeding_pct": 60, "activity_pct": 54}'::jsonb,
    '{"feeding_change": -40.0, "activity_change": -46.0, "social_isolation": true}'::jsonb,
    210,
    NOW() - INTERVAL '3 hours'
),
(
    'a0000000-0000-0000-0000-000000000052',
    'Risk Agent',
    'COMPLETED',
    '{"vision_evidence": "depressed posture", "thermal_deviation": 1.7, "behavior_drop": -40.0}'::jsonb,
    '{"risk_score": 78, "risk_level": "HIGH", "confidence": 0.89}'::jsonb,
    260,
    NOW() - INTERVAL '3 hours'
),
(
    'a0000000-0000-0000-0000-000000000052',
    'Knowledge Agent',
    'COMPLETED',
    '{"query": "pyrexia lethargy anorexia bovine respiratory disease"}'::jsonb,
    '{"top_documents": ["BRD Clinical Guidelines", "Acute Mastitis Warning"], "relevance_score": 0.94}'::jsonb,
    310,
    NOW() - INTERVAL '3 hours'
),
(
    'a0000000-0000-0000-0000-000000000052',
    'Report Agent',
    'COMPLETED',
    '{"risk_score": 78, "matched_guidelines": 2}'::jsonb,
    '{"report_id": "rep-cow052", "alert_generated": true}'::jsonb,
    550,
    NOW() - INTERVAL '3 hours'
);
