"""
Thin wrapper around the Groq SDK so agents don't each reimplement error handling
and JSON-mode parsing.

Set GROQ_API_KEY in your .env file (see .env.example).
"""
import os
import json
from groq import Groq

api_key = os.environ.get("GROQ_API_KEY")
_client = Groq(api_key=api_key) if api_key else None

# Text-only model, used for interpretation / urgency / scheduling reasoning
TEXT_MODEL = os.environ.get("GROQ_TEXT_MODEL", "llama-3.3-70b-versatile")

# Vision model, used for reading lab report images
VISION_MODEL = os.environ.get(
    "GROQ_VISION_MODEL",
    "llama-3.2-11b-vision-preview"
)
VISION_FALLBACK_MODELS = ["llama-3.2-90b-vision-preview", "llama-3.3-70b-versatile"]


def _require_client():
    if not _client:
        raise RuntimeError(
            "GROQ_API_KEY is not set. Add it to environment before calling the model."
        )
    return _client


def _request_with_fallback(
    client: Groq,
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
    for candidate in [model, *(fallback_models or []), "llama-3.3-70b-versatile", "llama-3.1-8b-instant"]:
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
            if "model" in msg or "404" in msg or "not_found" in msg or "decommissioned" in msg:
                continue
            raise

    raise RuntimeError(
        f"All requested model candidates failed. Last error: {last_error}"
    ) from last_error


def chat_json(system_prompt: str, user_prompt: str, model: str = TEXT_MODEL, max_tokens: int = 700) -> dict:
    """Call Groq with a system+user prompt, force JSON output, return parsed dict."""
    client = _require_client()
    resp = _request_with_fallback(
        client=client,
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
        max_tokens=max_tokens,
        fallback_models=["llama-3.1-8b-instant"],
    )
    content = resp.choices[0].message.content
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Groq output was not valid JSON:\n{content}"
        ) from exc


def chat_json_with_image(
    system_prompt: str,
    user_prompt: str,
    image_base64: str,
    mime_type: str = "image/jpeg",
    model: str = VISION_MODEL,
) -> dict:
    """Send base64 image + prompt to Groq vision model, return parsed JSON."""
    client = _require_client()
    data_url = f"data:{mime_type};base64,{image_base64}"
    resp = _request_with_fallback(
        client=client,
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_prompt},
                    {"type": "image_url", "image_url": {"url": data_url}},
                ],
            },
        ],
        temperature=0.1,
        response_format={"type": "json_object"},
        max_tokens=700,
        fallback_models=VISION_FALLBACK_MODELS,
    )
    content = resp.choices[0].message.content
    try:
        return json.loads(content)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Groq vision output was not valid JSON:\n{content}"
        ) from exc