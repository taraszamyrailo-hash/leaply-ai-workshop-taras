import { z } from "zod"

// Parse and validate environment variables once at startup.
// Add a field here whenever you reference a new process.env.X in code.
// Required vars use .min(1) / .url() etc; optional vars use .optional().
//
// We keep GEMINI_API_KEY *optional* here so that `next build` works in
// environments where the key isn't set (e.g. CI without secrets). The
// API routes that actually need the key check for it at request time and
// return a clear error if it's missing — see /api/quiz and /api/plan.
const EnvSchema = z.object({
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),

  // Google Gemini API key (Google AI Studio).
  // Server-only secret — NEVER prefix with NEXT_PUBLIC_.
  GEMINI_API_KEY: z.string().min(1).optional(),
})

export const env = EnvSchema.parse(process.env)
export type Env = z.infer<typeof EnvSchema>
