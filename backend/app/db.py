"""Database engine and session management.

Uses a synchronous SQLAlchemy engine with SQLite for zero-config local
development. Endpoints are defined with plain ``def`` (not ``async def``) so
FastAPI runs them in its threadpool — this keeps the sync DB driver off the
event loop instead of blocking it, which is the safe way to pair a sync ORM
with FastAPI.
"""

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session, sessionmaker

# A file-backed SQLite DB lives next to the backend. check_same_thread=False is
# required because FastAPI's threadpool may touch the connection from different
# threads across requests.
SQLALCHEMY_DATABASE_URL = "sqlite:///./calorie_tracker.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """Declarative base for all ORM models."""


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that yields a session and always closes it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
