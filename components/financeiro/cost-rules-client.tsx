"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatCurrency, formatDate } from "@/lib/formatters"
import type { BusinessUnit, TransactionCategory, CostFrequency } from "@/lib/types"
import type { CostRuleRow } from "@/app/financeiro/central-custo/[buId]/page"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CostRuleDialog } from "./cost-rule-dialog"
import { ArrowLeft, Plus, Pencil, Trash2, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

const toMonthly: Record<CostFrequency, number> = {
  diario: 30,
  semanal: 30 / 7,
  quinzenal: 2,
  mensal: 1,
  anual: 1 / 12,
}

const freqLabels: Record<CostFrequency, string> = {
  diario: "Diário",
  semanal: "Semanal",
  quinzenal: "Quinzenal",
  mensal: "Mensal",
  anual: "Anual",
}

const freqColors: Record<CostFrequency, string> = {
  diario:    "text-rose-600   border-rose-200   bg-rose-50   dark:text-rose-300   dark:border-rose-900   dark:bg-rose-950/40",
  semanal:   "text-amber-600  border-amber-200  bg-amber-50  dark:text-amber-300  dark:border-amber-900  dark:bg-amber-950/40",
  quinzenal: "text-violet-600 border-violet-200 bg-violet-50 dark:text-violet-300 dark:border-violet-900 dark:bg-violet-950/40",
  mensal:    "text-blue-600   border-blue-200   bg-blue-50   dark:text-blue-300   dark:border-blue-900   dark:bg-blue-950/40",
  anual:     "text-teal-600   border-teal-200   bg-teal-50   dark:text-teal-300   dark:border-teal-900   dark:bg-teal-950/40",
}

type Props = {
  bu: BusinessUnit
  initialRules: CostRuleRow[]
  categories: Pick<TransactionCategory, "id" | "name" | "type">[]
}

export function CostRulesClient({ bu, initialRules, categories }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<CostRuleRow | null>(null)
  const [search, setSearch] = useState("")
  const [filterFreq, setFilterFreq] = useState<string>("all")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("match_text")

  const filtered = initialRules
    .filter((r) => {
      const term = search.toLowerCase()
      const matchSearch =
        !term ||
        r.match_text.toLowerCase().includes(term) ||
        (r.transaction_categories?.name.toLowerCase().includes(term) ?? false)
      const matchFreq = filterFreq === "all" || r.frequency === filterFreq
      const matchCat  = filterCategory === "all" || r.category_id === filterCategory
      return matchSearch && matchFreq && matchCat
    })
    .sort((a, b) => {
      if (sortBy === "monthly_desc") {
        const ma = Number(a.last_amount ?? 0) * toMonthly[a.frequency]
        const mb = Number(b.last_amount ?? 0) * toMonthly[b.frequency]
        return mb - ma
      }
      if (sortBy === "last_date_desc") {
        return (b.last_date ?? "").localeCompare(a.last_date ?? "")
      }
      return a.match_text.localeCompare(b.match_text)
    })

  const totalMensal = filtered.reduce((acc, r) => {
    return acc + Number(r.last_amount ?? 0) * toMonthly[r.frequency]
  }, 0)

  const isFiltered =
    search !== "" || filterFreq !== "all" || filterCategory !== "all"

  function clearFilters() {
    setSearch("")
    setFilterFreq("all")
    setFilterCategory("all")
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir essa regra? As transações já classificadas continuam, mas novas importações não serão mais auto-classificadas por ela.")) return
    const supabase = createClient()
    await supabase.from("cost_rules").delete().eq("id", id)
    startTransition(() => router.refresh())
  }

  function openNew() {
    setEditing(null)
    setDialogOpen(true)
  }

  function openEdit(rule: CostRuleRow) {
    setEditing(rule)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/financeiro/central-custo"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            Central de Custo
          </Link>
          <h1 className="text-2xl font-semibold">{bu.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isFiltered ? (
              <>
                <span className="font-medium text-foreground">{filtered.length}</span> de {initialRules.length}{" "}
                {initialRules.length === 1 ? "regra" : "regras"}
              </>
            ) : (
              <>
                {initialRules.length} {initialRules.length === 1 ? "regra ativa" : "regras ativas"}
              </>
            )}
          </p>
        </div>

        <Button onClick={openNew} className="shrink-0">
          <Plus className="h-4 w-4" />
          Nova regra
        </Button>
      </div>

      {/* Totais */}
      <Card className="overflow-hidden py-0 gap-0">
        <div className="h-0.5 w-full bg-primary/40" />
        <CardContent className="p-5">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Custo mensal estimado
              </p>
              <p className="text-3xl font-bold tabular-nums leading-none">
                {formatCurrency(totalMensal)}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Custo anual estimado
              </p>
              <p className="text-3xl font-bold tabular-nums leading-none text-foreground/70">
                {formatCurrency(totalMensal * 12)}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            {isFiltered
              ? "Soma das regras visíveis no filtro atual, normalizadas pelo último lançamento."
              : "Soma das regras ativas normalizadas. Baseado no último lançamento de cada regra."}
          </p>
        </CardContent>
      </Card>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border/60">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar match ou categoria..."
            className="pl-8 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterFreq} onValueChange={(v) => setFilterFreq(v ?? "all")}>
          <SelectTrigger className="w-40 bg-background">
            <SelectValue>
              {(v: string) => v === "all" ? "Todas frequências" : freqLabels[v as CostFrequency]}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas frequências</SelectItem>
            <SelectItem value="diario">Diário</SelectItem>
            <SelectItem value="semanal">Semanal</SelectItem>
            <SelectItem value="quinzenal">Quinzenal</SelectItem>
            <SelectItem value="mensal">Mensal</SelectItem>
            <SelectItem value="anual">Anual</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? "all")}>
          <SelectTrigger className="w-48 bg-background">
            <SelectValue>
              {(v: string) => v === "all"
                ? "Todas categorias"
                : (categories.find(c => c.id === v)?.name ?? "Categoria")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas categorias</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v ?? "match_text")}>
          <SelectTrigger className="w-44 bg-background">
            <SelectValue>
              {(v: string) => ({
                match_text: "Ordem: Match (A–Z)",
                monthly_desc: "Ordem: Mensal (maior)",
                last_date_desc: "Ordem: Último lançam.",
              }[v] ?? "Ordem")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="match_text">Match (A–Z)</SelectItem>
            <SelectItem value="monthly_desc">Mensal (maior)</SelectItem>
            <SelectItem value="last_date_desc">Último lançamento</SelectItem>
          </SelectContent>
        </Select>
        {isFiltered && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar filtros
          </Button>
        )}
      </div>

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Match</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Categoria</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Frequência</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">Último valor</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">Mensal equiv.</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-16 text-center text-sm text-muted-foreground">
                  {initialRules.length === 0 ? (
                    <>Nenhuma regra cadastrada ainda. Clique em <span className="font-medium text-foreground">Nova regra</span> para começar.</>
                  ) : (
                    <>Nenhuma regra corresponde aos filtros aplicados.</>
                  )}
                </TableCell>
              </TableRow>
            )}

            {filtered.map((rule) => {
              const last = Number(rule.last_amount ?? 0)
              const monthly = last * toMonthly[rule.frequency]
              return (
                <TableRow key={rule.id} className="group">
                  <TableCell>
                    <p className="font-mono font-medium text-sm">{rule.match_text}</p>
                    {rule.last_date && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Último: {formatDate(rule.last_date)}
                      </p>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-foreground/70">
                    {rule.transaction_categories?.name ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={cn("text-xs font-medium", freqColors[rule.frequency])}>
                      {freqLabels[rule.frequency]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-sm">
                    {last > 0 ? formatCurrency(last) : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-sm font-semibold">
                    {monthly > 0 ? formatCurrency(monthly) : <span className="text-muted-foreground font-normal">—</span>}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => openEdit(rule)}
                        title="Editar"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        onClick={() => handleDelete(rule.id)}
                        title="Excluir"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <CostRuleDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bu={bu}
        categories={categories}
        rule={editing}
        onSuccess={() => {
          setDialogOpen(false)
          startTransition(() => router.refresh())
        }}
      />
    </div>
  )
}
