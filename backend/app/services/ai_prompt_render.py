"""Substitution de placeholders {name} dans les templates de prompts."""


def render_prompt(body: str, values: dict[str, object]) -> str:
    """Remplace {key} sans réinterpréter le contenu déjà injecté (réponse élève, etc.)."""
    sentinels = {key: f"\x00PROMPT_{key}\x00" for key in values}
    out = body
    for key, token in sentinels.items():
        out = out.replace("{" + key + "}", token)
    for key, token in sentinels.items():
        out = out.replace(token, str(values[key]))
    return out


def missing_required_snippets(body: str, required: tuple[str, ...]) -> list[str]:
    return [item for item in required if item not in body]
