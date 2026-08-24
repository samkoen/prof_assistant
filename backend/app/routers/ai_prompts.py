from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import require_roles
from app.models.enums import UserRole
from app.models.user import User
from app.schemas.ai_prompt import AiPromptTemplateOut, AiPromptUpdate
from app.services.ai_prompt_admin import (
    list_ai_prompt_templates,
    reset_ai_prompt_template,
    update_ai_prompt_template,
)

router = APIRouter(prefix="/admin/ai-prompts", tags=["admin-ai-prompts"])


@router.get("", response_model=list[AiPromptTemplateOut])
async def list_prompts(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_roles(UserRole.ADMIN)),
):
    return await list_ai_prompt_templates(db)


@router.put("/{prompt_key}", response_model=AiPromptTemplateOut)
async def update_prompt(
    prompt_key: str,
    body: AiPromptUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.ADMIN)),
):
    return await update_ai_prompt_template(prompt_key, body.body, user, db)


@router.post("/{prompt_key}/reset", response_model=AiPromptTemplateOut)
async def reset_prompt(
    prompt_key: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.ADMIN)),
):
    return await reset_ai_prompt_template(prompt_key, user, db)
