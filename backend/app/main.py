from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import (
    admin,
    ai_explanations,
    auth,
    catalog_courses,
    courses,
    exam_gemini_generation,
    exam_gemini_sources,
    exams,
    notifications,
    question_media,
    students_router,
    teacher_shares,
)

app = FastAPI(title=settings.app_name, version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api")
app.include_router(catalog_courses.router, prefix="/api")
app.include_router(courses.router, prefix="/api")
app.include_router(exams.router, prefix="/api")
app.include_router(exam_gemini_generation.router, prefix="/api")
app.include_router(exam_gemini_sources.router, prefix="/api")
app.include_router(question_media.router, prefix="/api")
app.include_router(ai_explanations.router, prefix="/api")
app.include_router(admin.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(students_router.router, prefix="/api")
app.include_router(teacher_shares.router, prefix="/api")


@app.get("/api/health")
async def health():
    return {"status": "ok", "app": settings.app_name}
