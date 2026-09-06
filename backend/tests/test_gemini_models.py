from app.config import Settings
from app.services.gemini_client import build_models_chain, resolve_gemini_primary


def test_teacher_primary_is_flash():
    primary = resolve_gemini_primary(
        for_generation=True,
        default_model="gemini-2.5-flash",
        teacher_model="",
        student_model="gemini-2.5-flash-lite",
    )
    assert primary == "gemini-2.5-flash"
    assert build_models_chain(primary, "gemini-2.5-flash-lite") == [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
    ]


def test_student_primary_is_flash_lite():
    primary = resolve_gemini_primary(
        for_generation=False,
        default_model="gemini-2.5-flash",
        teacher_model="",
        student_model="gemini-2.5-flash-lite",
    )
    assert primary == "gemini-2.5-flash-lite"
    assert build_models_chain(primary, "gemini-2.5-flash") == [
        "gemini-2.5-flash-lite",
        "gemini-2.5-flash",
    ]


def test_empty_student_model_uses_default():
    primary = resolve_gemini_primary(
        for_generation=False,
        default_model="gemini-2.5-flash",
        teacher_model="gemini-2.5-flash",
        student_model="",
    )
    assert primary == "gemini-2.5-flash"


def test_chain_skips_duplicate_primary():
    assert build_models_chain("gemini-2.5-flash", "gemini-2.5-flash,gemini-2.5-flash-lite") == [
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
    ]


def test_settings_split_teacher_student_models():
    settings = Settings(
        gemini_model="gemini-2.5-flash",
        gemini_model_teacher="",
        gemini_model_student="gemini-2.5-flash-lite",
        ai_provider="gemini",
        ai_provider_teacher="gemini",
        ai_provider_student="gemini",
    )
    assert settings.ai_provider_for(for_generation=True) == "gemini"
    assert settings.ai_provider_for(for_generation=False) == "gemini"
    assert settings.gemini_primary_model(for_generation=True) == "gemini-2.5-flash"
    assert settings.gemini_primary_model(for_generation=False) == "gemini-2.5-flash-lite"
