"use client"

import { useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { format, parseISO } from "date-fns"
import type { DateRange } from "react-day-picker"
import type { BusinessUnit } from "@/lib/types"
import { DateRangeFilter } from "./date-range-filter"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"

type Props = {
  businessUnits: Pick<BusinessUnit, "id" | "name">[]
}

export function DashboardFilters({ businessUnits }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const from = searchParams.get("from")
  const to   = searchParams.get("to")
  const bu   = searchParams.get("bu") ?? "all"

  const dateRange: DateRange | undefined = from
    ? { from: parseISO(from), to: to ? parseISO(to) : undefined }
    : undefined

  const hasAnyFilter = !!from || !!to || bu !== "all"

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([k, v]) => {
      if (v === null || v === "" || v === "all") params.delete(k)
      else params.set(k, v)
    })
    const query = params.toString()
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  function handleDateChange(range: DateRange | undefined) {
    if (!range?.from) {
      updateParams({ from: null, to: null })
      return
    }
    updateParams({
      from: format(range.from, "yyyy-MM-dd"),
      to:   format(range.to ?? range.from, "yyyy-MM-dd"),
    })
  }

  function handleBuChange(v: string | null) {
    updateParams({ bu: !v || v === "all" ? null : v })
  }

  return (
    <div
      data-pending={isPending ? "" : undefined}
      className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border/60 data-[pending]:opacity-70 transition-opacity"
    >
      <DateRangeFilter
        value={dateRange}
        onChange={handleDateChange}
        className="min-w-56"
        placeholder="Mês atual"
      />
      <Select value={bu} onValueChange={handleBuChange}>
        <SelectTrigger className="w-48 bg-background">
          <SelectValue>
            {(v: string) => v === "all"
              ? "Todas as BUs"
              : (businessUnits.find(b => b.id === v)?.name ?? "BU")}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as BUs</SelectItem>
          {businessUnits.map((b) => (
            <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {hasAnyFilter && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            startTransition(() => router.push(pathname))
          }}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
