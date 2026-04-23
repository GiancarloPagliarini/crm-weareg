"use client"

import { useMemo, useState, useTransition } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { format, parseISO } from "date-fns"
import type { DateRange } from "react-day-picker"
import { formatCurrency, formatPercent } from "@/lib/formatters"
import type { ProfitDistributionRow } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { DateRangeFilter } from "./date-range-filter"
import { cn } from "@/lib/utils"

function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

const PALETTE = [
  { avatar: "bg-blue-100 text-blue-700" },
  { avatar: "bg-violet-100 text-violet-700" },
  { avatar: "bg-amber-100 text-amber-700" },
  { avatar: "bg-teal-100 text-teal-700" },
  { avatar: "bg-rose-100 text-rose-700" },
]

type Props = {
  distribution: ProfitDistributionRow[]
  periodLabel: string
}

export function SociosClient({ distribution, periodLabel }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [filterPartner, setFilterPartner] = useState<string>("all")
  const [filterBu, setFilterBu] = useState<string>("all")

  const from = searchParams.get("from")
  const to   = searchParams.get("to")
  const dateRange: DateRange | undefined = from
    ? { from: parseISO(from), to: to ? parseISO(to) : undefined }
    : undefined

  const partners = useMemo(() => {
    const set = new Set(distribution.map((r) => r.partner_name))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [distribution])

  const bus = useMemo(() => {
    const set = new Set(distribution.map((r) => r.business_unit_name))
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [distribution])

  const filtered = distribution.filter((r) => {
    const matchPartner = filterPartner === "all" || r.partner_name === filterPartner
    const matchBu      = filterBu === "all" || r.business_unit_name === filterBu
    return matchPartner && matchBu
  })

  const byPartner = filtered.reduce<
    Record<string, { total: number; rows: ProfitDistributionRow[] }>
  >((acc, row) => {
    if (!acc[row.partner_name]) acc[row.partner_name] = { total: 0, rows: [] }
    acc[row.partner_name].total += row.partner_profit
    acc[row.partner_name].rows.push(row)
    return acc
  }, {})

  const partnerEntries = Object.entries(byPartner)
  const totalDistribuido = filtered.reduce((sum, r) => sum + r.partner_profit, 0)

  const isFiltered = filterPartner !== "all" || filterBu !== "all"
  const hasPeriodFilter = !!from

  function handleDateChange(range: DateRange | undefined) {
    const params = new URLSearchParams(searchParams.toString())
    if (!range?.from) {
      params.delete("from")
      params.delete("to")
    } else {
      params.set("from", format(range.from, "yyyy-MM-dd"))
      params.set("to",   format(range.to ?? range.from, "yyyy-MM-dd"))
    }
    const query = params.toString()
    startTransition(() => {
      router.push(query ? `${pathname}?${query}` : pathname)
    })
  }

  function clearAllFilters() {
    setFilterPartner("all")
    setFilterBu("all")
    startTransition(() => router.push(pathname))
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Distribuição de Lucro</h1>
          <p className="text-sm text-muted-foreground mt-1 capitalize">{periodLabel}</p>
        </div>

        {filtered.length > 0 && (
          <div className="text-right shrink-0">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-0.5">
              Total distribuído{isFiltered && " (filtrado)"}
            </p>
            <p className={cn(
              "text-2xl font-bold tabular-nums",
              totalDistribuido > 0 ? "text-emerald-600"
              : totalDistribuido < 0 ? "text-rose-600"
              : "text-foreground"
            )}>
              {formatCurrency(totalDistribuido)}
            </p>
          </div>
        )}
      </div>

      {/* Filtros */}
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
        <Select value={filterPartner} onValueChange={(v) => setFilterPartner(v ?? "all")}>
          <SelectTrigger className="w-48 bg-background">
            <SelectValue>
              {(v: string) => v === "all" ? "Todos os sócios" : v}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os sócios</SelectItem>
            {partners.map((p) => (
              <SelectItem key={p} value={p}>{p}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterBu} onValueChange={(v) => setFilterBu(v ?? "all")}>
          <SelectTrigger className="w-48 bg-background">
            <SelectValue>
              {(v: string) => v === "all" ? "Todas as BUs" : v}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as BUs</SelectItem>
            {bus.map((b) => (
              <SelectItem key={b} value={b}>{b}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(isFiltered || hasPeriodFilter) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Cards por sócio */}
      {partnerEntries.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {partnerEntries.map(([partner, data], idx) => {
            const palette = PALETTE[idx % PALETTE.length]
            const isPos = data.total > 0
            const isNeg = data.total < 0
            return (
              <Card key={partner} className="overflow-hidden py-0 gap-0">
                <div className={cn(
                  "h-0.5 w-full",
                  isPos ? "bg-emerald-400" : isNeg ? "bg-rose-400" : "bg-border"
                )} />
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                      palette.avatar
                    )}>
                      {initials(partner)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm leading-snug truncate">{partner}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {data.rows.length} {data.rows.length === 1 ? "unidade" : "unidades"}
                      </p>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border/60">
                    <p className={cn(
                      "text-2xl font-bold tabular-nums leading-none",
                      isPos ? "text-emerald-600" : isNeg ? "text-rose-600" : "text-foreground"
                    )}>
                      {formatCurrency(data.total)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1.5">lucro do período</p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {partnerEntries.length === 0 && (
        <Card className="py-0 gap-0">
          <div className="text-center text-muted-foreground py-16 text-sm">
            {distribution.length === 0
              ? "Sem dados para o período. Cadastre lançamentos e participações societárias."
              : "Nenhum resultado para os filtros aplicados."}
          </div>
        </Card>
      )}

      {/* Detalhamento por BU — um card por sócio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {partnerEntries.map(([partner, data], partnerIdx) => {
          const palette = PALETTE[partnerIdx % PALETTE.length]
          const isPos = data.total > 0
          const isNeg = data.total < 0

          return (
            <Card key={partner} className="overflow-hidden py-0 gap-0">
              {/* Cabeçalho do card */}
              <div className="px-5 py-4 border-b border-border/60 flex items-center gap-3">
                <div className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  palette.avatar
                )}>
                  {initials(partner)}
                </div>
                <span className="font-semibold text-sm flex-1 truncate">{partner}</span>
                <span className={cn(
                  "font-bold text-sm tabular-nums shrink-0",
                  isPos ? "text-emerald-600" : isNeg ? "text-rose-600" : "text-foreground"
                )}>
                  {formatCurrency(data.total)}
                </span>
              </div>

              {/* Tabela de BUs */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-5">Unidade de negócio</TableHead>
                    <TableHead className="text-right">Part.</TableHead>
                    <TableHead className="text-right">Lucro BU</TableHead>
                    <TableHead className="text-right pr-5">Seu lucro</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.rows.map((row, rowIdx) => (
                    <TableRow key={rowIdx}>
                      <TableCell className="pl-5 text-sm py-3">{row.business_unit_name}</TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground tabular-nums py-3">
                        {formatPercent(row.share_percentage)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right font-mono text-sm tabular-nums py-3",
                        row.bu_net_profit < 0 ? "text-rose-600" : "text-foreground/80"
                      )}>
                        {formatCurrency(row.bu_net_profit)}
                      </TableCell>
                      <TableCell className={cn(
                        "text-right pr-5 font-mono font-semibold text-sm tabular-nums py-3",
                        row.partner_profit > 0 ? "text-emerald-600"
                        : row.partner_profit < 0 ? "text-rose-600"
                        : "text-foreground"
                      )}>
                        {formatCurrency(row.partner_profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
