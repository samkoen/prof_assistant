"""Réponses IA déterministes — aucun appel réseau."""

OPEN_EVAL_JSON = (
    '{"appreciation":"הגעת לעיקר.","score":1.5,"model_answer":"ArrayList is dynamic."}'
)
MODEL_ANSWER_TEXT = "מערך בגודל קבוע, ArrayList דינמי."
EXPLANATION_TEXT = "התשובה הנכונה היא האפשרות המסומנת."


async def fake_generate_text(prompt: str, *, system: str | None = None, **_kwargs) -> str:
    blob = f"{system or ''}\n{prompt}"
    if "Grade this open exam answer" in prompt or "Return JSON only" in blob:
        return OPEN_EVAL_JSON
    if "no JSON" in blob or "Write the correct model answer" in prompt:
        return MODEL_ANSWER_TEXT
    return EXPLANATION_TEXT


async def fake_generate_chat(_contents: list, **_kwargs) -> str:
    return EXPLANATION_TEXT


def install_ai_mocks(monkeypatch) -> None:
    targets = (
        "app.services.ai_client.generate_text",
        "app.services.ai_client.generate_chat",
        "app.services.open_answer_evaluation.generate_text",
        "app.services.ai_explanation.generate_text",
    )
    for target in targets:
        name = target.rsplit(".", 1)[-1]
        stub = fake_generate_chat if name == "generate_chat" else fake_generate_text
        monkeypatch.setattr(target, stub)
    monkeypatch.setattr(
        "app.services.email_delivery.deliver_html_email",
        lambda **_k: True,
    )
    monkeypatch.setattr("app.services.email.send_verification_email", _noop_email)


async def _noop_email(*_args, **_kwargs) -> bool:
    return True
