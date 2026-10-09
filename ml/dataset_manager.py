"""
VET-AI: Dataset Management & Farm-Stratified Splitter.
Organizes livestock images, enforces clinical validation metadata,
and executes strict farm/animal-level train (70%) / val (15%) / test (15%) partitioning.
"""

import os
import json
import random
import shutil
from pathlib import Path
from typing import Dict, List, Any, Optional
from ml.config import (
    CLASSES,
    SPLIT_RATIOS,
    CONFIRMATION_REQUIREMENTS,
    IMAGE_QUOTAS,
    SAMPLE_TYPES
)

class DatasetManager:
    def __init__(self, data_root: str = "ml/data"):
        self.data_root = Path(data_root)
        self.manifest_file = self.data_root / "dataset_manifest.json"

    def ensure_directory_structure(self):
        """Creates the train/val/test folders for all 7 classes."""
        for split in ["train", "val", "test"]:
            for cls_name in CLASSES:
                (self.data_root / split / cls_name).mkdir(parents=True, exist_ok=True)

    def validate_record(self, record: Dict[str, Any]) -> tuple[bool, str]:
        """
        Validates clinical requirements:
        Must include farm_id, animal_id, class_label, confirmation_method, sample_type.
        """
        class_label = record.get("class_label")
        if class_label not in CLASSES:
            return False, f"Invalid class label '{class_label}'. Must be one of {CLASSES}."

        farm_id = record.get("farm_id")
        if not farm_id:
            return False, "Missing required 'farm_id' for non-random herd splitting."

        confirmation_method = record.get("confirmation_method")
        valid_methods = CONFIRMATION_REQUIREMENTS.get(class_label, [])
        if not confirmation_method or confirmation_method not in valid_methods:
            return False, (
                f"Invalid or missing confirmation_method '{confirmation_method}' for class '{class_label}'. "
                f"Accepted veterinary confirmations: {valid_methods}"
            )

        sample_type = record.get("sample_type")
        if sample_type not in SAMPLE_TYPES:
            return False, f"Invalid sample_type '{sample_type}'. Must be one of {SAMPLE_TYPES}."

        return True, "Valid"

    def partition_by_farm(self, records: List[Dict[str, Any]], seed: int = 42) -> Dict[str, List[Dict[str, Any]]]:
        """
        Strictly splits data by farm_id to avoid data leakage between training and testing.
        70% Train, 15% Val, 15% Test.
        """
        random.seed(seed)
        
        # Group records by farm
        farms: Dict[str, List[Dict[str, Any]]] = {}
        for r in records:
            farm_id = r["farm_id"]
            farms.setdefault(farm_id, []).append(r)

        farm_list = list(farms.keys())
        random.shuffle(farm_list)

        total_farms = len(farm_list)
        if total_farms < 3:
            # If fewer than 3 farms, partition by animal_id instead
            return self.partition_by_animal(records, seed)

        train_count = max(1, int(total_farms * SPLIT_RATIOS["train"]))
        val_count = max(1, int(total_farms * SPLIT_RATIOS["val"]))
        
        train_farms = set(farm_list[:train_count])
        val_farms = set(farm_list[train_count:train_count + val_count])
        test_farms = set(farm_list[train_count + val_count:])
        if not test_farms:
            test_farms = {farm_list[-1]}
            if farm_list[-1] in val_farms:
                val_farms.remove(farm_list[-1])

        splits: Dict[str, List[Dict[str, Any]]] = {"train": [], "val": [], "test": []}
        for farm_id, recs in farms.items():
            if farm_id in train_farms:
                target = "train"
            elif farm_id in val_farms:
                target = "val"
            else:
                target = "test"
            
            for rec in recs:
                rec_copy = dict(rec)
                rec_copy["split"] = target
                splits[target].append(rec_copy)

        return splits

    def partition_by_animal(self, records: List[Dict[str, Any]], seed: int = 42) -> Dict[str, List[Dict[str, Any]]]:
        """Fallback partitioning by animal_id if single farm."""
        random.seed(seed)
        animals: Dict[str, List[Dict[str, Any]]] = {}
        for r in records:
            animals.setdefault(r["animal_id"], []).append(r)

        animal_list = list(animals.keys())
        random.shuffle(animal_list)

        total_animals = len(animal_list)
        train_count = max(1, int(total_animals * SPLIT_RATIOS["train"]))
        val_count = max(1, int(total_animals * SPLIT_RATIOS["val"]))

        train_animals = set(animal_list[:train_count])
        val_animals = set(animal_list[train_count:train_count + val_count])
        test_animals = set(animal_list[train_count + val_count:])
        if not test_animals:
            test_animals = {animal_list[-1]}

        splits: Dict[str, List[Dict[str, Any]]] = {"train": [], "val": [], "test": []}
        for animal_id, recs in animals.items():
            target = "train" if animal_id in train_animals else ("val" if animal_id in val_animals else "test")
            for rec in recs:
                rec_copy = dict(rec)
                rec_copy["split"] = target
                splits[target].append(rec_copy)

        return splits

    def generate_manifest(self, records: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generates comprehensive dataset summary and writes manifest file."""
        self.ensure_directory_structure()
        
        # Summary counts
        class_counts = {c: 0 for c in CLASSES}
        split_counts = {"train": 0, "val": 0, "test": 0}
        farm_counts = {}
        confirmation_counts = {}

        valid_records = []
        for r in records:
            valid, msg = self.validate_record(r)
            if not valid:
                continue
            valid_records.append(r)
            class_counts[r["class_label"]] += 1
            split_counts[r.get("split", "train")] += 1
            farm_counts[r["farm_id"]] = farm_counts.get(r["farm_id"], 0) + 1
            conf = r["confirmation_method"]
            confirmation_counts[conf] = confirmation_counts.get(conf, 0) + 1

        manifest = {
            "version": "1.0.0",
            "model_target": "YOLO26-Cattle-Triage",
            "total_images": len(valid_records),
            "class_counts": class_counts,
            "split_counts": split_counts,
            "farm_counts": farm_counts,
            "confirmation_method_counts": confirmation_counts,
            "quota_compliance": {
                c: {
                    "count": class_counts[c],
                    "minimum_met": class_counts[c] >= IMAGE_QUOTAS[c]["minimum"],
                    "required_minimum": IMAGE_QUOTAS[c]["minimum"],
                    "production_target": IMAGE_QUOTAS[c]["production_target"]
                }
                for c in CLASSES
            },
            "records": valid_records
        }

        with open(self.manifest_file, "w", encoding="utf-8") as f:
            json.dump(manifest, f, indent=2)

        return manifest
