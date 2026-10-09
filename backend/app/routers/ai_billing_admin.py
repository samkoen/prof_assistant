from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.billing import BillingSettingsBody
from app.services.billing.settings_store import (
    config_payload,
    get_billing_config,
    save_billing_settings,
)

router = APIRouter(prefix="/admin/ai-billing", tags=["admin-billing"])


@router.get("")
async def read_ai_billing(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    config = await get_billing_config(db)
    return config_payload(config)


@router.put("")
async def update_ai_billing(
    body: BillingSettingsBody,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    try:
        return await save_billing_settings(db, body.model_dump())
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(status_code=422, detail="ערכי קרדיטים לא תקינים") from exc
