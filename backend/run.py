"""Point d'entrée dev — équivalent à: uvicorn app.main:app --reload

Usage (depuis backend/) :
  python run.py
"""
import uvicorn

from app.config import settings
from app.logging_config import configure_logging

if __name__ == "__main__":
    configure_logging()
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level=settings.log_level.strip().lower(),
    )
