// Server-only Google Gemini SDK wrapper. `callGeminiStructured` runs
// Gemini with `responseMimeType: "application/json"` + a `responseSchema`,
// so the model is constrained to return JSON that fits the provided shape.
// We additionally re-parse with zod before returning (defense in depth).
//
// This module must only be imported from server code (API routes /
// server components) — it reads the API key from process.env and would
// expose it if bundled to the client.

import { GoogleGenAI } from "@google/genai"
import { z } from "zod"

import { env } from "@/lib/env"

// One client per process. Safe to reuse across requests.
let _client: GoogleGenAI | null = null
function client(): GoogleGenAI {
  if (!env.GEMINI_API_KEY) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to .env.local (local) " +
        "or your Vercel project (production)."
    )
  }
  _client ??= new GoogleGenAI({ apiKey: env.GEMINI_API_KEY })
  return _client
}

// We pin a single model. Bumping is a deliberate, user-visible change.
const MODEL = "gemini-3.5-flash"

export type CallGeminiOptions<T> = {
  system: string
  userMessage: string
  // Gemini-compatible JSON Schema (subset of OpenAPI 3.0). Note: Gemini
  // does NOT support `additionalProperties`, `$ref`, `oneOf`, `allOf` —
  // the schemas in our API routes are intentionally written without them.
  responseSchema: Record<string, unknown>
  // After Gemini returns the JSON payload we re-parse with zod to make
  // sure it actually matches what we expect.
  resultSchema: z.ZodType<T>
  maxOutputTokens?: number
}

export async function callGeminiStructured<T>({
  system,
  userMessage,
  responseSchema,
  resultSchema,
  maxOutputTokens = 8192,
}: CallGeminiOptions<T>): Promise<T> {
  const response = await client().models.generateContent({
    model: MODEL,
    contents: userMessage,
    config: {
      systemInstruction: system,
      responseMimeType: "application/json",
      // The SDK's typing for responseSchema is loose; the structure we
      // pass conforms to Gemini's accepted schema subset.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      responseSchema: responseSchema as any,
      maxOutputTokens,
      temperature: 0.7,
    },
  })

  const text = response.text
  if (!text) {
    throw new Error("Gemini returned an empty response.")
  }

  const parsed = parseGeminiJson(text)
  return resultSchema.parse(parsed)
}

// Tolerant JSON parser for Gemini output.
//
// Even with `responseMimeType: "application/json"` the model occasionally
// drifts: wraps the payload in ```json ... ``` fences, adds an
// explanatory sentence before/after, or — when bumping against the
// max-output-tokens cap — chops the JSON mid-string. We make a best
// effort to recover instead of failing the whole request:
//   1. Strip markdown code fences.
//   2. Slice from the first '{' to the last '}' to drop stray text.
//   3. If that still doesn't parse, try to repair a truncated tail by
//      closing open strings/arrays/objects.
function parseGeminiJson(text: string): unknown {
  const candidate = extractJsonCandidate(text)

  try {
    return JSON.parse(candidate)
  } catch {
    // First-chance parse failed — try repairing a truncated tail.
  }

  const repaired = repairTruncatedJson(candidate)
  try {
    return JSON.parse(repaired)
  } catch (err) {
    console.error(
      "[gemini] JSON parse failed even after repair:",
      err,
      "first 400 chars:",
      text.slice(0, 400)
    )
    throw new Error(
      "Gemini did not return valid JSON. The response may have been " +
        "cut off — try again, or simplify the request."
    )
  }
}

function extractJsonCandidate(text: string): string {
  // Strip markdown fences if present.
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  let s = fenceMatch ? fenceMatch[1] : text

  // Trim to the outermost {...} or [...].
  const firstObj = s.indexOf("{")
  const firstArr = s.indexOf("[")
  const start =
    firstObj === -1
      ? firstArr
      : firstArr === -1
        ? firstObj
        : Math.min(firstObj, firstArr)
  if (start > 0) s = s.slice(start)

  return s.trim()
}

// Best-effort repair of JSON that was cut off mid-output.
// Walks the string tracking string/array/object depth and appends the
// closing tokens that are still open. Not perfect, but recovers enough
// of a long plan to render most of the days/exercises.
function repairTruncatedJson(text: string): string {
  let inString = false
  let escape = false
  const stack: ("{" | "[")[] = []

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (escape) {
      escape = false
      continue
    }
    if (ch === "\\") {
      escape = true
      continue
    }
    if (ch === '"') {
      inString = !inString
      continue
    }
    if (inString) continue
    if (ch === "{") stack.push("{")
    else if (ch === "[") stack.push("[")
    else if (ch === "}" || ch === "]") stack.pop()
  }

  let tail = ""
  if (inString) tail += '"'
  // If the last meaningful character is a comma or colon, drop it so we
  // don't produce illegal JSON like `,]` / `:}`.
  let trimmed = (text + tail).replace(/[,:\s]+$/, "")
  while (stack.length > 0) {
    const open = stack.pop()
    trimmed += open === "{" ? "}" : "]"
  }
  return trimmed
}
