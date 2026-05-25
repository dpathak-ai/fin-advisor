import base64
import json
import os
from datetime import datetime, timezone
from pathlib import Path

import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi_clerk_auth import ClerkConfig, ClerkHTTPBearer, HTTPAuthorizationCredentials
from openai import OpenAI

# api/index.py lives one level below the project root — point explicitly to root .env
load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

# Validate required environment variables at startup so errors are obvious
_REQUIRED = ["CLERK_JWKS_URL", "CLERK_SECRET_KEY", "OPENAI_API_KEY"]
_missing = [v for v in _REQUIRED if not os.getenv(v)]
if _missing:
    raise RuntimeError(f"Missing required environment variables: {', '.join(_missing)}")

app = FastAPI(title="Fin Advisor API")

# Read allowed origins from env so local dev and production both work.
# ALLOWED_ORIGINS="https://your-app.vercel.app,http://localhost:3000"
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# Clerk authentication setup
clerk_config = ClerkConfig(jwks_url=os.getenv("CLERK_JWKS_URL"))
clerk_guard = ClerkHTTPBearer(clerk_config)

# Search limits per plan
PLAN_LIMITS: dict[str, int] = {"free": 5, "pro": 100}


# ── Helpers ────────────────────────────────────────────────────────────────

def _get_user_id(creds: HTTPAuthorizationCredentials) -> str:
    """Extract the user ID (sub claim) from the already-validated Clerk JWT."""
    segment = creds.credentials.split(".")[1]
    segment += "=" * (4 - len(segment) % 4)          # restore base64url padding
    payload = json.loads(base64.urlsafe_b64decode(segment))
    return payload["sub"]


async def _get_user_metadata(user_id: str) -> tuple[dict, dict]:
    """Return (public_metadata, private_metadata) for a Clerk user."""
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f"https://api.clerk.com/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {os.getenv('CLERK_SECRET_KEY')}"},
        )
        r.raise_for_status()
        data = r.json()
    return data.get("public_metadata", {}), data.get("private_metadata", {})


async def _update_private_metadata(user_id: str, metadata: dict) -> None:
    """Patch the private_metadata for a Clerk user."""
    async with httpx.AsyncClient() as client:
        r = await client.patch(
            f"https://api.clerk.com/v1/users/{user_id}/metadata",
            headers={"Authorization": f"Bearer {os.getenv('CLERK_SECRET_KEY')}"},
            json={"private_metadata": metadata},
        )
        r.raise_for_status()


async def check_and_increment_usage(user_id: str) -> dict:
    """
    Check the monthly search quota for a user and increment the counter.
    Raises HTTP 429 if the plan limit is reached.
    Returns {"remaining": int, "limit": int, "plan": str}.
    """
    public_meta, private_meta = await _get_user_metadata(user_id)

    plan = public_meta.get("plan", "free")
    limit = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])

    current_month = datetime.now(timezone.utc).strftime("%Y-%m")

    # Reset counter when the calendar month rolls over
    if private_meta.get("reset_month") != current_month:
        count = 0
    else:
        count = int(private_meta.get("search_count", 0))

    if count >= limit:
        raise HTTPException(
            status_code=429,
            detail={"code": "limit_exceeded", "plan": plan, "limit": limit},
        )

    new_count = count + 1
    await _update_private_metadata(user_id, {
        **private_meta,
        "search_count": new_count,
        "reset_month": current_month,
    })

    return {"remaining": limit - new_count, "limit": limit, "plan": plan}


# ── Models ──────────────────────────────────────────────────────────────────

class TermRequest(BaseModel):
    term: str


system_prompt = """
You are a helpful assistant that explains financial terms in a clear and concise manner.
You are given a financial term and you need to explain it in 2-3 simple sentences.
Then you need to give one short, concrete real-world example.

The response should be in this exact JSON format with no extra text:
{{
    "explanation": "...",
    "example": "..."
}}
"""


# ── Routes ──────────────────────────────────────────────────────────────────

@app.post("/api/explain")
async def explain_term(
    req: TermRequest,
    creds: HTTPAuthorizationCredentials = Depends(clerk_guard),
):
    if not req.term.strip():
        raise HTTPException(status_code=400, detail="Term cannot be empty")

    user_id = _get_user_id(creds)
    usage = await check_and_increment_usage(user_id)  # raises 429 if over limit

    client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
    user_prompt = (
        f'Explain the financial term "{req.term}" in 2-3 simple sentences. '
        "Then give one short, concrete real-world example."
    )
    stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        stream=True,
        response_format={"type": "json_object"},
    )

    def event_stream():
        for chunk in stream:
            text = chunk.choices[0].delta.content
            if text:
                lines = text.split("\n")
                for line in lines[:-1]:
                    yield f"data: {line}\n\n"
                    yield "data:  \n"
                yield f"data: {lines[-1]}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "X-Searches-Remaining": str(usage["remaining"]),
            "X-Searches-Limit": str(usage["limit"]),
            "X-Plan": usage["plan"],
        },
    )


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "ok"}
