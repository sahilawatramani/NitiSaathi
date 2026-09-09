"""
Voice transcription endpoint.
Accepts base64-encoded audio and returns transcript using Whisper API or Bhashini ASR.
"""
import base64
import logging
import tempfile
import os
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.models.schemas import User
from app.services.auth_service import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter()


class VoiceRequest(BaseModel):
    audio_base64: str  # base64-encoded audio data
    format: str = 'webm'  # webm | mp3 | wav | m4a
    language: str = 'hi'  # hint for ASR


class VoiceResponse(BaseModel):
    transcript: str
    language_detected: str
    provider: str


def _transcribe_whisper(audio_bytes: bytes, audio_format: str, language: str) -> str:
    """Transcribe using OpenAI Whisper API."""
    import openai
    client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
    with tempfile.NamedTemporaryFile(suffix=f'.{audio_format}', delete=False) as f:
        f.write(audio_bytes)
        tmp_path = f.name
    try:
        with open(tmp_path, 'rb') as audio_file:
            result = client.audio.transcriptions.create(
                model='whisper-1',
                file=audio_file,
                language=language if language != 'hi' else 'hi',
                response_format='text'
            )
        return str(result)
    finally:
        os.unlink(tmp_path)


def _transcribe_bhashini(audio_bytes: bytes, language: str) -> str:
    """Bhashini ASR stub — wire when API key + endpoint docs are available."""
    raise NotImplementedError('Bhashini ASR integration pending API key configuration')


@router.post('/voice', response_model=VoiceResponse)
async def transcribe_voice(
    request: VoiceRequest,
    current_user: User = Depends(get_current_user)
):
    """Transcribe audio to text for voice input in the chat interface."""
    try:
        audio_bytes = base64.b64decode(request.audio_base64)
    except Exception:
        raise HTTPException(400, 'Invalid base64 audio data')
    
    openai_key = os.getenv('OPENAI_API_KEY', '')
    bhashini_key = os.getenv('BHASHINI_API_KEY', '')
    
    if openai_key:
        try:
            transcript = _transcribe_whisper(audio_bytes, request.format, request.language)
            return VoiceResponse(transcript=transcript, language_detected=request.language, provider='whisper')
        except Exception as e:
            logger.warning('Whisper transcription failed: %s', e)
    
    if bhashini_key:
        try:
            transcript = _transcribe_bhashini(audio_bytes, request.language)
            return VoiceResponse(transcript=transcript, language_detected=request.language, provider='bhashini')
        except NotImplementedError:
            pass
        except Exception as e:
            logger.warning('Bhashini ASR failed: %s', e)
    
    raise HTTPException(503, detail='No ASR service configured. Set OPENAI_API_KEY or BHASHINI_API_KEY in .env to enable voice input.')
