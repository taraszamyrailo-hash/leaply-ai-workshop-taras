"use client"

// Thin wrapper around the browser's Web Speech API (SpeechRecognition).
// Returns a small hook surface — start / stop / isListening / supported —
// plus an `onTranscript` callback fired with the final recognized text.
//
// Note: the API is shipped under different names per browser
// (`SpeechRecognition` in standards-compliant builds, `webkitSpeechRecognition`
// in Chrome/Edge). Firefox doesn't ship it at all yet — `supported` will be
// false there and the calling UI is expected to hide its mic button.

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"

// The browser global is loose; we deliberately model just what we use.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionEvent = any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SpeechRecognitionInstance = any

type Options = {
  lang?: string
  onTranscript: (text: string) => void
  onError?: (message: string) => void
}

export function useSpeechRecognition({
  lang = "uk-UA",
  onTranscript,
  onError,
}: Options) {
  const [isListening, setIsListening] = useState(false)
  // Use useSyncExternalStore so the supported flag is consistent between
  // server (false) and client (real value) without triggering the
  // set-state-in-effect lint rule.
  const supported = useSyncExternalStore(
    () => () => {},
    () =>
      typeof window !== "undefined" &&
      Boolean(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).SpeechRecognition ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).webkitSpeechRecognition
      ),
    () => false
  )
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const onTranscriptRef = useRef(onTranscript)
  const onErrorRef = useRef(onError)

  // Latest callbacks captured in refs so we don't have to rebuild the
  // recognition instance whenever the parent rerenders.
  useEffect(() => {
    onTranscriptRef.current = onTranscript
    onErrorRef.current = onError
  }, [onTranscript, onError])

  useEffect(() => {
    if (typeof window === "undefined") return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Ctor: any =
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).SpeechRecognition ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).webkitSpeechRecognition
    if (!Ctor) return

    const recognition: SpeechRecognitionInstance = new Ctor()
    recognition.lang = lang
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event?.results?.[0]?.[0]?.transcript
      if (typeof result === "string" && result.trim().length > 0) {
        onTranscriptRef.current(result.trim())
      }
    }
    recognition.onerror = (event: SpeechRecognitionEvent) => {
      setIsListening(false)
      onErrorRef.current?.(String(event?.error ?? "speech_error"))
    }
    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition

    return () => {
      try {
        recognition.abort?.()
      } catch {
        // ignore
      }
    }
  }, [lang])

  const start = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) return
    try {
      rec.start()
      setIsListening(true)
    } catch (err) {
      // start() throws if already started — ignore that case.
      onErrorRef.current?.(String(err))
    }
  }, [])

  const stop = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) return
    try {
      rec.stop()
    } catch {
      // ignore
    }
  }, [])

  return { isListening, supported, start, stop }
}
