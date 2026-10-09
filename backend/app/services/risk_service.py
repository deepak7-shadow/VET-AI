from typing import Dict, Any, List, Optional

class RiskService:
    @staticmethod
    def calculate_risk(
        sensor_data: Optional[Dict[str, Any]] = None,
        behavior_data: Optional[Dict[str, Any]] = None,
        vision_data: Optional[Dict[str, Any]] = None,
        feeding_data: Optional[Dict[str, Any]] = None,
        appearance_data: Optional[Dict[str, Any]] = None,
        baseline_temp: float = 38.5,
        is_preliminary: bool = False
    ) -> Dict[str, Any]:
        """
        Synthesizes sensor, behavioral, visual, appearance, and feeding evidence into
        an explainable risk score and categorization according to VET-AI screening protocol:
        - LOW RISK
        - NEEDS MORE INFORMATION
        - MEDIUM RISK
        - HIGH RISK
        - CRITICAL CONCERN
        """
        sensor_data = sensor_data or {}
        behavior_data = behavior_data or {}
        vision_data = vision_data or {}
        feeding_data = feeding_data or {}
        appearance_data = appearance_data or {}

        # Provenance & Data Completeness Check
        has_sensor = "temperature" in sensor_data
        has_vision = bool(vision_data.get("observations")) or bool(vision_data.get("risk_indicators"))
        has_behavior = "feeding_change" in behavior_data or "activity_change" in behavior_data
        has_feeding = bool(feeding_data) and feeding_data.get("feeding_status") not in (None, "INSUFFICIENT_DATA", "BASELINE_NOT_ESTABLISHED")

        temp = sensor_data.get("temperature", baseline_temp)
        temp_dev = sensor_data.get("temperature_deviation", temp - baseline_temp) if has_sensor else 0.0
        
        feed_change = behavior_data.get("feeding_change", 0.0)
        activity_change = behavior_data.get("activity_change", 0.0)
        vision_indicators = vision_data.get("risk_indicators", [])

        factors: List[Dict[str, Any]] = []
        raw_score = 10.0 # baseline ambient risk

        # 1. Temperature factor (+0 to +28 pts)
        if has_sensor:
            if temp_dev > 1.4:
                temp_weight = 26.0 if temp_dev >= 1.8 else 22.0
                factors.append({
                    "name": "Temperature Elevation",
                    "weight": f"+{int(temp_weight)}",
                    "numeric_weight": temp_weight,
                    "detail": f"Current temp {temp:.1f}°C (+{temp_dev:.1f}°C above physiological baseline)",
                    "evidence_type": "SENSOR_TELEMETRY"
                })
                raw_score += temp_weight
            elif temp_dev > 0.6:
                temp_weight = 12.0
                factors.append({
                    "name": "Mild Hyperthermia",
                    "weight": f"+{int(temp_weight)}",
                    "numeric_weight": temp_weight,
                    "detail": f"Current temp {temp:.1f}°C (+{temp_dev:.1f}°C above baseline)",
                    "evidence_type": "SENSOR_TELEMETRY"
                })
                raw_score += temp_weight
            else:
                factors.append({
                    "name": "Thermal Homeostasis",
                    "weight": "+0",
                    "numeric_weight": 0,
                    "detail": f"Core temperature stable at {temp:.1f}°C (normative)",
                    "evidence_type": "SENSOR_TELEMETRY"
                })
        else:
            factors.append({
                "name": "Sensor Telemetry Missing",
                "weight": "+0",
                "numeric_weight": 0,
                "detail": "No physiological temperature telemetry provided (IoT optional)",
                "evidence_type": "MISSING_DATA"
            })

        # 2. Behavior / Herd Activity factor (+0 to +20 pts)
        if has_behavior:
            if activity_change <= -35.0:
                act_weight = 16.0
                factors.append({
                    "name": "Reduced Herd Mobility",
                    "weight": f"+{int(act_weight)}",
                    "numeric_weight": act_weight,
                    "detail": f"Collar motion index down by {abs(activity_change):.1f}% with prolonged recumbency",
                    "evidence_type": "BEHAVIORAL_METRIC"
                })
                raw_score += act_weight
            elif activity_change <= -18.0:
                act_weight = 9.0
                factors.append({
                    "name": "Mild Activity Reduction",
                    "weight": f"+{int(act_weight)}",
                    "numeric_weight": act_weight,
                    "detail": f"Motion activity reduced by {abs(activity_change):.1f}%",
                    "evidence_type": "BEHAVIORAL_METRIC"
                })
                raw_score += act_weight

        # 3. Dedicated Feeding Intelligence factor (+0 to +25 pts)
        feeding_status = feeding_data.get("feeding_status", "")
        if feeding_status == "POSSIBLE_REDUCED_INTAKE":
            cur_obs = feeding_data.get("current_observation", {})
            intake = cur_obs.get("estimated_intake_percent", 100)
            feed_weight = 24.0 if intake <= 50 else 16.0
            factors.append({
                "name": "Feeding Intelligence Alert",
                "weight": f"+{int(feed_weight)}",
                "numeric_weight": feed_weight,
                "detail": f"Suppressed intake ({intake:.0f}% of normal capacity) and appetite reluctance",
                "evidence_type": "FEEDING_INTELLIGENCE"
            })
            raw_score += feed_weight
        elif feeding_status == "UNUSUAL_FEEDING_PATTERN":
            factors.append({
                "name": "Unusual Feeding Pattern",
                "weight": "+8",
                "numeric_weight": 8.0,
                "detail": "Fluctuating intake or aberrant water trough consumption",
                "evidence_type": "FEEDING_INTELLIGENCE"
            })
            raw_score += 8.0
        elif not has_feeding and feed_change <= -25.0:
            # Fallback to behavior feeding change if no dedicated feeding assessment yet
            feed_weight = 18.0
            factors.append({
                "name": "Reduced Feed Intake",
                "weight": f"+{int(feed_weight)}",
                "numeric_weight": feed_weight,
                "detail": f"Daily bunk consumption dropped by {abs(feed_change):.1f}% below historical baseline",
                "evidence_type": "BEHAVIORAL_METRIC"
            })
            raw_score += feed_weight

        # 4. Visual indicators & Appearance factor (+0 to +24 pts)
        if vision_indicators and len(vision_indicators) >= 2:
            vis_weight = 20.0
            factors.append({
                "name": "Visual Anomalies Detected",
                "weight": f"+{int(vis_weight)}",
                "numeric_weight": vis_weight,
                "detail": f"Vision flagged {len(vision_indicators)} anomalies: {', '.join(vision_indicators[:2])}",
                "evidence_type": "COMPUTER_VISION"
            })
            raw_score += vis_weight
        elif vision_indicators:
            vis_weight = 10.0
            factors.append({
                "name": "Minor Visual Indicator",
                "weight": f"+{int(vis_weight)}",
                "numeric_weight": vis_weight,
                "detail": f"Visual anomaly: {vision_indicators[0]}",
                "evidence_type": "COMPUTER_VISION"
            })
            raw_score += vis_weight
        elif appearance_data.get("abnormalities_detected"):
            factors.append({
                "name": "Morphological Finding",
                "weight": "+8",
                "numeric_weight": 8.0,
                "detail": "Dermatological or localized contour asymmetry flagged by Appearance Agent",
                "evidence_type": "APPEARANCE_AGENT"
            })
            raw_score += 8.0

        final_score = min(100.0, max(0.0, round(raw_score, 1)))

        # Categorization logic compliant with Section 5
        # Must explicitly distinguish missing information from true low risk!
        has_sufficient_evidence = (has_sensor or has_vision or has_feeding)

        if final_score >= 80:
            category = "CRITICAL CONCERN"
            risk_level = "CRITICAL"
        elif final_score >= 60:
            category = "HIGH RISK"
            risk_level = "HIGH"
        elif final_score >= 35:
            category = "MEDIUM RISK"
            risk_level = "MODERATE"
        elif not has_sufficient_evidence or (is_preliminary and not has_feeding and not has_sensor):
            # Missing critical information: do not claim low risk without evidence!
            category = "NEEDS MORE INFORMATION"
            risk_level = "MODERATE"
        else:
            category = "LOW RISK"
            risk_level = "LOW"

        confidence = 0.92 if (has_sensor and has_vision and has_feeding) else (0.84 if has_sufficient_evidence else 0.65)

        return {
            "risk_score": final_score,
            "risk_level": risk_level,
            "category": category,
            "confidence": confidence,
            "has_sufficient_evidence": has_sufficient_evidence,
            "factors": factors,
            "evidence": {
                "temperature": temp if has_sensor else None,
                "baseline_temperature": baseline_temp,
                "temperature_deviation": round(temp_dev, 2) if has_sensor else None,
                "feeding_change": round(feed_change, 1) if has_behavior else None,
                "activity_change": round(activity_change, 1) if has_behavior else None,
                "visual_anomalies_count": len(vision_indicators),
                "feeding_status": feeding_status or "NOT_EVALUATED",
                "summary": f"Multi-agent synthesis categorized subject as {category} with risk index {final_score}/100."
            }
        }
