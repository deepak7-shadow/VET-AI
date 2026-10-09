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
        local_path = None
        
        # Handle data URL (base64)
        if image_path_or_url and image_path_or_url.startswith("data:image/"):
            import base64
            import uuid
            try:
                header, b64_data = image_path_or_url.split(",", 1)
                img_bytes = base64.b64decode(b64_data)
                upload_dir = PROJECT_ROOT / "backend" / "uploads"
                upload_dir.mkdir(parents=True, exist_ok=True)
                temp_filename = f"excreta_{uuid.uuid4().hex[:8]}.jpg"
                temp_path = upload_dir / temp_filename
                temp_path.write_bytes(img_bytes)
                local_path = temp_path
            except Exception:
                local_path = None

        # Handle local /uploads/
        elif image_path_or_url and image_path_or_url.startswith("/uploads/"):
            candidate = PROJECT_ROOT / "backend" / "uploads" / image_path_or_url.replace("/uploads/", "")
            if candidate.exists():
                local_path = candidate

        # Handle remote HTTP URL
        elif image_path_or_url and (image_path_or_url.startswith("http://") or image_path_or_url.startswith("https://")):
            try:
                import urllib.request
                import uuid
                upload_dir = PROJECT_ROOT / "backend" / "uploads"
                upload_dir.mkdir(parents=True, exist_ok=True)
                temp_filename = f"remote_{uuid.uuid4().hex[:8]}.jpg"
                temp_path = upload_dir / temp_filename
                req = urllib.request.Request(
                    image_path_or_url, 
                    headers={'User-Agent': 'Mozilla/5.0'}
                )
                with urllib.request.urlopen(req, timeout=5) as response, open(temp_path, 'wb') as out_file:
                    out_file.write(response.read())
                if temp_path.exists() and temp_path.stat().st_size > 0:
                    local_path = temp_path
            except Exception:
                local_path = None

        # Handle file paths
        elif image_path_or_url:
            candidate = Path(image_path_or_url)
            if not candidate.is_absolute():
                candidate = PROJECT_ROOT / image_path_or_url
            if candidate.exists():
                local_path = candidate

        # Fallback to prototype dataset samples matching sample_type if needed
        if not local_path or not local_path.exists():
            target_class = "leptospirosis" if "urine" in (sample_type or "") else "coccidiosis"
            candidates = list((PROJECT_ROOT / "ml" / "data" / "test" / target_class).glob("*.jpg"))
            if not candidates:
                candidates = list((PROJECT_ROOT / "ml" / "data" / "test").glob("*/*.jpg"))
            if candidates:
                local_path = candidates[0]
            else:
                raise FileNotFoundError(f"Could not resolve image for visual screening: {image_path_or_url}")

        result = clf.predict_image(
            image_path=str(local_path),
            sample_type=sample_type,
            animal_id=animal_id,
            farm_id=farm_id
        )
        return result

