from fastapi import APIRouter
from typing import Dict

router = APIRouter()

insights_state = {
    "latest": {},
    "key_drivers": [],
    "message": "Insights not generated"
}

@router.get("/latest")
def get_latest_insights() -> Dict:
    """
    Returns the latest insights package.
    """
    return {
        "status": "success",
        "insights": insights_state["latest"]
    }

@router.get("/key_drivers")
def get_key_drivers() -> Dict:
    """
    Returns the current key drivers.
    """
    return {
        "status": "success",
        "drivers": insights_state["key_drivers"]
    }

@router.post("/run")
def run_insights_engine() -> Dict:
    """
    Executes insights engine. Placeholder for ENGINE_MASTER integration.
    """
    # Placeholder logic
    insights_state["latest"] = {"trend": "bullish", "strength": 0.78}
    insights_state["key_drivers"] = ["market sentiment", "volume spikes"]
    insights_state["message"] = "Insights calculated"

    return {
        "status": "success",
        "details": insights_state
    }

