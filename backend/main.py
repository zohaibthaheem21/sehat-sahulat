import os
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

try:
    from backend.agents.extraction import run_extraction
    from backend.agents.interpretation import run_interpretation
    from backend.agents.urgency import run_urgency
    from backend.agents.scheduling import run_scheduling
    from backend.models import PipelineResult, MentorRequest, MentorResponse
except ImportError:
    from agents.extraction import run_extraction
    from agents.interpretation import run_interpretation
    from agents.urgency import run_urgency
    from agents.scheduling import run_scheduling
    from models import PipelineResult, MentorRequest, MentorResponse

app = FastAPI(title="Sehat Sahulat API")

# CORS middleware enabling requests from all local/frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MENTOR_SYSTEM_PROMPT = """You are "Sehat Mentor", a warm, careful health explainer for patients in Pakistan.
Rules:
- Explain medical terms, lab tests and report values in very simple language.
- If the user writes in Urdu or Roman Urdu, reply in the same style, otherwise reply in English.
- Keep answers short: 3-6 sentences or a few bullet points.
- Never diagnose, never prescribe medicine or dosages. Suggest which kind of doctor to see and when.
- If anything sounds like an emergency (chest pain, heavy bleeding, breathlessness, fainting), tell the user to seek emergency care immediately.
- End sensitive answers with a gentle reminder that this is educational guidance, not a diagnosis."""

MENTOR_MODEL_CANDIDATES = [
    "openai/gpt-oss-120b",
    "qwen/qwen3.6-27b",
    "groq/compound",
    "openai/gpt-oss-20b",
    "llama-3.3-70b-versatile",
]


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.post("/api/process", response_model=PipelineResult)
async def process_report(file: UploadFile = File(...)):
    if file.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(400, f"Unsupported file type: {file.content_type}. Use JPEG, PNG, or WEBP.")

    image_bytes = await file.read()
    if not image_bytes:
        raise HTTPException(400, "Uploaded file is empty.")

    try:
        extraction = run_extraction(image_bytes, mime_type=file.content_type)
    except Exception as e:
        raise HTTPException(500, f"Extraction agent failed: {e}")

    # Fallback to ensure all medical report images proceed through the pipeline
    if not (extraction.values or extraction.vitals or extraction.symptoms
            or extraction.impression or extraction.medications or extraction.advice):
        from backend.models import LabValue
        note = extraction.raw_notes if extraction.raw_notes else "Medical Document Overview"
        extraction.values.append(
            LabValue(
                test_name="Medical Information",
                value=note[:150] if note else "Report processed",
                unit="",
                reference_range="See clinical advice",
                flag="normal",
            )
        )

    try:
        interpretation = run_interpretation(extraction)
        urgency = run_urgency(extraction)
        scheduling = run_scheduling(extraction, urgency)
    except Exception as e:
        raise HTTPException(500, f"Pipeline failed after extraction: {e}")

    return PipelineResult(
        extraction=extraction,
        interpretation=interpretation,
        urgency=urgency,
        scheduling=scheduling,
    )


@app.post("/api/mentor", response_model=MentorResponse)
async def mentor_chat(req: MentorRequest):
    if not req.messages:
        raise HTTPException(400, "Please type a question.")

    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(503, "The AI mentor is not configured yet. Please add GROQ_API_KEY to environment.")

    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        formatted_messages = [{"role": "system", "content": MENTOR_SYSTEM_PROMPT}]
        for m in req.messages[-14:]:
            formatted_messages.append({"role": m.role, "content": m.content})

        last_error = None
        reply = None
        for model_name in MENTOR_MODEL_CANDIDATES:
            try:
                response = client.chat.completions.create(
                    model=model_name,
                    messages=formatted_messages,
                    temperature=0.4,
                    max_tokens=700,
                )
                reply = response.choices[0].message.content.strip() if response.choices else None
                if reply:
                    break
            except Exception as exc:
                last_error = exc
                continue

        if not reply:
            raise HTTPException(502, f"The mentor had no answer: {last_error or 'Please try again.'}")

        return MentorResponse(reply=reply)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Mentor request failed: {e}")


