"use client"

import { usePrivacyMode } from "@/hooks/use-privacy-mode"

function maskDigits(input: string, visible = 2): string {
  let seen = 0
  return input.replace(/\d/g, (digit) => {
    if (seen < visible) {
      seen++
      return digit
    }
    return "*"
  })
}

type Props = {
  value: string
  visible?: number
  className?: string
}

export function MaskedValue({ value, visible = 2, className }: Props) {
  const { hidden } = usePrivacyMode()
  return (
    <span className={className} aria-label={hidden ? "valor oculto" : undefined}>
      {hidden ? maskDigits(value, visible) : value}
    </span>
  )
}
