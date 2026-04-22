"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { BusinessUnit, TransactionCategory, CostFrequency } from "@/lib/types"
import type { CostRuleRow } from "@/app/financeiro/central-custo/[buId]/page"
import { createClient } from "@/lib/supabase/client"

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  bu: BusinessUnit
  categories: Pick<TransactionCategory, "id" | "name" | "type">[]
  rule: CostRuleRow | null
  onSuccess: () => void
}

const frequencies: { value: CostFrequency; label: string }[] = [
  { value: "diario",    label: "Diário" },
  { value: "semanal",   label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal",    label: "Mensal" },
  { value: "anual",     label: "Anual" },
]

const categoryTypeLabels: Record<string, string> = {
  receita: "Receita",
  custo_direto: "Custo direto",
  despesa_operacional: "Despesa operacional",
  deducao: "Dedução",
  investimento: "Investimento",
}

export function CostRuleDialog({ open, onOpenChange, bu, categories, rule, onSuccess }: Props) {
  const isEdit = !!rule

  const emptyForm = () => ({
    match_text: rule?.match_text ?? "",
    category_id: rule?.category_id ?? "",
    frequency: (rule?.frequency ?? "mensal") as CostFrequency,
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

  function handleField<K extends keyof ReturnType<typeof emptyForm>>(field: K, value: ReturnType<typeof emptyForm>[K]) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const matchText = form.match_text.trim()
    if (!matchText) {
      setError("Informe o trecho de descrição que identifica esse custo.")
      return
    }
    if (!form.category_id) {
      setError("Selecione uma categoria.")
      return
    }

    setLoading(true)
    const supabase = createClient()

    const payload = {
      match_text: matchText,
      business_unit_id: bu.id,
      category_id: form.category_id,
      frequency: form.frequency,
      is_active: true,
    }

    const { error: dbError } = isEdit
      ? await supabase.from("cost_rules").update({ ...payload, updated_at: new Date().toISOString() }).eq("id", rule!.id)
      : await supabase.from("cost_rules").insert(payload)

    setLoading(false)

    if (dbError) {
      if (dbError.code === "23505") {
        setError("Já existe uma regra ativa com esse mesmo texto.")
      } else {
        setError(dbError.message)
      }
      return
    }

    onSuccess()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col">

          <div className="px-6 pt-5 pb-4 border-b border-border/60">
            <DialogHeader>
              <DialogTitle className="text-base font-semibold">
                {isEdit ? "Editar regra" : "Nova regra de custo"}
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Unidade: <span className="text-foreground font-medium">{bu.name}</span>
              </p>
            </DialogHeader>
          </div>

          <div className="px-6 py-5 space-y-4">

            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Trecho da descrição</Label>
              <Input
                placeholder="Ex: NETFLIX"
                value={form.match_text}
                onChange={(e) => handleField("match_text", e.target.value)}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Transações importadas cuja descrição <strong>contenha</strong> esse texto (sem diferenciar maiúsculas) serão classificadas automaticamente por essa regra.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
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

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Frequência</Label>
                <Select
                  value={form.frequency}
                  onValueChange={(v) => handleField("frequency", (v ?? "mensal") as CostFrequency)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      {(v: string) => frequencies.find((f) => f.value === v)?.label ?? "Selecionar..."}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {frequencies.map((f) => (
                      <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-3 py-2.5 flex items-start gap-2">
                <span className="text-rose-400 text-base leading-none mt-0.5 shrink-0">⚠</span>
                <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">{error}</p>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-border/60 bg-muted/30 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : isEdit ? "Salvar alterações" : "Criar regra"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  )
}
