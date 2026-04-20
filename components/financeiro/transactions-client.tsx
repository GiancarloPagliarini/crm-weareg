"use client"

import { useState, useTransition } from "react"
import { formatCurrency, formatDate } from "@/lib/formatters"
import type { Transaction, BusinessUnit, TransactionCategory, BankAccount } from "@/lib/types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TransactionDialog } from "./transaction-dialog"
import { Plus, Search, CheckCircle2, Circle, Trash2, CheckCheck, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Props = {
  initialTransactions: Transaction[]
  businessUnits: Pick<BusinessUnit, "id" | "name" | "slug">[]
  categories: Pick<TransactionCategory, "id" | "name" | "type">[]
  bankAccounts: Pick<BankAccount, "id" | "bank_name">[]
}

export function TransactionsClient({
  initialTransactions,
  businessUnits,
  categories,
  bankAccounts,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<string>("all")
  const [filterBu, setFilterBu] = useState<string>("all")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState(false)

  const filtered = initialTransactions.filter((t) => {
    const matchSearch =
      !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.counterpart_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchType = filterType === "all" || t.type === filterType
    const matchBu = filterBu === "all" || t.business_unit_id === filterBu
    return matchSearch && matchType && matchBu
  })

  const totalEntradas = filtered.filter(t => t.type === "entrada").reduce((s, t) => s + t.amount, 0)
  const totalSaidas   = filtered.filter(t => t.type === "saida").reduce((s, t) => s + t.amount, 0)
  const saldo         = totalEntradas - totalSaidas

  const filteredIds    = filtered.map((t) => t.id)
  const allSelected    = filteredIds.length > 0 && filteredIds.every((id) => selected.has(id))
  const someSelected   = filteredIds.some((id) => selected.has(id))
  const selectedInView = filteredIds.filter((id) => selected.has(id))

  function toggleAll() {
    if (allSelected) {
      setSelected((prev) => { const n = new Set(prev); filteredIds.forEach(id => n.delete(id)); return n })
    } else {
      setSelected((prev) => { const n = new Set(prev); filteredIds.forEach(id => n.add(id)); return n })
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  function clearSelection() { setSelected(new Set()) }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este lançamento?")) return
    const supabase = createClient()
    await supabase.from("transactions").delete().eq("id", id)
    startTransition(() => router.refresh())
  }

  async function handleReconcile(id: string, current: boolean) {
    const supabase = createClient()
    await supabase.from("transactions").update({ is_reconciled: !current }).eq("id", id)
    startTransition(() => router.refresh())
  }

  async function handleBulkDelete() {
    if (selectedInView.length === 0) return
    if (!confirm(`Excluir ${selectedInView.length} lançamento(s)?`)) return
    setBulkLoading(true)
    const supabase = createClient()
    await supabase.from("transactions").delete().in("id", selectedInView)
    clearSelection()
    setBulkLoading(false)
    startTransition(() => router.refresh())
  }

  async function handleBulkReconcile() {
    if (selectedInView.length === 0) return
    setBulkLoading(true)
    const supabase = createClient()
    await supabase.from("transactions").update({ is_reconciled: true }).in("id", selectedInView)
    clearSelection()
    setBulkLoading(false)
    startTransition(() => router.refresh())
  }

  return (
    <div className="space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Lançamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} registros</p>
        </div>
        <Button
          onClick={() => { setEditingTransaction(null); setDialogOpen(true) }}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" />
          Novo lançamento
        </Button>
      </div>

      {/* Sumário do período filtrado */}
      {filtered.length > 0 && (
        <div className="flex items-center gap-5 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="text-muted-foreground">Entradas</span>
            <span className="font-semibold text-emerald-600 tabular-nums">{formatCurrency(totalEntradas)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
            <span className="text-muted-foreground">Saídas</span>
            <span className="font-semibold text-rose-600 tabular-nums">{formatCurrency(totalSaidas)}</span>
          </div>
          <div className="w-px h-4 bg-border" />
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Saldo</span>
            <span className={cn(
              "font-bold tabular-nums",
              saldo > 0 ? "text-emerald-600" : saldo < 0 ? "text-rose-600" : "text-foreground"
            )}>
              {formatCurrency(saldo)}
            </span>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2 p-3 bg-muted/30 rounded-lg border border-border/60">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar descrição ou contraparte..."
            className="pl-8 bg-background"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
          <SelectTrigger className="w-36 bg-background">
            <SelectValue>
              {(v: string) => ({ all: "Todos", entrada: "Entradas", saida: "Saídas" }[v] ?? "Tipo")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="entrada">Entradas</SelectItem>
            <SelectItem value="saida">Saídas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterBu} onValueChange={(v) => setFilterBu(v ?? "all")}>
          <SelectTrigger className="w-44 bg-background">
            <SelectValue>
              {(v: string) => v === "all" ? "Todas as BUs" : (businessUnits.find(bu => bu.id === v)?.name ?? "BU")}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as BUs</SelectItem>
            {businessUnits.map((bu) => (
              <SelectItem key={bu.id} value={bu.id}>{bu.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Barra de ações em bulk */}
      {someSelected && (
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-border bg-muted/50 text-sm">
          <span className="font-semibold">{selectedInView.length} selecionado(s)</span>
          <div className="h-4 w-px bg-border" />
          <Button
            size="sm" variant="outline"
            className="h-7 text-xs gap-1.5"
            disabled={bulkLoading}
            onClick={handleBulkReconcile}
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Marcar conciliado
          </Button>
          <Button
            size="sm" variant="outline"
            className="h-7 text-xs gap-1.5 text-rose-600 hover:text-rose-600 border-rose-200 hover:border-rose-300 hover:bg-rose-50"
            disabled={bulkLoading}
            onClick={handleBulkDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Excluir
          </Button>
          <button
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={clearSelection}
          >
            Limpar seleção
          </button>
        </div>
      )}

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-10 px-3">
                <button
                  onClick={toggleAll}
                  className="flex items-center justify-center w-4 h-4"
                  title={allSelected ? "Desmarcar todos" : "Selecionar todos"}
                >
                  {allSelected
                    ? <CheckCircle2 className="h-4 w-4 text-primary" />
                    : someSelected
                    ? <Minus className="h-4 w-4 text-muted-foreground" />
                    : <Circle className="h-4 w-4 text-muted-foreground/40" />}
                </button>
              </TableHead>
              <TableHead className="w-8" />
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Data</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Descrição</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">BU</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Categoria</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide">Banco</TableHead>
              <TableHead className="text-xs font-semibold uppercase tracking-wide text-right">Valor</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Search className="h-7 w-7 opacity-25" />
                    <p className="text-sm">Nenhum lançamento encontrado.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}

            {filtered.map((t) => {
              const isSelected = selected.has(t.id)
              const isEntrada = t.type === "entrada"
              return (
                <TableRow
                  key={t.id}
                  className={cn("group", isSelected && "bg-muted/40")}
                >
                  {/* Seleção */}
                  <TableCell className="px-3">
                    <button onClick={() => toggleOne(t.id)} className="flex items-center justify-center w-4 h-4">
                      {isSelected
                        ? <CheckCircle2 className="h-4 w-4 text-primary" />
                        : <Circle className="h-4 w-4 text-muted-foreground/25 group-hover:text-muted-foreground/50 transition-colors" />}
                    </button>
                  </TableCell>

                  {/* Conciliação */}
                  <TableCell className="pr-0">
                    <button
                      onClick={() => handleReconcile(t.id, t.is_reconciled)}
                      title={t.is_reconciled ? "Conciliado" : "Marcar como conciliado"}
                      className={cn(
                        "flex items-center justify-center w-6 h-6 rounded-md transition-colors",
                        t.is_reconciled
                          ? "text-emerald-600"
                          : "text-muted-foreground/30 hover:text-emerald-600 hover:bg-emerald-50"
                      )}
                    >
                      {t.is_reconciled
                        ? <CheckCircle2 className="h-4 w-4" />
                        : <Circle className="h-4 w-4" />}
                    </button>
                  </TableCell>

                  {/* Data */}
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {formatDate(t.transaction_date)}
                  </TableCell>

                  {/* Descrição */}
                  <TableCell className="max-w-56">
                    <p className="font-medium text-sm truncate">{t.description}</p>
                    {t.counterpart_name && (
                      <p className="text-xs text-muted-foreground truncate">{t.counterpart_name}</p>
                    )}
                  </TableCell>

                  {/* BU */}
                  <TableCell>
                    <Badge variant="outline" className="text-xs font-medium">
                      {(t.business_units as any)?.name ?? "—"}
                    </Badge>
                  </TableCell>

                  {/* Categoria */}
                  <TableCell className="text-sm text-foreground/70 max-w-36">
                    <span className="truncate block">{(t.transaction_categories as any)?.name ?? "—"}</span>
                  </TableCell>

                  {/* Banco */}
                  <TableCell className="text-sm text-foreground/70 whitespace-nowrap">
                    {(t.bank_accounts as any)?.bank_name ?? "—"}
                  </TableCell>

                  {/* Valor */}
                  <TableCell className={cn(
                    "text-right font-mono font-semibold text-sm tabular-nums",
                    isEntrada ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {isEntrada ? "+" : "−"}{formatCurrency(t.amount)}
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="pr-3">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 px-2 text-xs"
                        onClick={() => { setEditingTransaction(t); setDialogOpen(true) }}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 px-2 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDelete(t.id)}
                      >
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      <TransactionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        transaction={editingTransaction}
        businessUnits={businessUnits}
        categories={categories}
        bankAccounts={bankAccounts}
        onSuccess={() => {
          setDialogOpen(false)
          startTransition(() => router.refresh())
        }}
      />
    </div>
  )
}
