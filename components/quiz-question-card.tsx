"use client"

// One quiz question, rendered according to its discriminated `type`.
// Pure presentation — receives value/onChange from the parent so the
// store stays the single source of truth.

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { VoiceInputButton } from "@/components/voice-input-button"
import type { QuizQuestion } from "@/lib/schemas/planner-schemas"

type Props = {
  question: QuizQuestion
  value: string
  onChange: (value: string) => void
}

export function QuizQuestionCard({ question, value, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-xl leading-snug tracking-wide">
          {question.prompt}
        </h2>
        {question.helper ? (
          <p className="text-sm text-muted-foreground italic">
            {question.helper}
          </p>
        ) : null}
      </div>

      <QuestionInput question={question} value={value} onChange={onChange} />
    </div>
  )
}

function QuestionInput({ question, value, onChange }: Props) {
  switch (question.type) {
    case "single_choice":
      return (
        <RadioGroup
          value={value}
          onValueChange={onChange}
          className="flex flex-col gap-2"
        >
          {question.options.map((opt) => {
            const id = `${question.id}-${opt.value}`
            return (
              <label
                key={opt.value}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/40"
              >
                <RadioGroupItem id={id} value={opt.value} />
                <span className="text-sm">{opt.label}</span>
              </label>
            )
          })}
        </RadioGroup>
      )

    case "scale": {
      const steps: number[] = []
      for (let i = question.min; i <= question.max; i++) steps.push(i)
      return (
        <div className="flex flex-col gap-2">
          <div className="flex justify-between">
            {steps.map((n) => {
              const id = `${question.id}-${n}`
              const isActive = value === String(n)
              return (
                <label
                  key={n}
                  htmlFor={id}
                  className={[
                    "flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "hover:bg-muted",
                  ].join(" ")}
                >
                  <input
                    id={id}
                    type="radio"
                    name={question.id}
                    value={n}
                    checked={isActive}
                    onChange={(e) => onChange(e.target.value)}
                    className="sr-only"
                  />
                  {n}
                </label>
              )
            })}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{question.minLabel}</span>
            <span>{question.maxLabel}</span>
          </div>
        </div>
      )
    }

    case "number":
      return (
        <div className="flex items-center gap-3">
          <Input
            type="number"
            inputMode="decimal"
            min={question.min}
            max={question.max}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="max-w-32"
          />
          <Label className="text-sm text-muted-foreground">
            {question.unit}
          </Label>
          <VoiceInputButton
            onTranscript={(text) => {
              // Pull the first digit run out of the spoken phrase.
              // E.g. "приблизно 30 хвилин" → "30". If no digits, fall
              // back to dumping the whole transcript so the user can
              // edit it manually.
              const match = text.replace(/[,.]/g, "").match(/\d+/)
              onChange(match ? match[0] : text)
            }}
          />
        </div>
      )

    case "text":
      return (
        <div className="flex items-start gap-2">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            maxLength={question.maxLength}
            placeholder={question.placeholder}
            rows={3}
            className="flex-1"
          />
          <VoiceInputButton
            onTranscript={(text) => {
              // Append, prefixing with a space if there's already content.
              onChange(value ? `${value.trim()} ${text}` : text)
            }}
          />
        </div>
      )
  }
}
