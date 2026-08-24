from httpx import AsyncClient

from tests.integration.http_helpers import json_ok, login, logout
from tests.integration.seed import STUDENT_EMAIL, TEACHER_EMAIL


async def teacher_catalog_and_offering(client: AsyncClient) -> tuple[int, int]:
    catalog = await json_ok(
        await client.post("/api/catalog-courses", json={"name": "מבני נתונים"})
    )
    offering = await json_ok(
        await client.post(
            "/api/courses",
            json={
                "catalog_course_id": catalog["id"],
                "group_name": "א",
                "academic_year": 2026,
                "semester": 1,
            },
        )
    )
    return catalog["id"], offering["id"]


async def create_draft_exam(
    client: AsyncClient, catalog_id: int, offering_id: int | None = None, title: str = "מבחן IT"
) -> dict:
    payload: dict = {
        "catalog_course_id": catalog_id,
        "title": title,
        "shuffle_questions": False,
        "shuffle_options": False,
    }
    if offering_id is not None:
        payload["offering_id"] = offering_id
    return await json_ok(await client.post("/api/exams", json=payload))


async def add_single_question(client: AsyncClient, exam_id: int) -> dict:
    question = await json_ok(
        await client.post(
            f"/api/exams/{exam_id}/questions",
            json={
                "text": "כמה זה 2+2?",
                "question_type": "single",
                "points": 1,
                "options": [
                    {"text": "3", "is_correct": False, "order_index": 0},
                    {"text": "4", "is_correct": True, "order_index": 1},
                ],
            },
        )
    )
    correct = next(opt for opt in question["options"] if opt["is_correct"])
    return {"question_id": question["id"], "correct_option_id": correct["id"]}


async def add_open_question(client: AsyncClient, exam_id: int) -> int:
    question = await json_ok(
        await client.post(
            f"/api/exams/{exam_id}/questions",
            json={
                "text": "מה ההבדל בין מערך ל-ArrayList?",
                "question_type": "open",
                "points": 2,
                "options": [],
            },
        )
    )
    return question["id"]


async def activate_exam(client: AsyncClient, exam_id: int, offering_id: int) -> dict:
    return await json_ok(
        await client.post(f"/api/exams/{exam_id}/activate", json={"offering_id": offering_id})
    )


async def teacher_open_exam(client: AsyncClient, catalog_id: int, offering_id: int) -> dict:
    exam = await create_draft_exam(client, catalog_id, offering_id, title="מבחן פתוח IT")
    question_id = await add_open_question(client, exam["id"])
    session = await activate_exam(client, exam["id"], offering_id)
    return {"exam_id": exam["id"], "question_id": question_id, "session_id": session["id"]}


async def enroll_student(client: AsyncClient, offering_id: int, student_id: int) -> None:
    await json_ok(
        await client.post(
            f"/api/courses/{offering_id}/enrollments",
            json={"student_id": student_id},
        )
    )


async def student_submit_open(
    client: AsyncClient, session_id: int, question_id: int, text: str
) -> None:
    await json_ok(await client.post(f"/api/exams/sessions/{session_id}/open"))
    await json_ok(
        await client.post(
            f"/api/exams/sessions/{session_id}/submit",
            json={
                "answers": [
                    {
                        "question_id": question_id,
                        "selected_option_ids": [],
                        "text_answer": text,
                    }
                ]
            },
        )
    )


async def student_start_exam(client: AsyncClient, session_id: int) -> dict:
    await json_ok(await client.post(f"/api/exams/sessions/{session_id}/open"))
    return await json_ok(await client.get(f"/api/exams/sessions/{session_id}/take"))


async def student_submit_qcm(client: AsyncClient, session_id: int, question_id: int, option_id: int) -> dict:
    return await json_ok(
        await client.post(
            f"/api/exams/sessions/{session_id}/submit",
            json={
                "answers": [
                    {"question_id": question_id, "selected_option_ids": [option_id], "text_answer": None}
                ]
            },
        )
    )


async def student_review(client: AsyncClient, session_id: int) -> dict:
    return await json_ok(await client.get(f"/api/exams/sessions/{session_id}/review"))


async def prepared_qcm_session(client: AsyncClient, student_id: int, classmate_id: int) -> dict:
    """Deux élèves inscrits : la soumission ne publie pas toute seule."""
    await login(client, TEACHER_EMAIL)
    catalog_id, offering_id = await teacher_catalog_and_offering(client)
    exam = await create_draft_exam(client, catalog_id, offering_id, title="מבחן QCM")
    qcm = await add_single_question(client, exam["id"])
    await enroll_student(client, offering_id, student_id)
    await enroll_student(client, offering_id, classmate_id)
    session = await activate_exam(client, exam["id"], offering_id)
    await logout(client)
    return {
        "exam_id": exam["id"],
        "offering_id": offering_id,
        "session_id": session["id"],
        **qcm,
    }


async def published_open_attempt(client: AsyncClient, student_id: int) -> dict:
    """Un seul élève inscrit : la soumission publie déjà les résultats."""
    await login(client, TEACHER_EMAIL)
    catalog_id, offering_id = await teacher_catalog_and_offering(client)
    exam = await teacher_open_exam(client, catalog_id, offering_id)
    await enroll_student(client, offering_id, student_id)
    await logout(client)
    await login(client, STUDENT_EMAIL)
    await student_submit_open(client, exam["session_id"], exam["question_id"], "מערך קבוע")
    await logout(client)
    return exam
