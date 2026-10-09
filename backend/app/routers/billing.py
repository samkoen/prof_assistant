from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.billing import PaymentOrder
from app.models.user import User
from app.schemas.billing import (
    BalanceResponse,
    CheckoutRequest,
    CheckoutResponse,
    OrderStatusResponse,
    PackListResponse,
)
from app.services.billing.balance import balance_for, product_for_role
from app.services.billing.checkout import apply_webhook, confirm_order_with_payme, start_checkout
from app.services.billing.constants import ORDER_PENDING
from app.services.billing.context import role_name
from app.services.billing.settings_store import get_billing_config

router = APIRouter(prefix="/billing", tags=["billing"])


@router.get("/balance", response_model=BalanceResponse)
async def get_balance(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await balance_for(user, db)


@router.get("/packs", response_model=PackListResponse)
async def list_packs(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    config = await get_billing_config(db)
    role = role_name(user)
    if role == "admin":
        return {"packs": config.payloads_for()}
    return {"packs": config.payloads_for(product_for_role(role) or "")}


@router.post("/checkout", response_model=CheckoutResponse)
async def checkout(
    body: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order, url = await start_checkout(user, body.pack_code, db)
    return CheckoutResponse(order_id=order.id, transaction_id=order.transaction_id, payment_url=url)


async def _owned_order(transaction_id: str, user: User, db: AsyncSession) -> PaymentOrder:
    stmt = select(PaymentOrder).where(PaymentOrder.transaction_id == transaction_id)
    order = (await db.execute(stmt)).scalar_one_or_none()
    if order is None or order.user_id != user.id:
        raise HTTPException(status_code=404, detail="הזמנה לא נמצאה")
    return order


@router.get("/orders/{transaction_id}", response_model=OrderStatusResponse)
async def order_status(
    transaction_id: str,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    order = await _owned_order(transaction_id, user, db)
    if order.status == ORDER_PENDING:
        await confirm_order_with_payme(order, db)
    return OrderStatusResponse(
        transaction_id=order.transaction_id,
        status=order.status,
        credits=order.credits,
        product=order.product,
    )


async def _webhook_payload(request: Request) -> dict:
    content_type = request.headers.get("content-type", "")
    if "application/json" in content_type:
        data = await request.json()
        return data if isinstance(data, dict) else {}
    form = await request.form()
    return {key: str(value) for key, value in form.items()}


@router.post("/payme/webhook")
async def payme_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    payload = await _webhook_payload(request)
    result = await apply_webhook(payload, db)
    return {"ok": True, "result": result}
