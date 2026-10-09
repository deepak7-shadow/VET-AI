import logging
from typing import Optional, Dict, Any
from app.config import settings

logger = logging.getLogger("vet_ai.ai_service")

# Try to initialize google-genai client if API key is provided
_gemini_client = None
if settings.AI_API_KEY and settings.AI_API_KEY.startswith("AIza"):
    try:
        from google import genai
        _gemini_client = genai.Client(api_key=settings.AI_API_KEY)
        logger.info("Gemini GenAI client initialized successfully.")
    except Exception as e:
        logger.warning(f"Could not initialize Gemini Client: {e}")
else:
    logger.info("Using deterministic veterinary intelligence engine.")

import asyncio

async def generate_text(prompt: str, system_instruction: Optional[str] = None) -> Optional[str]:
    """Generate text using Gemini API or return None to trigger deterministic fallback."""
    if _gemini_client:
        def _call_gemini():
            return _gemini_client.models.generate_content(
                model=settings.AI_MODEL if "gemini" in settings.AI_MODEL else "gemini-2.0-flash",
                contents=prompt,
                config={
                    "system_instruction": system_instruction,
                    "temperature": 0.2
                } if system_instruction else {"temperature": 0.2}
            )

        try:
            response = await asyncio.wait_for(asyncio.to_thread(_call_gemini), timeout=2.5)
            if response and response.text:
                return response.text
        except Exception as e:
            logger.warning(f"Gemini API call timed out or failed ({e}), switching seamlessly to deterministic intelligence.")
    return None
