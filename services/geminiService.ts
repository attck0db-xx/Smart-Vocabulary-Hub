
import { GoogleGenAI, Type } from "@google/genai";
import { GeminiWordResponse, Dialogue, WordLookup } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const fetchWordData = async (words: string[]): Promise<GeminiWordResponse[]> => {
  const prompt = `For the following English words: ${words.join(', ')}, provide:
  1. American phonetic symbols.
  2. Short Chinese translation for the word.
  3. One short authentic example sentence.
  4. Chinese translation for that sentence.
  Return as a JSON array.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              wordTranslation: { type: Type.STRING },
              phonetic: { type: Type.STRING },
              sentence: { type: Type.STRING },
              sentenceTranslation: { type: Type.STRING }
            },
            required: ["word", "wordTranslation", "phonetic", "sentence", "sentenceTranslation"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("fetchWordData error:", error);
    return [];
  }
};

export const fetchHighFreqWords = async (): Promise<string[]> => {
  const prompt = `List 30 high-frequency English words used in daily life. Focus on words that are at CET-4 level or higher. Return only a JSON array of strings.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("fetchHighFreqWords error:", error);
    return [];
  }
};

export const generateDialogue = async (): Promise<Dialogue | null> => {
  const prompt = `Generate a short scenario-based dialogue (around 50 words) focused on daily life. 
  IMPORTANT: Use 'A' and 'B' as speakers.
  Include Chinese translations for each line. Return JSON.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            lines: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING, description: "Must be 'A' or 'B'" },
                  text: { type: Type.STRING },
                  translation: { type: Type.STRING }
                },
                required: ["speaker", "text", "translation"]
              }
            }
          },
          required: ["title", "lines"]
        }
      }
    });
    const text = response.text;
    if (!text) return null;
    const data = JSON.parse(text);
    return {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now()
    };
  } catch (error) {
    console.error("generateDialogue error:", error);
    return null;
  }
};

export const lookupWord = async (word: string): Promise<WordLookup | null> => {
  const prompt = `Provide the American phonetic symbols and a short Chinese translation for the word: "${word}". Return as JSON.`;
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            phonetic: { type: Type.STRING },
            translation: { type: Type.STRING }
          },
          required: ["word", "phonetic", "translation"]
        }
      }
    });
    const text = response.text;
    if (!text) return null;
    return JSON.parse(text);
  } catch (error) {
    console.error("lookupWord error:", error);
    return null;
  }
};
