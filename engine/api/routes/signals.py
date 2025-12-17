from fastapi import APIRouter
from typing import Dict

router = APIRouter()

signals_state = {
    "latest": {},
    "history": [],
    "message": "Signals not generated"
}

@router.get("/latest")
def get_latest_signals() -> Dict:
    """
    Returns the latest generated signals.
    """
    return {
        "status": "success",
        "signals": signals_state["latest"]
    }

@router.get("/history")
def get_signal_history() -> Dict:
    """
    Returns the historical signal set.
    """
    return {
        "status": "success",
        "history": signals_state["history"]
    }

@router.post("/run")
def run_signal_engine() -> Dict:
    """
    Executes the signal engine. Placeholder for ENGINE_MASTER integration.
    """
    # Placeholder logic
    signals_state["latest"] = {"example": "signal"}
    signals_state["history"].append(signals_state["latest"])
    signals_state["message"] = "Signals updated"

    return {
        "status": "success",
        "details": signals_state
    }

