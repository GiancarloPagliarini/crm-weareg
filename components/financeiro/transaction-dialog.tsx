"use client"

import { useState, useEffect, type ReactNode } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { Transaction, BusinessUnit, TransactionCategory, BankAccount } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  transaction: Transaction | null
  businessUnits: Pick<BusinessUnit, "id" | "name">[]
  categories: Pick<TransactionCategory, "id" | "name" | "type">[]
  bankAccounts: Pick<BankAccount, "id" | "bank_name">[]
  onSuccess: () => void
}

const categoryTypeLabels: Record<string, string> = {
  receita: "Receita",
  custo_direto: "Custo direto",
  despesa_operacional: "Despesa operacional",
  deducao: "Dedução",
  investimento: "Investimento",
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-foreground/60 whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  businessUnits,
  categories,
  bankAccounts,
  onSuccess,
}: Props) {
  const isEdit = !!transaction

  const today = new Date().toISOString().split("T")[0]

  const emptyForm = () => ({
    type: transaction?.type ?? "saida",
    amount: transaction?.amount?.toString() ?? "",
    description: transaction?.description ?? "",
    business_unit_id: transaction?.business_unit_id ?? "",
    category_id: transaction?.category_id ?? "",
    bank_account_id: transaction?.bank_account_id ?? "",
    transaction_date: transaction?.transaction_date ?? today,
    competence_date: transaction?.competence_date ?? today.slice(0, 7) + "-01",
    counterpart_name: transaction?.counterpart_name ?? "",
    notes: transaction?.notes ?? "",
  })

  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setForm(emptyForm())
      setError(null)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  function handleField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.description.trim()) {
      setError("Preencha a descrição.")
      return
    }
    if (!form.business_unit_id || !form.category_id || !form.bank_account_id) {
      setError("Preencha BU, categoria e conta bancária.")
      return
    }

    const rawAmount = form.amount.trim()
    const amount = rawAmount.includes(",")
      ? parseFloat(rawAmount.replace(/\./g, "").replace(",", "."))
      : parseFloat(rawAmount)
    if (isNaN(amount) || amount <= 0) {
      setError("Valor inválido.")
      return
    }

    setLoading(true)
    const supabase = createClient()

    const payload = {
      type: form.type,
      amount,
      description: form.description.trim(),
      business_unit_id: form.business_unit_id,
      category_id: form.category_id,
      bank_account_id: form.bank_account_id,
      transaction_date: form.transaction_date,
      competence_date: form.competence_date,
      counterpart_name: form.counterpart_name || null,
      notes: form.notes || null,
    }

    const { error: dbError } = isEdit
      ? await supabase.from("transactions").update(payload).eq("id", transaction!.id)
      : await supabase.from("transactions").insert(payload)

    setLoading(false)

    if (dbError) {
      setError(dbError.message)
      return
    }

    onSuccess()
  }

  const isEntrada = form.type === "entrada"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl p-0 gap-0 overflow-hidden">

        {/* Accent stripe — muda de cor com o tipo */}
        <div className={cn(
          "h-0.5 w-full shrink-0 transition-colors duration-300",
          isEntrada ? "bg-emerald-500" : "bg-rose-500"
        )} />

        <form onSubmit={handleSubmit} className="flex flex-col">

          {/* Header — tipo + valor em destaque */}
          <div className="px-6 pt-5 pb-5 border-b border-border/60">
            <DialogHeader className="mb-4">
              <DialogTitle className="text-base font-semibold pr-8">
                {isEdit ? "Editar lançamento" : "Novo lançamento"}
              </DialogTitle>
            </DialogHeader>

            <div className="flex items-center gap-3">
              {/* Toggle Entrada / Saída */}
              <div className="flex h-9 rounded-lg border border-input overflow-hidden shrink-0 text-sm">
                <button
                  type="button"
                  onClick={() => handleField("type", "entrada")}
                  className={cn(
                    "flex items-center px-5 font-medium transition-all duration-200",
                    isEntrada
                      ? "bg-emerald-500 text-white"
                      : "text-foreground/70 hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  Entrada
                </button>
                <div className="w-px bg-input shrink-0" />
                <button
                  type="button"
                  onClick={() => handleField("type", "saida")}
                  className={cn(
                    "flex items-center px-5 font-medium transition-all duration-200",
                    !isEntrada
                      ? "bg-rose-500 text-white"
                      : "text-foreground/70 hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  Saída
                </button>
              </div>

              {/* Valor — campo principal em destaque */}
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground/70 pointer-events-none select-none">
                  R$
                </span>
                <Input
                  placeholder="0,00"
                  value={form.amount}
                  onChange={(e) => handleField("amount", e.target.value)}
                  inputMode="decimal"
                  className={cn(
                    "pl-9 h-9 text-base font-semibold",
                    isEntrada
                      ? "focus-visible:border-emerald-400 focus-visible:ring-emerald-400/20"
                      : "focus-visible:border-rose-400 focus-visible:ring-rose-400/20"
                  )}
                />
              </div>
            </div>
          </div>

          {/* Corpo do formulário */}
          <div className="px-6 py-5 space-y-5">

            {/* Descrição */}
            <div className="space-y-2.5">
              <SectionLabel>Descrição</SectionLabel>
              <Input
                placeholder="Ex: Pagamento de editor"
                value={form.description}
                onChange={(e) => handleField("description", e.target.value)}
              />
            </div>

            {/* Classificação */}
            <div className="space-y-2.5">
              <SectionLabel>Classificação</SectionLabel>
              <div className="grid grid-cols-[1fr_2fr] gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Unidade de negócio</Label>
                  <Select
                    value={form.business_unit_id || null}
                    onValueChange={(v) => handleField("business_unit_id", v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar...">
                        {(v: string | null) => v ? (businessUnits.find((bu) => bu.id === v)?.name ?? v) : "Selecionar..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {businessUnits.map((bu) => (
                        <SelectItem key={bu.id} value={bu.id}>{bu.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Categoria</Label>
                  <Select
                    value={form.category_id || null}
                    onValueChange={(v) => handleField("category_id", v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar...">
                        {(v: string | null) => v ? (categories.find((c) => c.id === v)?.name ?? v) : "Selecionar..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                          <span className="text-muted-foreground text-xs ml-1">
                            — {categoryTypeLabels[cat.type] ?? cat.type}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Pagamento */}
            <div className="space-y-2.5">
              <SectionLabel>Pagamento</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Conta bancária</Label>
                  <Select
                    value={form.bank_account_id || null}
                    onValueChange={(v) => handleField("bank_account_id", v ?? "")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecionar...">
                        {(v: string | null) => v ? (bankAccounts.find((b) => b.id === v)?.bank_name ?? v) : "Selecionar..."}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {bankAccounts.map((b) => (
                        <SelectItem key={b.id} value={b.id}>{b.bank_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">
                    Contraparte <span className="text-muted-foreground font-normal">(opcional)</span>
                  </Label>
                  <Input
                    placeholder="Ex: Meta Ads, Editor João"
                    value={form.counterpart_name}
                    onChange={(e) => handleField("counterpart_name", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Datas */}
            <div className="space-y-2.5">
              <SectionLabel>Datas</SectionLabel>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Data efetiva</Label>
                  <Input
                    type="date"
                    value={form.transaction_date}
                    onChange={(e) => handleField("transaction_date", e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">Competência</Label>
                  <Input
                    type="date"
                    value={form.competence_date}
                    onChange={(e) => handleField("competence_date", e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Observações */}
            <div className="space-y-2.5">
              <SectionLabel>
                Observações <span className="normal-case font-normal tracking-normal text-muted-foreground">(opcional)</span>
              </SectionLabel>
              <Textarea
                placeholder="Observações opcionais..."
                value={form.notes}
                onChange={(e) => handleField("notes", e.target.value)}
                rows={2}
              />
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 px-3 py-2.5 flex items-start gap-2">
                <span className="text-rose-400 text-base leading-none mt-0.5 shrink-0">⚠</span>
                <p className="text-sm text-rose-700 font-medium">{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-border/60 bg-muted/30 flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {isEdit ? "Editando lançamento existente" : "Todos os campos marcados são obrigatórios"}
            </p>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className={cn(
                  "transition-colors duration-200",
                  isEntrada
                    ? "bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white border-transparent"
                    : "bg-rose-600 hover:bg-rose-700 dark:bg-rose-600 dark:hover:bg-rose-700 text-white border-transparent"
                )}
              >
                {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar lançamento"}
              </Button>
            </div>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  )
}
