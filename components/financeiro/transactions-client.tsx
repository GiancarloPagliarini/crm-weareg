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
import { Plus, Search, CheckCircle2, Circle } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type Props = {
  initialTransactions: Transaction[]
  businessUnits: Pick<BusinessUnit, "id" | "name" | "slug">[]
  categories: Pick<TransactionCategory, "id" | "name" | "type">[]
  bankAccounts: Pick<BankAccount, "id" | "bank_name">[]
}

const categoryTypeLabels: Record<string, string> = {
  receita: "Receita",
  custo_direto: "Custo direto",
  despesa_operacional: "Despesa op.",
  deducao: "Dedução",
  investimento: "Investimento",
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

  const filtered = initialTransactions.filter((t) => {
    const matchSearch =
      !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.counterpart_name?.toLowerCase().includes(search.toLowerCase()) ?? false)
    const matchType = filterType === "all" || t.type === filterType
    const matchBu = filterBu === "all" || t.business_unit_id === filterBu
    return matchSearch && matchType && matchBu
  })

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Lançamentos</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} registros</p>
        </div>
        <Button
          onClick={() => {
            setEditingTransaction(null)
            setDialogOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-1" />
          Novo lançamento
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar descrição ou contraparte..."
            className="pl-8"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={filterType} onValueChange={(v) => setFilterType(v ?? "all")}>
          <SelectTrigger className="w-36">
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
          <SelectTrigger className="w-44">
            <SelectValue>
              {(v: string) => v === "all" ? "Todas as BUs" : (businessUnits.find((bu) => bu.id === v)?.name ?? "BU")}
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

      {/* Tabela */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8"></TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>BU</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Banco</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-8"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                  Nenhum lançamento encontrado.
                </TableCell>
              </TableRow>
            )}
            {filtered.map((t) => (
              <TableRow key={t.id} className="group">
                <TableCell>
                  <button
                    onClick={() => handleReconcile(t.id, t.is_reconciled)}
                    className="text-muted-foreground hover:text-emerald-600 transition-colors"
                    title={t.is_reconciled ? "Conciliado" : "Marcar como conciliado"}
                  >
                    {t.is_reconciled
                      ? <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      : <Circle className="h-4 w-4" />
                    }
                  </button>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                  {formatDate(t.transaction_date)}
                </TableCell>
                <TableCell>
                  <p className="font-medium text-sm">{t.description}</p>
                  {t.counterpart_name && (
                    <p className="text-xs text-muted-foreground">{t.counterpart_name}</p>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {(t.business_units as any)?.name ?? "—"}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {(t.transaction_categories as any)?.name ?? "—"}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {(t.bank_accounts as any)?.bank_name ?? "—"}
                </TableCell>
                <TableCell className="text-right font-mono font-medium text-sm">
                  <span className={cn(
                    t.type === "entrada" ? "text-emerald-600" : "text-rose-600"
                  )}>
                    {t.type === "entrada" ? "+" : "-"}
                    {formatCurrency(t.amount)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setEditingTransaction(t)
                        setDialogOpen(true)
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2 text-xs text-rose-600 hover:text-rose-600"
                      onClick={() => handleDelete(t.id)}
                    >
                      Excluir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
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
