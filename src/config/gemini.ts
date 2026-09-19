import {GoogleGenAI} from "@google/genai";

import {env} from "./env";

export const gemini = new GoogleGenAI({apiKey: env.geminiApiKey});

// Model gemini
export const GEMINI_MODEL = "gemini-3.6-flash";
