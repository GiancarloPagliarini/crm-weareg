"use client"

import { LogOut } from "lucide-react"
import { signOut } from "@/app/login/actions"

export function LogoutButton() {
  return (
    <button
      onClick={() => signOut()}
      className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
    >
      <LogOut className="h-3.5 w-3.5" />
      Sair
    </button>
  )
}
