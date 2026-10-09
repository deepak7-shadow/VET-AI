"""
VET-AI: Prototype Dataset Generator & Ingestion Script.
Generates an operational stratified prototype dataset with clinical metadata,
farm distributions, sample types, and laboratory confirmation records across all 7 classes.
"""

import os
import random
import uuid
from typing import Dict, List, Any
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter
from ml.config import (
    CLASSES,
    CONFIRMATION_REQUIREMENTS,
    SAMPLE_TYPES
)
from ml.dataset_manager import DatasetManager

# Realistic color profiles and clinical descriptions for each class
CLINICAL_PROFILES = {
    "coccidiosis": {
        "color_base": (120, 30, 25),      # Hemorrhagic dark red/brown with clotted mucosal shreds
        "color_accent": (70, 15, 15),
        "texture_type": "bloody_mucosal_specks",
        "typical_age": "3-8 weeks calf",
        "clinical_note": "Fecal score 4 (watery with overt frank blood and mucosal casting)"
    },
    "salmonellosis": {
        "color_base": (145, 115, 30),     # Foul-smelling watery yellowish-green with fibrinous casts
        "color_accent": (180, 150, 45),
        "texture_type": "fibrinous_pseudomembrane",
        "typical_age": "2-12 weeks calf or fresh adult cow",
        "clinical_note": "Fecal score 4 (profuse watery diarrhea with foul putrid odor and fibrin)"
    },
    "bvd": {
        "color_base": (130, 95, 45),      # Mucus-rich, watery with intermittent blood and mucosal erosion
        "color_accent": (160, 125, 60),
        "texture_type": "mucoid_scour",
        "typical_age": "6-24 months stocker / heifer",
        "clinical_note": "Profuse watery scour, leukopenia, oral mucosa blunting / ulcerations"
    },
    "leptospirosis": {
        "color_base": (140, 20, 20),      # Port-wine colored urine (hemoglobinuria / redwater)
        "color_accent": (95, 10, 10),
        "texture_type": "port_wine_urine",
        "typical_age": "Adult lactating cow / pasture heifer",
        "clinical_note": "Hemoglobinuria (dark red-brown port wine urine), flaccid agalactia"
    },
    "uti_kidney": {
        "color_base": (185, 160, 90),     # Cloudy turbid urine with purulent sediment and mucus shreds
        "color_accent": (210, 190, 130),
        "texture_type": "turbid_purulent_sediment",
        "typical_age": "Multiparous dairy cow (post-calving)",
        "clinical_note": "Stranguria, arched back, pyuria (pus floccules in voided urine)"
    },
    "healthy": {
        "color_base": (75, 95, 45),       # Normal pastured greenish-brown formed manure / clear amber urine
        "color_accent": (60, 80, 35),
        "texture_type": "normal_digestive",
        "typical_age": "All ages",
        "clinical_note": "Normal fecal consistency (score 2-3), clear amber urine, bright alert posture"
    },
    "other_diarrhea": {
        "color_base": (180, 170, 75),     # Non-target nutritional / neonatal scour (white/yellowish creamy)
        "color_accent": (205, 195, 100),
        "texture_type": "creamy_nutritional_scour",
        "typical_age": "1-3 weeks neonate",
        "clinical_note": "Nutritional / osmotic scour from milk replacer transition, negative for target pathogens"
    }
}

FARMS = [
    "FARM-VALLEY-01",
    "FARM-OAKRIDGE-02",
    "FARM-SUNRISE-03",
    "FARM-GREENPASTURE-04",
    "FARM-HIGHLAND-05",
    "FARM-CREEKSIDE-06",
    "FARM-MEADOW-07"
]

