"""Examen en deux parties : consigne, « 2 questions sur 3 », plafond de note."""

import pytest
from httpx import AsyncClient

from tests.integration.conftest import ItEnv
from tests.integration.exam_flow import (
    activate_exam,
    create_draft_exam,
    enroll_student,
    exam_token_headers,
    student_review,
    student_start_exam,
    teacher_catalog_and_offering,
)
from tests.integration.http_helpers import json_ok, login, logout
from tests.integration.seed import STUDENT_EMAIL, TEACHER_EMAIL

INSTRUCTIONS = "חלק א': שאלה פתוחה.\nחלק ב': יש לענות על 2 מתוך 3 שאלות."


async def _add_section(client: AsyncClient, exam_id: int, title: str, required: int | None = None) -> dict:
    body = {"title": title, "instructions": f"הוראות {title}", "required_count": required}
    return await json_ok(await client.post(f"/api/exams/{exam_id}/sections", json=body))


async def _add_qcm(client: AsyncClient, exam_id: int, section_id: int, points: float) -> dict:
    question = await json_ok(
        await client.post(
            f"/api/exams/{exam_id}/questions",
            json={
                "text": "מה הפלט?",
                "question_type": "single",
                "points": points,
                "section_id": section_id,
                "options": [
                    {"text": "4 3 5", "is_correct": True, "order_index": 0},
                    {"text": "4 4 5", "is_correct": False, "order_index": 1},
                ],
            },
        )
    )
    correct = next(o["id"] for o in question["options"] if o["is_correct"])
    return {"id": question["id"], "correct": correct}


async def _build_exam(it_env: ItEnv) -> dict:
    client = it_env.client
    await login(client, TEACHER_EMAIL)
    catalog_id, offering_id = await teacher_catalog_and_offering(client)
    exam = await create_draft_exam(client, catalog_id, offering_id, title="מבחן אמצע")
    exam_id = exam["id"]
    await json_ok(
        await client.patch(f"/api/exams/{exam_id}", json={"description": INSTRUCTIONS, "score_cap": 20})
    )
    part_a = await _add_section(client, exam_id, "חלק א'")
    part_b = await _add_section(client, exam_id, "חלק ב'", required=2)
    open_q = await json_ok(
        await client.post(
            f"/api/exams/{exam_id}/questions",
            json={"text": "כתבו פונקציה", "question_type": "open", "points": 8, "section_id": part_a["id"], "options": []},
        )
    )
    qcms = [await _add_qcm(client, exam_id, part_b["id"], 7) for _ in range(3)]
    await enroll_student(client, offering_id, it_env.users.student_id)
    session = await activate_exam(client, exam_id, offering_id)
    await logout(client)
    return {
        "exam_id": exam_id,
        "session_id": session["id"],
        "part_a": part_a["id"],
        "part_b": part_b["id"],
        "open_id": open_q["id"],
        "qcms": qcms,
    }


@pytest.mark.integration
async def test_student_paper_carries_instructions_and_sections(it_env: ItEnv):
    ctx = await _build_exam(it_env)
    await login(it_env.client, STUDENT_EMAIL)
    take = await student_start_exam(it_env.client, ctx["session_id"])
    assert take["description"] == INSTRUCTIONS
    assert take["score_cap"] == 20
    assert [s["title"] for s in take["sections"]] == ["חלק א'", "חלק ב'"]
    assert take["sections"][1]["required_count"] == 2
    assert [q["section_id"] for q in take["questions"]] == [ctx["part_a"]] + [ctx["part_b"]] * 3


