import OpenAI from "openai";

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ACTIVE_LOCALES = ["es", "en"] as const;
type Locale = (typeof ACTIVE_LOCALES)[number];

export interface ProcessedTestimony {
  originalLanguage: string;
  editedText: string;
  translatedText: Record<string, string>;
}

/**
 * Step 1 — Detect the ISO language code of the submitted text.
 */
async function detectLanguage(text: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a language detection tool. Respond with only the ISO 639-1 language code (e.g. 'es', 'en', 'pt') of the language the user's text is written in. No punctuation, no explanation.",
      },
      { role: "user", content: text },
    ],
    temperature: 0,
    max_tokens: 5,
  });

  return response.choices[0].message.content?.trim().toLowerCase() ?? "es";
}

/**
 * Step 2 — Correct spelling and punctuation only.
 * The author's voice, words, tone, and structure are never changed.
 */
async function generateEditedText(text: string): Promise<string> {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a careful copy editor. Your ONLY task is to fix spelling and punctuation errors.

Rules you must follow without exception:
- Do NOT change any words, only fix clear spelling mistakes
- Do NOT change the tone, voice, or emotional register
- Do NOT restructure, reorder, or shorten sentences
- Do NOT add or remove any content
- Do NOT translate the text — keep it in the original language
- If the text is already correct, return it exactly as-is
- The goal is to preserve the author's voice completely while making the text comfortable to read`,
      },
      { role: "user", content: text },
    ],
    temperature: 0.1,
  });

  return response.choices[0].message.content?.trim() ?? text;
}

/**
 * Step 3 — Translate to all active locales except the original language.
 * Emotional tone and personal voice must be preserved.
 */
async function generateTranslations(
  text: string,
  originalLanguage: string
): Promise<Record<string, string>> {
  const targetLocales = ACTIVE_LOCALES.filter(
    (locale) => locale !== originalLanguage
  );

  if (targetLocales.length === 0) return {};

  const translations: Record<string, string> = {};

  await Promise.all(
    targetLocales.map(async (locale: Locale) => {
      const localeNames: Record<Locale, string> = {
        es: "Spanish",
        en: "English",
      };

      const response = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: `You are a sensitive translator specializing in personal testimonies and first-person narratives.

Translate the following text into ${localeNames[locale]}.

Rules you must follow:
- Preserve the emotional tone and personal voice of the original
- Do NOT make the translation sound formal, generic, or sterile
- Maintain the intimacy and authenticity of the original text
- If the author uses informal or colloquial language, reflect that in the translation
- This translation will be displayed with a visible "Translated by AI" badge, so accuracy matters`,
          },
          { role: "user", content: text },
        ],
        temperature: 0.3,
      });

      translations[locale] =
        response.choices[0].message.content?.trim() ?? text;
    })
  );

  return translations;
}

/**
 * Main entry point — runs all three steps and returns the full processed result.
 * All steps complete before returning; never saved partially.
 */
export async function processTestimony(
  text: string
): Promise<ProcessedTestimony> {
  const originalLanguage = await detectLanguage(text);
  const [editedText, translatedText] = await Promise.all([
    generateEditedText(text),
    generateTranslations(text, originalLanguage),
  ]);

  return { originalLanguage, editedText, translatedText };
}
