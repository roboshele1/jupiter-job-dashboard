from fastapi import APIRouter
from typing import Dict

router = APIRouter()

risk_state = {
    "score": None,
    "position_risk": {},
    "portfolio_risk": {},
    "message": "Risk not calculated"
}

@router.get("/score")
def get_risk_score() -> Dict:
    """
    Returns the overall portfolio risk score.
    """
    return {
        "status": "success",
        "score": risk_state["score"]
    }

@router.get("/position_risk")
def get_position_risk() -> Dict:
    """
    Returns per-position risk metrics.
    """
    return {
        "status": "success",
        "position_risk": risk_state["position_risk"]
    }

@router.get("/portfolio_risk")
def get_portfolio_risk() -> Dict:
    """
    Returns overall portfolio risk metrics.
    """
    return {
        "status": "success",
        "portfolio_risk": risk_state["portfolio_risk"]
    }

@router.post("/run")
def run_risk_engine() -> Dict:
    """
    Executes the risk engine. Placeholder for ENGINE_MASTER integration.
    """
    # Placeholder values
    risk_state["score"] = 42  # Example risk score placeholder
    risk_state["position_risk"] = {"AAPL": 0.12, "MSFT": 0.08}
    risk_state["portfolio_risk"] = {"volatility": 0.15, "beta": 1.2}
    risk_state["message"] = "Risk calculated"

    return {
        "status": "success",
        "details": risk_state
    }