@pytest.mark.integration
async def test_only_required_answers_are_graded_and_score_is_capped(it_env: ItEnv):
    ctx = await _build_exam(it_env)
    client = it_env.client
    await login(client, STUDENT_EMAIL)
    await student_start_exam(client, ctx["session_id"])
    answers = [
        {"question_id": q["id"], "selected_option_ids": [q["correct"]], "text_answer": None}
        for q in ctx["qcms"]
    ]
    attempt = await json_ok(
        await client.post(
            f"/api/exams/sessions/{ctx['session_id']}/submit",
            headers=exam_token_headers(ctx["session_id"]),
            json={"answers": answers},
        )
    )
    # 8 (ouverte) + 2 × 7 = 22 points possibles, plafonnés à 20 ; 3 QCM justes → seuls 2 comptent.
    assert attempt["max_score"] == 20
    assert attempt["score"] == 14
    review = await student_review(client, ctx["session_id"])
    counted = {row["id"]: row["counted"] for row in review["questions"]}
    assert counted[ctx["qcms"][0]["id"]] is True
    assert counted[ctx["qcms"][1]["id"]] is True
    assert counted[ctx["qcms"][2]["id"]] is False
    assert [s["title"] for s in review["sections"]] == ["חלק א'", "חלק ב'"]


@pytest.mark.integration
async def test_deleting_section_keeps_its_questions(it_env: ItEnv):
    client = it_env.client
    await login(client, TEACHER_EMAIL)
    catalog_id, offering_id = await teacher_catalog_and_offering(client)
    exam = await create_draft_exam(client, catalog_id, offering_id)
    section = await _add_section(client, exam["id"], "חלק א'", required=1)
    await _add_qcm(client, exam["id"], section["id"], 5)
    response = await client.delete(f"/api/exams/{exam['id']}/sections/{section['id']}")
    assert response.status_code == 204
    detail = await json_ok(await client.get(f"/api/exams/{exam['id']}"))
    assert detail["sections"] == []
    assert [q["section_id"] for q in detail["questions"]] == [None]


@pytest.mark.integration
async def test_question_cannot_join_section_of_another_exam(it_env: ItEnv):
    client = it_env.client
    await login(client, TEACHER_EMAIL)
    catalog_id, offering_id = await teacher_catalog_and_offering(client)
    first = await create_draft_exam(client, catalog_id, offering_id, title="א")
    second = await create_draft_exam(client, catalog_id, offering_id, title="ב")
    foreign = await _add_section(client, first["id"], "חלק א'")
    response = await client.post(
        f"/api/exams/{second['id']}/questions",
        json={"text": "שאלה", "question_type": "open", "points": 1, "section_id": foreign["id"], "options": []},
    )
    assert response.status_code == 404


@pytest.mark.integration
async def test_duplicate_exam_copies_sections_and_cap(it_env: ItEnv):
    ctx = await _build_exam(it_env)
    client = it_env.client
    await login(client, TEACHER_EMAIL)
    copy = await json_ok(await client.post(f"/api/exams/{ctx['exam_id']}/duplicate", json={}))
    detail = await json_ok(await client.get(f"/api/exams/{copy['id']}"))
    assert detail["score_cap"] == 20
    assert [s["required_count"] for s in detail["sections"]] == [None, 2]
    new_ids = {s["id"] for s in detail["sections"]}
    assert new_ids.isdisjoint({ctx["part_a"], ctx["part_b"]})
    assert {q["section_id"] for q in detail["questions"]} == new_ids


@pytest.mark.integration
async def test_assign_questions_moves_them_between_sections(it_env: ItEnv):
    client = it_env.client
    await login(client, TEACHER_EMAIL)
    catalog_id, offering_id = await teacher_catalog_and_offering(client)
    exam = await create_draft_exam(client, catalog_id, offering_id)
    first = await _add_section(client, exam["id"], "חלק א'")
    second = await _add_section(client, exam["id"], "חלק ב'", required=1)
    question = await _add_qcm(client, exam["id"], first["id"], 5)
    response = await client.put(
        f"/api/exams/{exam['id']}/sections/assign",
        json={"question_ids": [question["id"]], "section_id": second["id"]},
    )
    assert response.status_code == 204
    detail = await json_ok(await client.get(f"/api/exams/{exam['id']}"))
    assert detail["questions"][0]["section_id"] == second["id"]
