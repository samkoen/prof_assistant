"""Catalogue des prompts IA — corps par défaut et règles non suppressibles."""

from dataclasses import dataclass


@dataclass(frozen=True)
class PromptSpec:
    key: str
    body: str
    required: tuple[str, ...]
    placeholders: tuple[str, ...]


PROMPT_SPECS: tuple[PromptSpec, ...] = (
    PromptSpec(
        key="output_language.he",
        body=(
            "Hebrew using Hebrew letters (א-ת). "
            "Do not romanize Hebrew (never write zlila, kol hakavod, bshvil). "
            "English technical terms (Array, ArrayList, int[]) are allowed. "
            "No Chinese, Japanese, or Cyrillic characters"
        ),
        required=("Hebrew letters", "zlila", "kol hakavod"),
        placeholders=(),
    ),
    PromptSpec(
        key="output_language.fr",
        body=(
            "French with correct accents. English technical terms are allowed. "
            "No Chinese, Japanese, or Cyrillic characters"
        ),
        required=("French",),
        placeholders=(),
    ),
    PromptSpec(
        key="output_language.en",
        body="English. No Chinese, Japanese, or Cyrillic characters",
        required=("English",),
        placeholders=(),
    ),
    PromptSpec(
        key="output_language.ru",
        body=(
            "Russian in Cyrillic script. English technical terms are allowed. "
            "No Chinese or Japanese characters"
        ),
        required=("Cyrillic",),
        placeholders=(),
    ),
    PromptSpec(
        key="open_eval.system",
        body=(
            "You grade open exam answers. Return JSON only. Text only, no tools. "
            "Do not invent facts. Write appreciation and model_answer in {language_rule}."
        ),
        required=("JSON", "{language_rule}"),
        placeholders=("language_rule",),
    ),
    PromptSpec(
        key="open_eval.strict_he",
        body=(
            "Previous output used Latin transliteration of Hebrew. "
            "This time write appreciation and model_answer with Hebrew letters (א-ת) only. "
            "Never write zlila, kol hakavod, or bshvil."
        ),
        required=("Hebrew letters", "zlila"),
        placeholders=(),
    ),
    PromptSpec(
        key="open_eval.user",
        body="""{strict_line}Grade this open exam answer.
Write appreciation and model_answer in {language_rule}.
Short encouraging feedback. Do not invent facts.
Max score: {max_points}

Question:
{question}

{model_block}Student answer:
{student}

Return JSON only:
{json_example}
score must be a number between 0 and {max_points}.
If a model answer was given, repeat it unchanged in model_answer.
""",
        required=("Return JSON only", "{question}", "{student}", "{max_points}"),
        placeholders=(
            "strict_line",
            "language_rule",
            "max_points",
            "question",
            "model_block",
            "student",
            "json_example",
        ),
    ),
    PromptSpec(
        key="open_model.system",
        body=(
            "You write a correct model answer for an open exam question. "
            "Write the answer in {language_rule}. Text only, no JSON, no tools, no preamble. "
            "Do not invent facts not implied by the question."
        ),
        required=("no JSON", "{language_rule}"),
        placeholders=("language_rule",),
    ),
    PromptSpec(
        key="open_model.user",
        body="""Write the correct model answer in {language_rule}.
Text only, no JSON, no preamble.

Question:
{question}""",
        required=("{language_rule}", "{question}"),
        placeholders=("language_rule", "question"),
    ),
    PromptSpec(
        key="explanation.system",
        body=(
            "You are a pedagogical assistant for a multiple-choice exam. "
            "Write the explanation in {language_rule}. Text only, no tools."
        ),
        required=("{language_rule}",),
        placeholders=("language_rule",),
    ),
    PromptSpec(
        key="explanation.user",
        body="""You are a learning assistant for a multiple-choice exam.
Write the explanation in {language_rule}.
- Explain why the correct answer(s) are correct, clearly and encouragingly.
- If the student was wrong, briefly explain why their choice was incorrect.
- Do not invent facts not present in the question or options.
- 6 to 10 sentences at most.

Question type: {type_label}

Question:
{question}

Options:
{options}

Correct answer: {correct}

Student's answer: {student}

Write the pedagogical explanation now.""",
        required=("{language_rule}", "{question}", "{options}", "{correct}", "{student}"),
        placeholders=("language_rule", "type_label", "question", "options", "correct", "student"),
    ),
    PromptSpec(
        key="generation.system",
        body=(
            "You generate exam questions in the exact format requested. "
            "Follow the output language specified in the user prompt. "
            "Reply as the Assistant only. Text only, no tools."
        ),
        required=("exact format",),
        placeholders=(),
    ),
    PromptSpec(
        key="generation.mandatory",
        body=(
            "Mandatory topic (teacher instructions): {combined}. "
            "If a course-material file is attached, that is what the student learned; "
            "if an exercises file is attached, that is a style/structure example. "
            "Do not drift away from the mandatory topic.\n"
        ),
        required=("{combined}",),
        placeholders=("combined",),
    ),
    PromptSpec(
        key="generation.user",
        body="""Generate exam questions.
{mandatory}
{title_line}Total {total} questions according to the series:

{series_blocks}
{sources_part}
{format_rules}
{tree_hint}
Start immediately with --- then Q1 — no preamble.""",
        required=("Generate exam questions.", "{series_blocks}", "{format_rules}"),
        placeholders=(
            "mandatory",
            "title_line",
            "total",
            "series_blocks",
            "sources_part",
            "format_rules",
            "tree_hint",
        ),
    ),
    PromptSpec(
        key="generation.refine",
        body="""Teacher update request:
{teacher_message}

Return the full question set in the required format (Q1 onward in sequence), not only the changes.
Required: A) B) C) D) only; for single choice exactly one option with * (* line after A) or * at the end of the correct option line).
{tree_line}""",
        required=("Teacher update request:", "{teacher_message}", "A) B) C) D)"),
        placeholders=("teacher_message", "tree_line"),
    ),
    PromptSpec(
        key="generation.batch",
        body="""
Now generate exactly {batch_count} more questions: {q_nums}.
- Continue the global numbering (start at Q{from_q}, not Q1 again).
- Different topics and angles from the questions already generated.
- Return only {q_nums} — do not return previous questions.
- Start immediately with --- then Q{from_q} — no preamble.{retry}
""",
        required=("Now generate exactly", "{from_q}", "{q_nums}"),
        placeholders=("batch_count", "q_nums", "from_q", "retry"),
    ),
    PromptSpec(
        key="generation.prior",
        body="""
Questions already generated — do not repeat topics, wording, or examples:
{prior_text}
""",
        required=("{prior_text}",),
        placeholders=("prior_text",),
    ),
    PromptSpec(
        key="generation.preview",
        body="""{title_line}Read the teacher instructions and sources. Write one line in Hebrew using Hebrew letters (א-ת), not Latin transliteration, exactly:
נושא מובן: <short sentence> · מקורות: <short list or «ללא»> · {total_questions} שאלות: <level/type briefly>

Teacher instructions:
{instructions}

Sources:
{sources}

No extra text — the line only.""",
        required=("Hebrew letters", "{instructions}", "{total_questions}"),
        placeholders=("title_line", "total_questions", "instructions", "sources"),
    ),
    PromptSpec(
        key="generation.sources_intro",
        body="""Teacher source materials — respect the role of each source:

- Course-material file: this is the knowledge the student learned. Questions must be grounded in it.
- Exercises file: these are sample questions (style/structure/level). Create new questions of the same kind — do not copy.

Teacher instructions define the focus; sources provide the base and examples.

{body}

---
""",
        required=("{body}", "Course-material file"),
        placeholders=("body",),
    ),
)

_SPECS_BY_KEY = {spec.key: spec for spec in PROMPT_SPECS}


def get_prompt_spec(key: str) -> PromptSpec | None:
    return _SPECS_BY_KEY.get(key)


def default_prompt_body(key: str) -> str:
    spec = get_prompt_spec(key)
    return spec.body if spec else ""
