from enum import Enum

class RiskLevel(str, Enum):
    LOW = "LOW"
    MODERATE = "MODERATE"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AnimalStatus(str, Enum):
    HEALTHY = "Healthy"
    UNDER_OBSERVATION = "Under Observation"
    HIGH_RISK = "High Risk"
    CRITICAL = "Critical"
    QUARANTINED = "Quarantined"
    RECOVERED = "Recovered"

class AlertSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AlertStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"

class SampleType(str, Enum):
    BODY = "body"
    MANURE_CLOSEUP = "manure_closeup"
    URINE_SAMPLE = "urine_sample"

class ScreeningStatus(str, Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class AppetiteChange(str, Enum):
    NORMAL = "NORMAL"
    SLIGHT_DECREASE = "SLIGHT_DECREASE"
    MODERATE_DECREASE = "MODERATE_DECREASE"
    REFUSING_FOOD = "REFUSING_FOOD"
    INCREASED = "INCREASED"
    UNKNOWN = "UNKNOWN"

class WaterConsumption(str, Enum):
    NORMAL = "NORMAL"
    INCREASED = "INCREASED"
    DECREASED = "DECREASED"
    NOT_OBSERVED = "NOT_OBSERVED"

class OnsetTiming(str, Enum):
    TODAY = "TODAY"
    PAST_24H = "PAST_24H"
    PAST_48H = "PAST_48H"
    OVER_3_DAYS = "OVER_3_DAYS"
    UNKNOWN = "UNKNOWN"
