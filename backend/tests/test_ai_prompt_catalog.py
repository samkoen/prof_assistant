from app.services.ai_prompt_defaults import get_prompt_spec
from app.services.ai_prompt_render import missing_required_snippets, render_prompt
from app.services.ai_prompt_store import get_prompt_body, override_prompt_cache
from app.services.open_answer_prompt import (
    build_evaluation_prompt,
    evaluation_system_prompt,
    model_answer_system_prompt,
)


def setup_function() -> None:
    override_prompt_cache(None)


def teardown_function() -> None:
    override_prompt_cache(None)


def test_render_prompt_does_not_rescan_student_text():
    body = "Q:{question}\nS:{student}"
    student = "see {question} in the book"
    out = render_prompt(body, {"question": "heaps", "student": student})
    assert out == "Q:heaps\nS:see {question} in the book"


def test_missing_required_snippets():
    spec = get_prompt_spec("open_eval.user")
    assert spec is not None
    missing = missing_required_snippets("hello", spec.required)
    assert "{question}" in missing
    assert "Return JSON only" in missing


def test_evaluation_uses_overridden_template():
    override_prompt_cache(
        {
            "open_eval.user": "CUSTOM {question} || {student} || {max_points}\nReturn JSON only\n",
        }
    )
    prompt = build_evaluation_prompt("שאלה", "תשובה", 2.0, "he", model_answer=None)
    assert prompt.startswith("CUSTOM שאלה")
    assert "תשובה" in prompt
    assert "2" in prompt


def test_system_prompt_uses_language_rule_from_catalog():
    override_prompt_cache({"output_language.he": "HE-RULE-TEST"})
    system = evaluation_system_prompt("he")
    assert "HE-RULE-TEST" in system


def test_model_answer_system_uses_catalog_not_eval():
    override_prompt_cache({"open_model.system": "MODEL-SYS {language_rule} no JSON"})
    system = model_answer_system_prompt("he")
    assert system.startswith("MODEL-SYS")
    assert "JSON only" not in system
    assert "grade open exam answers" not in system.lower()


def test_default_catalog_covers_all_builders():
    assert get_prompt_body("generation.user").startswith("Generate exam questions.")
    assert "{series_blocks}" in get_prompt_body("generation.user")
    spec = get_prompt_spec("output_language.he")
    assert spec is not None
    assert "zlila" in spec.body
