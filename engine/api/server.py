from fastapi import FastAPI

# Route Imports
from routes.warm_start import router as warm_start_router
from routes.bundle import router as bundle_router
from routes.signals import router as signals_router
from routes.risk import router as risk_router
from routes.insights import router as insights_router
from routes.growth import router as growth_router
from routes.discovery import router as discovery_router
from routes.portfolio import router as portfolio_router

# Scheduler Import
from scheduler import start_scheduler

# FastAPI App Definition
app = FastAPI(
    title="Jupiter Engine API",
    version="1.0",
    description="Backend engine for the JUPITER financial terminal."
)

# Start Background Scheduler
start_scheduler()

# Route Registration
app.include_router(warm_start_router, prefix="/warm_start")
app.include_router(bundle_router, prefix="/bundle")
app.include_router(signals_router, prefix="/signals")
app.include_router(risk_router, prefix="/risk")
app.include_router(insights_router, prefix="/insights")
app.include_router(growth_router, prefix="/growth")
app.include_router(discovery_router, prefix="/discovery")
app.include_router(portfolio_router, prefix="/portfolio")

