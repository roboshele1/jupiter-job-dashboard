from fastapi import APIRouter
from typing import Dict

router = APIRouter()

discovery_state = {
    "top": [],
    "movers": [],
    "themes": [],
    "message": "Discovery engine not executed"
}

@router.get("/top")
def get_top_discoveries() -> Dict:
    """
    Returns top discovery tickers or opportunities.
    """
    return {
        "status": "success",
        "top": discovery_state["top"]
    }

@router.get("/movers")
def get_market_movers() -> Dict:
    """
    Returns unusual market movers.
    """
    return {
        "status": "success",
        "movers": discovery_state["movers"]
    }

@router.get("/themes")
def get_themes() -> Dict:
    """
    Returns thematic market groupings or clusters.
    """
    return {
        "status": "success",
        "themes": discovery_state["themes"]
    }

@router.post("/run")
def run_discovery_engine() -> Dict:
    """
    Executes the discovery engine. Placeholder for ENGINE_MASTER integration.
    """
    # Placeholder logic
    discovery_state["top"] = ["APLD", "SMCI", "TSLA"]
    discovery_state["movers"] = ["UPST", "AFRM", "SOFI"]
    discovery_state["themes"] = ["AI", "Cloud", "Semiconductors"]
    discovery_state["message"] = "Discovery results updated"

    return {
        "status": "success",
        "details": discovery_state
    }

