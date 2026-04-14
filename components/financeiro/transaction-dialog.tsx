"use client"

import { useState } from "react"
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

  const [form, setForm] = useState({
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

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.business_unit_id || !form.category_id || !form.bank_account_id) {
      setError("Preencha BU, categoria e conta bancária.")
      return
    }

    const amount = parseFloat(form.amount.replace(",", "."))
    if (isNaN(amount) || amount <= 0) {
      setError("Valor inválido.")
      return
    }

    setLoading(true)
    const supabase = createClient()

    const payload = {
      type: form.type,
      amount,
      description: form.description,
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

  // Ao abrir o dialog, sincroniza o form com a transaction (ou reseta)
  function handleOpenChange(val: boolean) {
    if (val) {
      setForm({
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
      setError(null)
    }
    onOpenChange(val)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select value={form.type} onValueChange={(v) => handleField("type", v ?? "saida")}>
                <SelectTrigger>
                  <SelectValue>
                    {(v: string) => v === "entrada" ? "Entrada" : "Saída"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entrada">Entrada</SelectItem>
                  <SelectItem value="saida">Saída</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Valor (R$)</Label>
              <Input
                placeholder="0,00"
                value={form.amount}
                onChange={(e) => handleField("amount", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="space-y-1.5">
            <Label>Descrição</Label>
            <Input
              placeholder="Ex: Pagamento de editor"
              value={form.description}
              onChange={(e) => handleField("description", e.target.value)}
              required
            />
          </div>

          {/* BU + Categoria */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Unidade de negócio</Label>
              <Select value={form.business_unit_id} onValueChange={(v) => handleField("business_unit_id", v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar...">
                    {(v: string) => businessUnits.find((bu) => bu.id === v)?.name ?? "Selecionar..."}
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
              <Label>Categoria</Label>
              <Select value={form.category_id} onValueChange={(v) => handleField("category_id", v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar...">
                    {(v: string) => categories.find((c) => c.id === v)?.name ?? "Selecionar..."}
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

          {/* Banco + Contraparte */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Conta bancária</Label>
              <Select value={form.bank_account_id} onValueChange={(v) => handleField("bank_account_id", v ?? "")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar...">
                    {(v: string) => bankAccounts.find((b) => b.id === v)?.bank_name ?? "Selecionar..."}
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
              <Label>Contraparte</Label>
              <Input
                placeholder="Ex: Meta Ads, Editor João"
                value={form.counterpart_name}
                onChange={(e) => handleField("counterpart_name", e.target.value)}
              />
            </div>
          </div>

          {/* Datas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Data efetiva</Label>
              <Input
                type="date"
                value={form.transaction_date}
                onChange={(e) => handleField("transaction_date", e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data de competência</Label>
              <Input
                type="date"
                value={form.competence_date}
                onChange={(e) => handleField("competence_date", e.target.value)}
                required
              />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label>Observações</Label>
            <Textarea
              placeholder="Observações opcionais..."
              value={form.notes}
              onChange={(e) => handleField("notes", e.target.value)}
              rows={2}
            />
          </div>

          {error && (
            <p className="text-sm text-rose-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : isEdit ? "Salvar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
