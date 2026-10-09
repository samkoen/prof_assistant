"""Réglages métier des crédits : défauts du code, surcharge en base."""

from dataclasses import dataclass

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.billing import AiBillingSettings
from app.services.billing.constants import (
    CALLS_PER_TEACHER_CREDIT,
    STUDENT_AI,
    STUDENT_FREE_CREDITS,
    TEACHER_FREE_CREDITS,
    TEACHER_GENERATION,
)
from app.services.billing.packs import PACKS, CreditPack, pack_payload

EXPECTED_PACKS = {
    "student_20": STUDENT_AI,
    "student_60": STUDENT_AI,
    "teacher_5": TEACHER_GENERATION,
    "teacher_15": TEACHER_GENERATION,
}
SETTINGS_ROW_ID = 1


@dataclass(frozen=True)
class BillingConfig:
    student_free_credits: int
    teacher_free_credits: int
    calls_per_teacher_credit: int
    packs: tuple[CreditPack, ...]

    def free_for(self, product: str) -> int:
        if product == STUDENT_AI:
            return self.student_free_credits
        if product == TEACHER_GENERATION:
            return self.teacher_free_credits
        return 0

    def payloads_for(self, product: str | None = None) -> list[dict]:
        chosen = self.packs if product is None else tuple(p for p in self.packs if p.product == product)
        return [pack_payload(pack) for pack in chosen]


def default_config() -> BillingConfig:
    packs = tuple(PACKS[code] for code in EXPECTED_PACKS)
    return BillingConfig(
        STUDENT_FREE_CREDITS,
        TEACHER_FREE_CREDITS,
        CALLS_PER_TEACHER_CREDIT,
        packs,
    )


def _bounded(value: object, low: int, high: int) -> int:
    number = int(value)  # type: ignore[arg-type]
    if number < low or number > high:
        raise ValueError("out of range")
    return number


def _pack_price_ils(item: dict) -> int:
    if "price_ils" in item:
        return _bounded(item["price_ils"], 1, 100_000)
    return _bounded(int(item["amount_agorot"]) // 100, 1, 100_000)


def _one_pack(item: dict) -> CreditPack:
    code = str(item.get("code") or "")
    if code not in EXPECTED_PACKS:
        raise ValueError("unknown pack")
    if str(item.get("product") or EXPECTED_PACKS[code]) != EXPECTED_PACKS[code]:
        raise ValueError("pack product")
    credits = _bounded(item["credits"], 1, 10_000)
    return CreditPack(code, EXPECTED_PACKS[code], credits, _pack_price_ils(item) * 100)


def parse_packs(raw: list) -> tuple[CreditPack, ...]:
    by_code: dict[str, CreditPack] = {}
    for item in raw:
        pack = _one_pack(item)
        by_code[pack.code] = pack
    if set(by_code) != set(EXPECTED_PACKS):
        raise ValueError("packs")
    return tuple(by_code[code] for code in EXPECTED_PACKS)


def settings_from_payload(data: dict) -> BillingConfig:
    return BillingConfig(
        _bounded(data["student_free_credits"], 0, 1000),
        _bounded(data["teacher_free_credits"], 0, 1000),
        _bounded(data["calls_per_teacher_credit"], 1, 100),
        parse_packs(list(data["packs"])),
    )


def config_payload(config: BillingConfig) -> dict:
    return {
        "student_free_credits": config.student_free_credits,
        "teacher_free_credits": config.teacher_free_credits,
        "calls_per_teacher_credit": config.calls_per_teacher_credit,
        "packs": config.payloads_for(),
    }


def _config_from_row(row: AiBillingSettings) -> BillingConfig:
    return BillingConfig(
        row.student_free_credits,
        row.teacher_free_credits,
        row.calls_per_teacher_credit,
        parse_packs(list(row.packs or [])),
    )


async def get_billing_config(db: AsyncSession) -> BillingConfig:
    row = await db.get(AiBillingSettings, SETTINGS_ROW_ID)
    if row is None:
        return default_config()
    try:
        return _config_from_row(row)
    except (ValueError, KeyError, TypeError):
        return default_config()


def _apply_row(row: AiBillingSettings, config: BillingConfig) -> None:
    row.student_free_credits = config.student_free_credits
    row.teacher_free_credits = config.teacher_free_credits
    row.calls_per_teacher_credit = config.calls_per_teacher_credit
    row.packs = [
        {
            "code": pack.code,
            "product": pack.product,
            "credits": pack.credits,
            "amount_agorot": pack.amount_agorot,
        }
        for pack in config.packs
    ]


async def save_billing_settings(db: AsyncSession, data: dict) -> dict:
    config = settings_from_payload(data)
    row = await db.get(AiBillingSettings, SETTINGS_ROW_ID)
    if row is None:
        row = AiBillingSettings(id=SETTINGS_ROW_ID)
        db.add(row)
    _apply_row(row, config)
    await db.commit()
    return config_payload(config)
