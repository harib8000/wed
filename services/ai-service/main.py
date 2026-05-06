from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import httpx
import os
import json
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="WeddingOS AI Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Config ─────────────────────────────────────────────────────────────────────
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
AI_PROVIDER = os.getenv("AI_PROVIDER", "openai")  # or 'anthropic'
AI_MODEL = os.getenv("AI_MODEL", "gpt-4o-mini")

# ── Schemas ────────────────────────────────────────────────────────────────────

class BudgetPlannerInput(BaseModel):
    total_budget_paise: int = Field(..., gt=0, description="Total budget in paise (1 INR = 100 paise)")
    guest_count: int = Field(..., gt=0)
    venue_city: str
    wedding_type: str = "traditional"  # 'traditional' | 'destination' | 'intimate'
    preferences: Optional[List[str]] = []  # e.g. ['photography', 'catering']

class BudgetCategoryAllocation(BaseModel):
    category: str
    percentage: float
    estimated_paise: int
    description: str
    priority: str  # 'must_have' | 'nice_to_have' | 'optional'

class BudgetPlannerOutput(BaseModel):
    total_budget_paise: int
    allocations: List[BudgetCategoryAllocation]
    tips: List[str]
    warnings: List[str]

class VendorRecommendInput(BaseModel):
    category: str
    city: str
    budget_paise: int
    event_date: str
    style_preferences: Optional[List[str]] = []
    guest_count: Optional[int] = None

class RecommendationOutput(BaseModel):
    recommendations: List[dict]
    reasoning: str

class ChatMessage(BaseModel):
    role: str  # 'user' | 'assistant'
    content: str

class AIChatInput(BaseModel):
    messages: List[ChatMessage]
    context: Optional[dict] = {}

class AIChatOutput(BaseModel):
    message: str
    suggestions: Optional[List[str]] = []

# ── AI Client Helper ──────────────────────────────────────────────────────────

async def call_llm(system_prompt: str, user_message: str) -> str:
    """Call configured LLM provider."""
    
    if AI_PROVIDER == "anthropic" and ANTHROPIC_API_KEY:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": ANTHROPIC_API_KEY,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json",
                },
                json={
                    "model": AI_MODEL or "claude-3-5-haiku-20241022",
                    "max_tokens": 2048,
                    "system": system_prompt,
                    "messages": [{"role": "user", "content": user_message}]
                }
            )
            response.raise_for_status()
            return response.json()["content"][0]["text"]

    elif OPENAI_API_KEY:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {OPENAI_API_KEY}", "Content-Type": "application/json"},
                json={
                    "model": AI_MODEL,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_message},
                    ],
                    "max_tokens": 2048,
                    "temperature": 0.3,
                }
            )
            response.raise_for_status()
            return response.json()["choices"][0]["message"]["content"]

    else:
        # Stub response when no API key configured
        logger.warning("No AI API key configured, returning stub response")
        return json.dumps({
            "allocations": [
                {"category": "Venue", "percentage": 30, "estimated_paise": 0, "description": "Wedding venue booking", "priority": "must_have"},
                {"category": "Catering", "percentage": 25, "estimated_paise": 0, "description": "Food & beverages", "priority": "must_have"},
                {"category": "Photography", "percentage": 15, "estimated_paise": 0, "description": "Photo & video coverage", "priority": "must_have"},
                {"category": "Decoration", "percentage": 15, "estimated_paise": 0, "description": "Floral & décor", "priority": "nice_to_have"},
                {"category": "Music & Entertainment", "percentage": 5, "estimated_paise": 0, "description": "DJ, band, performers", "priority": "nice_to_have"},
                {"category": "Bridal Makeup", "percentage": 5, "estimated_paise": 0, "description": "Makeup & hair styling", "priority": "must_have"},
                {"category": "Miscellaneous", "percentage": 5, "estimated_paise": 0, "description": "Invites, transport, gifts", "priority": "optional"},
            ],
            "tips": ["Book venues 6-12 months in advance for peak season", "Compare at least 3 vendors per category"],
            "warnings": []
        })

# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.post("/ai/budget-planner", response_model=BudgetPlannerOutput)
async def budget_planner(data: BudgetPlannerInput):
    """Generate AI-powered wedding budget allocation."""
    
    system_prompt = """You are a professional Indian wedding planner with 15 years of experience. 
You help couples allocate their wedding budget wisely across different categories.
Always respond in valid JSON matching the schema provided.
Consider Indian wedding traditions, current market prices in the given city, and the couple's preferences."""

    user_message = f"""Create a detailed budget allocation plan for:
- Total Budget: ₹{data.total_budget_paise / 100:,.0f} ({data.total_budget_paise} paise)
- Guest Count: {data.guest_count}
- City: {data.venue_city}
- Wedding Type: {data.wedding_type}
- Special Preferences: {', '.join(data.preferences) if data.preferences else 'none'}

Return JSON with keys: allocations (array of {{category, percentage, estimated_paise, description, priority}}), tips (array of strings), warnings (array of strings).
Make sure percentages sum to 100. Calculate estimated_paise based on total budget."""

    try:
        raw = await call_llm(system_prompt, user_message)
        # Extract JSON from response
        start = raw.find('{')
        end = raw.rfind('}') + 1
        if start == -1:
            raise ValueError("No JSON in response")
        parsed = json.loads(raw[start:end])
        
        allocations = parsed.get("allocations", [])
        # Fix paise values
        for alloc in allocations:
            alloc["estimated_paise"] = int(data.total_budget_paise * alloc.get("percentage", 0) / 100)
        
        return BudgetPlannerOutput(
            total_budget_paise=data.total_budget_paise,
            allocations=allocations,
            tips=parsed.get("tips", []),
            warnings=parsed.get("warnings", []),
        )
    except Exception as e:
        logger.error(f"Budget planner error: {e}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")


@app.post("/ai/vendor-recommendations", response_model=RecommendationOutput)
async def vendor_recommendations(data: VendorRecommendInput):
    """Get AI-curated vendor selection criteria and tips."""
    
    system_prompt = """You are an expert Indian wedding vendor consultant. 
Provide actionable vendor selection criteria and interview questions.
Respond in JSON."""

    user_message = f"""I need to book a {data.category} vendor for my wedding in {data.city}.
Budget: ₹{data.budget_paise / 100:,.0f}
Event Date: {data.event_date}
Guest Count: {data.guest_count or 'not specified'}
Style Preferences: {', '.join(data.style_preferences) if data.style_preferences else 'traditional'}

Return JSON with: recommendations (array of {{title, description, priority}}), reasoning (string explaining approach)."""

    try:
        raw = await call_llm(system_prompt, user_message)
        start = raw.find('{')
        end = raw.rfind('}') + 1
        parsed = json.loads(raw[start:end])
        return RecommendationOutput(**parsed)
    except Exception as e:
        logger.error(f"Recommendations error: {e}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")


@app.post("/ai/chat", response_model=AIChatOutput)
async def ai_chat(data: AIChatInput):
    """Wedding planning AI assistant chat."""
    
    system_prompt = """You are WeddingOS's friendly AI wedding planning assistant for Indian weddings.
You help couples plan their perfect wedding — budgeting, vendor selection, timelines, rituals, and traditions.
Be warm, helpful, practical, and culturally aware about Indian weddings.
Keep responses concise (under 200 words). End with 1-2 actionable suggestions."""

    # Build conversation context
    context_str = ""
    if data.context:
        context_str = f"\nUser context: {json.dumps(data.context)}\n"

    conversation = context_str
    for msg in data.messages[-10:]:  # last 10 messages
        conversation += f"\n{msg.role.capitalize()}: {msg.content}"

    try:
        response = await call_llm(system_prompt, conversation + "\nAssistant:")
        
        # Extract suggestions (lines starting with numbers or bullets)
        lines = response.split('\n')
        suggestions = [l.strip('•- 123456789.').strip() for l in lines if l.strip().startswith(('•', '-', '1.', '2.'))][:3]
        
        return AIChatOutput(message=response, suggestions=suggestions)
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="AI service temporarily unavailable")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "ai-service", "ai_provider": AI_PROVIDER}
