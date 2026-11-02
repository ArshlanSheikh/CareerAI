import os
import json
import logging
from google import genai
from google.genai import types

logger = logging.getLogger(__name__)

FALLBACK_MODELS = [
    "gemini-3.5-flash-lite",
    "gemini-3.8-flash",
    "gemini-3.5-flash",
]


class GeminiProvider:
    def __init__(self, api_key: str = None, model_name: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        self.model_name = model_name or os.getenv("GEMINI_MODEL", "gemini-3.5-flash-lite")
        
        if not self.api_key:
            logger.warning("GEMINI_API_KEY is not set. AI operations will fail.")
            self.client = None
        else:
            self.client = genai.Client(api_key=self.api_key)

    def generate_json(self, prompt: str, system_instruction: str = "") -> dict:
        """
        Sends prompt to Gemini API with JSON output mode and parses the response.
        Implements fallback model retries if a specific model encounters transient 503/429/404 errors.
        """
        if not self.client:
            raise RuntimeError("Gemini API key is not configured. Please set GEMINI_API_KEY in backend/.env.")

        config = types.GenerateContentConfig(
            response_mime_type="application/json",
            system_instruction=system_instruction or "You are an expert career counselor and resume architect. Respond strictly with valid JSON.",
            temperature=0.3,
        )

        models_to_try = [self.model_name]
        for m in FALLBACK_MODELS:
            if m not in models_to_try:
                models_to_try.append(m)

        last_error = None
        for model in models_to_try:
            try:
                logger.info(f"Attempting Gemini generation with model: {model}")
                response = self.client.models.generate_content(
                    model=model,
                    contents=prompt,
                    config=config,
                )
                raw_text = response.text.strip()
                
                # Remove Markdown code blocks if any
                if raw_text.startswith("```json"):
                    raw_text = raw_text[7:]
                if raw_text.startswith("```"):
                    raw_text = raw_text[3:]
                if raw_text.endswith("```"):
                    raw_text = raw_text[:-3]
                raw_text = raw_text.strip()

                return json.loads(raw_text)
            except json.JSONDecodeError as jde:
                logger.error(f"Failed to parse Gemini response as JSON from {model}: {jde}. Raw text: {raw_text}")
                last_error = ValueError(f"AI returned invalid JSON: {jde}")
            except Exception as e:
                logger.warning(f"Gemini API generation error with {model}: {e}")
                last_error = e
                # Continue loop to try next fallback model

        logger.error(f"All candidate models failed: {last_error}")
        raise last_error
