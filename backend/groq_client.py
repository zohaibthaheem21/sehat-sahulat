"""
Thin wrapper around the Groq SDK so agents don't each reimplement error handling
and JSON-mode parsing.

Set GROQ_API_KEY in your .env file (see .env.example).

NOTE ON MODEL NAMES: Groq's available models change over time. The defaults below
are current as of this project's setup, but double check https://console.groq.com/docs/models
before the hackathon in case a model has been deprecated/renamed. If a model name
below 404s, that's almost certainly why.
"""
import os
import json
import base64
from pathlib import Path
from groq import Groq
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

api_key = os.environ.get("GROQ_API_KEY")
_client = Groq(api_key=api_key) if api_key else None

# Text-only model, used for interpretation / urgency / scheduling reasoning
TEXT_MODEL = os.environ.get("GROQ_TEXT_MODEL", "openai/gpt-oss-120b")

# Use a model that is commonly available on Groq accounts. This app retries through a
# small fallback list when a configured model returns 404 / model_not_found.
VISION_MODEL = os.environ.get(
    "GROQ_VISION_MODEL",
    "qwen/qwen3.6-27b"
)
VISION_FALLBACK_MODELS = ["llama-3.2-90b-vision-preview"]


def _require_client():
    if _client is None:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Add it to backend/.env or the environment before calling the model."
        )
    return _client


def _request_with_fallback(
    client,
    *,
    model: str,
    messages: list,
    temperature: float,
    response_format: dict,
    max_tokens: int = 700,
    fallback_models: list[str] | None = None,
    extra_body: dict | None = None,
):
    last_error = None
    candidates = []
    seen = set()
    for candidate in [model, *(fallback_models or [])]:
        if candidate and candidate not in seen:
            candidates.append(candidate)
            seen.add(candidate)

    for candidate in candidates:
        try:
                        return client.chat.completions.create(
    model=candidate,
    messages=messages,
    response_format=response_format,
    temperature=temperature,
    max_tokens=max_tokens,
    extra_body=extra_body,
)
        except Exception as exc:
            last_error = exc
            msg = str(exc).lower()
            if "model_not_found" not in msg and "does not exist" not in msg and "404" not in msg:
                raise

    raise RuntimeError(
        f"No valid Groq model was available for this request. Last error: {last_error}"
    ) from last_error


def chat_json(system_prompt: str, user_prompt: str, model: str = TEXT_MODEL, max_tokens: int = 700) -> dict:
    """Call Groq with a system+user prompt, force JSON output, return parsed dict."""
    client = _require_client()
    resp = _request_with_fallback(
        client,
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
        max_tokens=max_tokens,
    )
    content = resp.choices[0].message.content
    return json.loads(content)


def chat_json_with_image(
    system_prompt: str,
    user_prompt: str,
    image_bytes: bytes,
    mime_type: str = "image/jpeg",
    model: str = VISION_MODEL
) -> dict:
    """Call Groq's vision model with an image + text, force JSON output, return parsed dict."""

    client = _require_client()
    b64 = base64.b64encode(image_bytes).decode("utf-8")

    resp = _request_with_fallback(
        client,
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{b64}"
                        },
                    },
                ],
            },
        ],
                temperature=0.1,
        response_format={"type": "json_object"},
        max_tokens=700,
        extra_body={"reasoning_effort": "none"},
    )

    content = resp.choices[0].message.content
    return json.loads(content)