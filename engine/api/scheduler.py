from apscheduler.schedulers.background import BackgroundScheduler
import logging

# Optional: Helps you see scheduler logs in console
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("JupiterScheduler")

scheduler = BackgroundScheduler()

# ---- Placeholder Job Functions (these will call ENGINE_MASTER later) ---- #

def run_signals_job():
    logger.info("Scheduled: Running Signals Engine")

def run_risk_job():
    logger.info("Scheduled: Running Risk Engine")

def run_insights_job():
    logger.info("Scheduled: Running Insights Engine")

def run_growth_job():
    logger.info("Scheduled: Running Growth Engine")

def run_discovery_job():
    logger.info("Scheduled: Running Discovery Engine")

def run_portfolio_job():
    logger.info("Scheduled: Refreshing Portfolio Engine")

# ---- Scheduler Setup ---- #

def start_scheduler():
    logger.info("Starting Jupiter Scheduler...")

    # Run signals every 60 seconds
    scheduler.add_job(run_signals_job, "interval", seconds=60)

    # Run risk every 2 minutes
    scheduler.add_job(run_risk_job, "interval", minutes=2)

    # Run insights every 3 minutes
    scheduler.add_job(run_insights_job, "interval", minutes=3)

    # Run growth every 5 minutes
    scheduler.add_job(run_growth_job, "interval", minutes=5)

    # Run discovery every 4 minutes
    scheduler.add_job(run_discovery_job, "interval", minutes=4)

    # Refresh portfolio every 10 minutes
    scheduler.add_job(run_portfolio_job, "interval", minutes=10)

    scheduler.start()
    logger.info("Jupiter Scheduler Started Successfully")

