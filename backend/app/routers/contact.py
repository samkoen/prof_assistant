from fastapi import APIRouter, Depends, Request
from fastapi.concurrency import run_in_threadpool

from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.contact import ContactRequest, ContactResponse, PublicContactRequest
from app.services.contact_message import send_contact_message, send_public_contact_message

router = APIRouter(prefix="/contact", tags=["contact"])


def client_ip(request: Request) -> str:
    """IP du visiteur : premier élément de X-Forwarded-For (derrière le proxy), sinon l'IP de la connexion."""
    forwarded = request.headers.get("x-forwarded-for", "")
    first = forwarded.split(",")[0].strip()
    if first:
        return first
    return request.client.host if request.client else "unknown"


@router.post("", response_model=ContactResponse)
async def send_contact(body: ContactRequest, user: User = Depends(get_current_user)):
    # L'envoi Brevo est bloquant (urllib) : on le sort de la boucle asyncio.
    await run_in_threadpool(send_contact_message, user, body)
    return ContactResponse()


@router.post("/public", response_model=ContactResponse)
async def send_public_contact(body: PublicContactRequest, request: Request):
    await run_in_threadpool(send_public_contact_message, body, client_ip(request))
    return ContactResponse()
