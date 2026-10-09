"""
VET-AI: YOLO26 Service Integration for Livestock Visual Disease Screening.
Wraps the ML YOLO26 classifier and connects into FastAPI endpoints and agent pipelines.
"""

import os
from pathlib import Path
from typing import Dict, Any, Optional
import sys

# Ensure project root is in sys.path
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from ml.yolo_classifier import YOLO26Classifier

class YOLOScreeningService:
    _instance = None
    _classifier = None

    @classmethod
    def get_classifier(cls) -> YOLO26Classifier:
        if cls._classifier is None:
            weights_path = PROJECT_ROOT / "ml" / "weights" / "yolo26_cattle_disease_v1.json"
            cls._classifier = YOLO26Classifier(weights_path=str(weights_path))
        return cls._classifier

    @classmethod
    def screen_image(
        cls,
        image_path_or_url: str,
        sample_type: Optional[str] = "manure_closeup",
        animal_id: Optional[str] = "UNKNOWN",
        farm_id: Optional[str] = "UNKNOWN"
    ) -> Dict[str, Any]:
        """
        Executes YOLO26 visual screening and outputs disease risk probabilities
        and structured veterinary triage report.
        """
        clf = cls.get_classifier()
        
        # Resolve path
        if image_path_or_url.startswith("/uploads/"):
            # Local uploaded image
            local_path = PROJECT_ROOT / "backend" / "uploads" / image_path_or_url.replace("/uploads/", "")
        else:
            local_path = Path(image_path_or_url)
            if not local_path.is_absolute():
                local_path = PROJECT_ROOT / image_path_or_url

        if not local_path.exists():
            # Fallback: check ml/data
            sample_candidates = list((PROJECT_ROOT / "ml" / "data" / "test").glob("*/*.jpg"))
            if sample_candidates:
                local_path = sample_candidates[0]
            else:
                raise FileNotFoundError(f"Image not found at {image_path_or_url}")

        result = clf.predict_image(
            image_path=str(local_path),
            sample_type=sample_type,
            animal_id=animal_id,
            farm_id=farm_id
        )
        return result
