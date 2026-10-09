"""
VET-AI: Custom YOLO Classification Configuration for Cattle Disease Risk Screening.
Defines classes, data quotas, farm-stratified split rules, and veterinary confirmation requirements.
"""

from typing import Dict, List, Any

# Target Classes (5 diseases + 2 vital control classes)
CLASSES: List[str] = [
    "coccidiosis",
    "salmonellosis",
    "bvd",
    "leptospirosis",
    "uti_kidney",
    "healthy",
    "other_diarrhea"
]

CLASS_DISPLAY_NAMES: Dict[str, str] = {
    "coccidiosis": "Bovine Coccidiosis (Eimeria spp.)",
    "salmonellosis": "Bovine Salmonellosis (Salmonella enterica)",
    "bvd": "Bovine Viral Diarrhea (BVDV)",
    "leptospirosis": "Bovine Leptospirosis (Leptospira hardjo/pomona)",
    "uti_kidney": "Urinary Tract / Kidney Infection (Pyelonephritis / Cystitis)",
    "healthy": "Healthy / No Visible Clinical Concern",
    "other_diarrhea": "Non-Target Diarrhea (Nutritional / Rotavirus / Coronavirus / Cryptosporidium)"
}

# Image quota targets per class
IMAGE_QUOTAS: Dict[str, Dict[str, int]] = {
    "coccidiosis": {"minimum": 900, "production_target": 1800},
    "salmonellosis": {"minimum": 900, "production_target": 1800},
    "bvd": {"minimum": 900, "production_target": 1800},
    "leptospirosis": {"minimum": 900, "production_target": 1800},
    "uti_kidney": {"minimum": 900, "production_target": 1800},
    "healthy": {"minimum": 1500, "production_target": 2500},
    "other_diarrhea": {"minimum": 1500, "production_target": 2500}
}

# Total counts
MINIMUM_TOTAL_IMAGES = 7500
PRODUCTION_TARGET_IMAGES = 13800

# Required Lab / Veterinary Confirmation Methods per Disease
CONFIRMATION_REQUIREMENTS: Dict[str, List[str]] = {
    "coccidiosis": [
        "FECAL_FLOAT_OOCYSTS", 
        "MCMASTER_QUANTITATIVE", 
        "PCR_EIMERIA", 
        "POSTMORTEM_HISTOPATHOLOGY"
    ],
    "salmonellosis": [
        "FECAL_BACTERIAL_CULTURE", 
        "SALMONELLA_PCR", 
        "ANTIMICROBIAL_SUSCEPTIBILITY", 
        "NECROPSY_ISOLATION"
    ],
    "bvd": [
        "EAR_NOTCH_ANTIGEN_ELISA", 
        "SERUM_RT_PCR", 
        "VIRUS_ISOLATION", 
        "PAIRED_SEROLOGY"
    ],
    "leptospirosis": [
        "MICROSCOPIC_AGGLUTINATION_TEST_MAT", 
        "URINE_PCR_LEPTOSPIRA", 
        "DARKFIELD_MICROSCOPY", 
        "SEROLOGY_CONVALESCENT"
    ],
    "uti_kidney": [
        "URINALYSIS_SEDIMENT_LEUKOCYTES", 
        "URINE_BACTERIAL_CULTURE", 
        "SERUM_BUN_CREATININE", 
        "TRANSRECTAL_ULTRASOUND_KIDNEY"
    ],
    "healthy": [
        "VETERINARY_CLINICAL_EXAM", 
        "NORMAL_TEMPERATURE_HEART_RATE", 
        "NEGATIVE_HERD_DIAGNOSTICS"
    ],
    "other_diarrhea": [
        "ROTA_CORONA_CRYPTOSPORIDIUM_ANTIGEN_TEST", 
        "FECAL_SCOUR_PANEL_NON_TARGET", 
        "DIETARY_FEED_TRANSITION_CONFIRMED"
    ]
}

# Split criteria: Strictly partitioned by farm_id / animal_id to eliminate data leakage
SPLIT_RATIOS = {
    "train": 0.70,
    "val": 0.15,
    "test": 0.15
}

# Image Variety Categories
SAMPLE_TYPES = [
    "manure_closeup",
    "urine_stream_perineal",
    "full_calf_body",
    "adult_cow_body",
    "head_mucous_membranes",
    "posture_gait"
]
