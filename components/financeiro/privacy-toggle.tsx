"use client"

import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePrivacyMode } from "@/hooks/use-privacy-mode"

export function PrivacyToggle() {
  const { hidden, toggle } = usePrivacyMode()
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggle}
      aria-pressed={hidden}
      title={hidden ? "Mostrar valores" : "Ocultar valores"}
    >
      {hidden ? (
        <EyeOff className="h-3.5 w-3.5" />
      ) : (
        <Eye className="h-3.5 w-3.5" />
      )}
      <span className="ml-1">{hidden ? "Mostrar valores" : "Ocultar valores"}</span>
    </Button>
  )
}
