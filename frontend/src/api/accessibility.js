import { apiFetch } from './config';

// Temporary local base URL for the accessibility agent until it's routed through the API gateway
const ACCESSIBILITY_URL = 'http://localhost:8005/api/v1/accessibility';

export const getHealth = async () => {
  const res = await fetch(`${ACCESSIBILITY_URL}/health`);
  return res.json();
};

export const translateText = async (text, targetLang, sourceLang = 'en') => {
  const res = await fetch(`${ACCESSIBILITY_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, target_language: targetLang, source_language: sourceLang }),
  });
  return res.json();
};

export const getGlossary = async (category = null, language = 'hi') => {
  const url = new URL(`${ACCESSIBILITY_URL}/glossary`);
  if (category) url.searchParams.append('category', category);
  url.searchParams.append('language', language);
  
  const res = await fetch(url);
  return res.json();
};

export const getWordToWord = async (text, language = 'hi') => {
  const res = await fetch(`${ACCESSIBILITY_URL}/word-to-word`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, target_language: language }),
  });
  return res.json();
};
