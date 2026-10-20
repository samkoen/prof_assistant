from pydantic import BaseModel


class CreditPackResponse(BaseModel):
    code: str
    product: str
    credits: int
    price_ils: int
    label: str


class WalletResponse(BaseModel):
    product: str
    free_remaining: int
    paid_remaining: int
    total: int
    unlimited: bool = False


class BalanceResponse(BaseModel):
    wallets: list[WalletResponse]


class PackListResponse(BaseModel):
    packs: list[CreditPackResponse]
    calls_per_teacher_credit: int = 5


class CheckoutRequest(BaseModel):
    pack_code: str


class GuestCheckoutRequest(BaseModel):
    email: str
    pack_code: str


class CheckoutResponse(BaseModel):
    order_id: int
    transaction_id: str
    payment_url: str


class OrderStatusResponse(BaseModel):
    transaction_id: str
    status: str
    credits: int
    product: str


class BillingPackUpdate(BaseModel):
    code: str
    product: str
    credits: int
    price_ils: int


class BillingSettingsBody(BaseModel):
    student_free_credits: int
    teacher_free_credits: int
    calls_per_teacher_credit: int
    packs: list[BillingPackUpdate]
    payment_enabled: bool = False