def generate_clinical_image(filepath: Path, profile: Dict[str, Any], sample_type: str, seed: int):
    """Synthesizes a realistic visual sample with clinical textures, noise, and lighting variation."""
    random.seed(seed)
    w, h = 256, 256
    
    # Base background color
    base = profile["color_base"]
    accent = profile["color_accent"]
    
    # Add random illumination / camera sensor noise
    lum = random.uniform(0.85, 1.15)
    r = min(255, max(0, int(base[0] * lum)))
    g = min(255, max(0, int(base[1] * lum)))
    b = min(255, max(0, int(base[2] * lum)))
    
    img = Image.new("RGB", (w, h), color=(r, g, b))
    draw = ImageDraw.Draw(img)

    # Draw clinical texture details
    for _ in range(60):
        x1 = random.randint(0, w)
        y1 = random.randint(0, h)
        rad = random.randint(3, 25)
        dr = min(255, max(0, int(accent[0] + random.randint(-20, 20))))
        dg = min(255, max(0, int(accent[1] + random.randint(-20, 20))))
        db = min(255, max(0, int(accent[2] + random.randint(-20, 20))))
        draw.ellipse([x1 - rad, y1 - rad, x1 + rad, y1 + rad], fill=(dr, dg, db, 180))

    # Add lighting gradient
    for y in range(0, h, 8):
        alpha = int(25 * (y / h))
        draw.line([(0, y), (w, y)], fill=(0, 0, 0), width=1)

    # Blur for organic fluid texture
    img = img.filter(ImageFilter.GaussianBlur(radius=2))
    img.save(filepath, format="JPEG", quality=90)

def build_prototype_dataset(samples_per_class: int = 40):
    """
    Builds the prototype dataset with farm-stratified train/val/test splits,
    valid lab confirmations, and verified manifest.
    """
    manager = DatasetManager(data_root="ml/data")
    manager.ensure_directory_structure()

    records: List[Dict[str, Any]] = []

    print(f"[Dataset] Generating prototype images across {len(CLASSES)} classes...")
    img_counter = 0

    for cls_name in CLASSES:
        profile = CLINICAL_PROFILES[cls_name]
        valid_confirmations = CONFIRMATION_REQUIREMENTS[cls_name]

        for i in range(samples_per_class):
            img_counter += 1
            image_id = f"IMG-{cls_name[:3].upper()}-{img_counter:05d}"
            farm_id = random.choice(FARMS)
            animal_id = f"BOV-{farm_id.split('-')[1][:3]}-{random.randint(100, 999)}"
            sample_type = random.choice(SAMPLE_TYPES)
            confirmation_method = random.choice(valid_confirmations)

            records.append({
                "image_id": image_id,
                "class_label": cls_name,
                "farm_id": farm_id,
                "animal_id": animal_id,
                "sample_type": sample_type,
                "confirmation_method": confirmation_method,
                "veterinarian_confirmed": True,
                "clinical_note": profile["clinical_note"],
                "age_cohort": profile["typical_age"],
                "camera_type": random.choice(["Mobile-CMOS-12MP", "Handheld-Field-DSLR", "Body-Worn-VetCam"]),
                "lighting_condition": random.choice(["Direct-Sunlight", "Covered-Barn", "Flourescent-Hospital", "Dusk-LowLight"])
            })

    # Partition by farm (70% Train, 15% Val, 15% Test)
    splits = manager.partition_by_farm(records, seed=42)
    all_assigned_records = splits["train"] + splits["val"] + splits["test"]

    print(f"[Dataset] Saving partitioned images to disk (Train: {len(splits['train'])}, Val: {len(splits['val'])}, Test: {len(splits['test'])})")

    for rec in all_assigned_records:
        split = rec["split"]
        cls_name = rec["class_label"]
        filename = f"{rec['image_id']}.jpg"
        target_path = Path("ml/data") / split / cls_name / filename
        rec["file_path"] = str(target_path)
        
        generate_clinical_image(
            filepath=target_path,
            profile=CLINICAL_PROFILES[cls_name],
            sample_type=rec["sample_type"],
            seed=hash(rec["image_id"]) % 100000
        )

    # Generate dataset manifest
    manifest = manager.generate_manifest(all_assigned_records)
    print(f"[Dataset] Manifest generated successfully: {manager.manifest_file}")
    print(f"[Dataset] Total images: {manifest['total_images']}")
    for k, v in manifest["class_counts"].items():
        print(f"  - {k:18}: {v} images")

    return manifest

if __name__ == "__main__":
    build_prototype_dataset()
