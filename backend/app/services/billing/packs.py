"""Packs PayMe : crédits métier, prix TTC en agorot."""

from dataclasses import dataclass

from fastapi import HTTPException

from app.services.billing.constants import STUDENT_AI, TEACHER_GENERATION


@dataclass(frozen=True)
class CreditPack:
    code: str
    product: str
    credits: int
    amount_agorot: int

    @property
    def price_ils(self) -> int:
        return self.amount_agorot // 100


PACKS: dict[str, CreditPack] = {
    "student_20": CreditPack("student_20", STUDENT_AI, 20, 1900),
    "student_60": CreditPack("student_60", STUDENT_AI, 60, 4500),
    "teacher_5": CreditPack("teacher_5", TEACHER_GENERATION, 5, 2900),
    "teacher_15": CreditPack("teacher_15", TEACHER_GENERATION, 15, 6900),
}


def pack_label(pack: CreditPack) -> str:
    return f"{pack.credits} קרדיטים — {pack.price_ils} ₪"


def pack_payload(pack: CreditPack) -> dict:
    return {
        "code": pack.code,
        "product": pack.product,
        "credits": pack.credits,
        "price_ils": pack.price_ils,
        "label": pack_label(pack),
    }


def packs_for(product: str) -> list[dict]:
    return [pack_payload(pack) for pack in PACKS.values() if pack.product == product]


def require_pack_for_role(
    code: str,
    role: str,
    packs: tuple[CreditPack, ...] | None = None,
) -> CreditPack:
    catalog = {pack.code: pack for pack in (packs if packs is not None else tuple(PACKS.values()))}
    pack = catalog.get(code)
    if pack is None:
        raise HTTPException(status_code=404, detail="חבילה לא נמצאה")
    expected = TEACHER_GENERATION if role == "teacher" else STUDENT_AI
    if role != "teacher" and role != "student":
        raise HTTPException(status_code=403, detail="רכישה אינה זמינה לתפקיד זה")
    if pack.product != expected:
        raise HTTPException(status_code=403, detail="חבילה זו אינה מתאימה לחשבון")
    return pack
