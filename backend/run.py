"""Point d'entrée dev — équivalent à: uvicorn app.main:app --reload

Usage (depuis backend/) :
  python run.py
"""
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
    )
