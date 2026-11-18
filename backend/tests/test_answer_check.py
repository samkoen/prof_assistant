"""Double vérification des réponses générées : lecture des marques, solutions, verdicts."""

import pytest

from app.services import gemini_answer_check as check
from app.services.ai_client import AiError
from app.services.gemini_client import _chat_body
from app.services.qcm_answer_marks import parse_choice_block, parse_choice_blocks
from app.services.qcm_solutions import strip_solutions

RAW = """---
Q1 [single] (1 pt)
מהי מורכבות החיפוש הבינארי?
Solution: בכל צעד הטווח נחצה, לכן log n.
A) O(1)
B) O(log n) *
C) O(n)
D) O(n log n)
---
Q2 [multiple] (2 pt)
מה מחזירה הפונקציה?
```
def f(x):
    return x * 2
```
Solution: f(3) = 6
A)
*
6
B) 5
C) 3 ✓
---
Q3 [single] (1 pt)
מחסנית עובדת לפי
Solution: מחסנית היא LIFO.
A) FIFO
B) LIFO *
---
Q4 [open] (2 pt)
הסבירו חיפוש בינארי."""


def test_strip_solutions_removes_lines_and_keeps_them_by_question():
    clean, solutions = strip_solutions(RAW)
    assert "Solution:" not in clean
    assert solutions[1] == "בכל צעד הטווח נחצה, לכן log n."
    assert solutions[2] == "f(3) = 6"
    assert 4 not in solutions
    assert clean.startswith("---\nQ1")


def test_strip_solutions_leaves_raw_untouched_without_solutions():
    raw = "---\nQ1 [single] (1 pt)\nשאלה\nA) כן *\nB) לא"
    assert strip_solutions(raw) == (raw, {})


def test_parse_choice_blocks_reads_all_mark_styles():
    clean, _ = strip_solutions(RAW)
    blocks = parse_choice_blocks(clean)
    assert [b.q_num for b in blocks] == [1, 2, 3]  # la question ouverte est ignorée
    assert blocks[0].correct_letters == ("B",)
    assert blocks[1].correct_letters == ("A", "C")
    assert blocks[1].options[0].text == "6"
    assert blocks[2].question_type == "single"
    assert blocks[2].correct_letters == ("B",)


def test_bold_text_is_not_a_mark():
    block = parse_choice_block("Q1 [single] (1 pt)\nשאלה\nA) **מודגש**\nB) אחר *")
    assert block is not None and block.correct_letters == ("B",)


def test_verify_prompt_hides_the_marked_answers():
    clean, _ = strip_solutions(RAW)
    prompt = check.build_verify_prompt(parse_choice_blocks(clean), code_tool=True)
    assert "O(log n) *" not in prompt and "✓" not in prompt
    assert "Q2 [multiple] [compute]" in prompt
    assert "run Python code" in prompt
    assert "written in Hebrew" in prompt


def test_parse_verdicts_reads_letters_and_unknown():
    text = "Q1: A | first guess\nthinking...\nQ1: B | log n\n**Q2**: a, c | f(3)=6\nQ3: ? | ambiguous\nnoise"
    verdicts = check.parse_verdicts(text)
    assert verdicts[1] == (["B"], "log n")
    assert verdicts[2] == (["A", "C"], "f(3)=6")
    assert verdicts[3] == ([], "ambiguous")


def test_compare_answers_flags_mismatch_and_missing():
    clean, solutions = strip_solutions(RAW)
    blocks = parse_choice_blocks(clean)
    verdicts = {1: (["B"], "ok"), 2: (["A"], "only 6")}
    checks = check.compare_answers(blocks, verdicts, solutions, computed={2})
    status = {c.q_num: c.status for c in checks}
    assert status == {1: "verified", 2: "mismatch", 3: "unchecked"}
    q2 = checks[1]
    assert (q2.generated, q2.checked, q2.computed) == (["A", "C"], ["A"], True)
    assert checks[0].computed is False


def test_needs_computation_detects_code_and_numeric_structures():
    code = parse_choice_block("Q1 [single]\nמה יחזיר f?\n```\nreturn 1\n```\nA) 1 *\nB) 2")
    avl = parse_choice_block("Q1 [single]\nמכניסים 10, 20, 30 לעץ AVL. מה השורש?\nA) 20 *\nB) 10")
    theory = parse_choice_block("Q1 [single]\nמהי מחסנית?\nA) LIFO *\nB) FIFO")
    assert check.needs_computation(code) and check.needs_computation(avl)
    assert not check.needs_computation(theory)


@pytest.mark.asyncio
async def test_check_answers_runs_code_only_for_computation_questions(monkeypatch):
    calls = []

    async def fake(prompt: str, *, system: str, code_execution: bool):
        calls.append((code_execution, prompt))
        if code_execution:
            return "Q2: A, C | ran f(3)", True
        return "Q1: B | ok\nQ3: A | stack is LIFO? no", False

    monkeypatch.setattr(check, "generate_verification", fake)
    clean, solutions = strip_solutions(RAW)
    checks = await check.check_answers(clean, solutions)
    by_tool = {tool: prompt for tool, prompt in calls}
    assert "Q2 [multiple]" in by_tool[True] and "Q1 [single]" not in by_tool[True]
    assert "Q1 [single]" in by_tool[False] and "Q2 [multiple]" not in by_tool[False]
    assert [c.status for c in checks] == ["verified", "verified", "mismatch"]
    assert [c.computed for c in checks] == [False, True, False]


@pytest.mark.asyncio
async def test_computed_flag_requires_code_to_actually_run(monkeypatch):
    async def fake(prompt: str, *, system: str, code_execution: bool):
        return "Q1: B | ok\nQ2: A, C | guessed\nQ3: B | ok", False

    monkeypatch.setattr(check, "generate_verification", fake)
    clean, solutions = strip_solutions(RAW)
    checks = await check.check_answers(clean, solutions)
    assert not any(c.computed for c in checks)


@pytest.mark.asyncio
async def test_check_answers_never_fails_generation(monkeypatch):
    async def boom(*_a, **_k):
        raise AiError("down")

    monkeypatch.setattr(check, "generate_verification", boom)
    clean, solutions = strip_solutions(RAW)
    checks = await check.check_answers(clean, solutions)
    assert {c.status for c in checks} == {"unchecked"}


@pytest.mark.asyncio
async def test_check_answers_can_be_disabled(monkeypatch):
    monkeypatch.setattr(check.settings, "answer_check_enabled", False)
    clean, solutions = strip_solutions(RAW)
    checks = await check.check_answers(clean, solutions)
    assert {c.status for c in checks} == {"unchecked"}


def test_ran_code_reads_execution_parts():
    from app.services.gemini_client import ran_code

    payload = {"candidates": [{"content": {"parts": [{"text": "x"}, {"codeExecutionResult": {"output": "10"}}]}}]}
    assert ran_code(payload) is True
    assert ran_code({"candidates": [{"content": {"parts": [{"text": "x"}]}}]}) is False


def test_gemini_body_enables_code_execution_and_thinking():
    body = _chat_body([{"role": "user", "parts": [{"text": "x"}]}], max_output_tokens=10, thinking_budget=4096, code_execution=True)
    assert body["tools"] == [{"code_execution": {}}]
    assert body["generationConfig"]["thinkingConfig"] == {"thinkingBudget": 4096}
    plain = _chat_body([{"role": "user", "parts": [{"text": "x"}]}], max_output_tokens=10)
    assert "tools" not in plain
