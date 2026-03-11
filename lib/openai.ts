import OpenAI from "openai";
import { markdownToPlainText } from "@/lib/markdown";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY");
  }
  return new OpenAI({ apiKey });
}

const ACTIVE_LOCALES = ["es", "en"] as const;
type Locale = (typeof ACTIVE_LOCALES)[number];

export interface ProcessedTestimony {
  originalLanguage: string;
  editedText: string;
  translatedText: Record<string, string>;
  editedMarkdown: string;
  translatedMarkdown: Record<string, string>;
}

/**
 * Step 1 — Detect the ISO language code of the submitted text.
 */
async function detectLanguage(text: string): Promise<string> {
  const client = getOpenAIClient();
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
 * Step 2 — Correct spelling and punctuation while preserving Markdown structure.
 * The author's voice, words, tone, and structure are never changed.
 */
async function generateEditedMarkdown(markdown: string): Promise<string> {
  const client = getOpenAIClient();
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `You are a careful copy editor. Your ONLY task is to fix spelling and punctuation errors in Markdown text.

Rules you must follow without exception:
- Do NOT change any words, only fix clear spelling mistakes
- Do NOT change the tone, voice, or emotional register
- Do NOT restructure, reorder, or shorten sentences
- Do NOT add or remove any content
- Do NOT translate the text — keep it in the original language
- Preserve Markdown syntax and structure exactly (paragraphs, bold/italic markers, lists, blockquotes)
- Do NOT add HTML tags and do NOT wrap your answer in code fences
- If the text is already correct, return it exactly as-is
- The goal is to preserve the author's voice completely while making the text comfortable to read`,
      },
      { role: "user", content: markdown },
    ],
    temperature: 0.1,
  });

  return response.choices[0].message.content?.trim() ?? markdown;
}

/**
 * Step 3 — Translate to all active locales except the original language,
 * preserving Markdown structure.
 * Emotional tone and personal voice must be preserved.
 */
async function generateTranslations(
  markdown: string,
  originalLanguage: string
): Promise<Record<string, string>> {
  const client = getOpenAIClient();
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
            content: `You are a sensitive translator specializing in personal testimonies and first-person narratives written in Markdown.

Translate the following Markdown text into ${localeNames[locale]}.

Rules you must follow:
- Preserve the emotional tone and personal voice of the original
- Do NOT make the translation sound formal, generic, or sterile
- Maintain the intimacy and authenticity of the original text
- If the author uses informal or colloquial language, reflect that in the translation
- Preserve Markdown syntax and structure (paragraphs, bold/italic markers, lists, blockquotes)
- Do NOT add HTML tags and do NOT wrap your answer in code fences
- This translation will be displayed with a visible "Translated by AI" badge, so accuracy matters`,
          },
          { role: "user", content: markdown },
        ],
        temperature: 0.3,
      });

      translations[locale] =
        response.choices[0].message.content?.trim() ?? markdown;
    })
  );

  return translations;
}

/**
 * Main entry point — runs all three steps and returns the full processed result.
 * All steps complete before returning; never saved partially.
 */
export async function processTestimony(
  input: { plainText: string; markdown?: string }
): Promise<ProcessedTestimony> {
  const sourceMarkdown = (input.markdown?.trim() || input.plainText).trim();
  const sourcePlainText = input.plainText.trim();

  const originalLanguage = await detectLanguage(sourcePlainText);
  const [editedMarkdown, translatedMarkdown] = await Promise.all([
    generateEditedMarkdown(sourceMarkdown),
    generateTranslations(sourceMarkdown, originalLanguage),
  ]);

  const editedText = markdownToPlainText(editedMarkdown);
  const translatedText: Record<string, string> = {};
  for (const [locale, translated] of Object.entries(translatedMarkdown)) {
    translatedText[locale] = markdownToPlainText(translated);
  }

  return {
    originalLanguage,
    editedText,
    translatedText,
    editedMarkdown,
    translatedMarkdown,
  };
}
