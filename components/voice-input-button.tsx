"use client"

// Mic button that toggles speech-to-text. While listening, pulses red so
// the user sees they're being heard. Hides itself entirely when the
// browser doesn't ship a SpeechRecognition implementation (Firefox).

import { RiMicFill, RiStopCircleFill } from "@remixicon/react"

import { Button } from "@/components/ui/button"
import { useSpeechRecognition } from "@/lib/use-speech-recognition"

type Props = {
  // Called with the recognized text. The caller decides what to do with
  // it — append, replace, or parse a number out of it.
  onTranscript: (text: string) => void
  // Optional label shown next to the icon ("Записати голосом" etc).
  label?: string
}

export function VoiceInputButton({ onTranscript, label }: Props) {
  const { isListening, supported, start, stop } = useSpeechRecognition({
    onTranscript,
  })

  if (!supported) return null

  return (
    <Button
      type="button"
      size={label ? "sm" : "icon-sm"}
      variant={isListening ? "destructive" : "outline"}
      onClick={isListening ? stop : start}
      aria-label={isListening ? "Зупинити запис" : "Записати голосом"}
      title={isListening ? "Зупинити запис" : "Записати голосом"}
      className={isListening ? "animate-pulse" : undefined}
    >
      {isListening ? <RiStopCircleFill /> : <RiMicFill />}
      {label ? <span>{label}</span> : null}
    </Button>
  )
}
