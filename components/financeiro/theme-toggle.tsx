"use client"

import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Alternar tema"
      >
        <Sun className="h-3.5 w-3.5 dark:hidden" />
        <Moon className="hidden h-3.5 w-3.5 dark:block" />
        <span>Tema</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" side="top">
        <DropdownMenuItem onClick={() => setTheme("light")} aria-checked={theme === "light"}>
          <Sun className="h-4 w-4" />
          Claro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} aria-checked={theme === "dark"}>
          <Moon className="h-4 w-4" />
          Escuro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} aria-checked={theme === "system"}>
          <Monitor className="h-4 w-4" />
          Sistema
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
