"""Application entrypoint.

Run with:  uvicorn app.main:app --reload
Interactive docs at:  http://localhost:8000/docs
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .db import Base, engine
from .routers import foods, log, profile, weights

# Create tables on startup. For a single-user local app this is enough; swap in
# Alembic migrations if the schema starts evolving in production.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Calorie Tracker API", version="1.0.0")

# Vite dev server origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(profile.router)
app.include_router(foods.router)
app.include_router(log.router)
app.include_router(weights.router)


@app.get("/api/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
