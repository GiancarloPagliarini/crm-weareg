"use client"

import { useState, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { parseOFX } from "@/lib/ofx-parser"
import { formatCurrency, formatDate } from "@/lib/formatters"
import type { BusinessUnit, TransactionCategory, BankAccount } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import {
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ArrowRight,
  Minus,
} from "lucide-react"

type Props = {
  businessUnits: Pick<BusinessUnit, "id" | "name">[]
  categories: Pick<TransactionCategory, "id" | "name" | "type">[]
  bankAccounts: Pick<BankAccount, "id" | "bank_name">[]
}

type RowConfig = {
  skip: boolean
  business_unit_id: string
  category_id: string
}

const categoryTypeLabels: Record<string, string> = {
  receita: "Receita",
  custo_direto: "Custo direto",
  despesa_operacional: "Desp. op.",
  deducao: "Dedução",
  investimento: "Investimento",
}

const categoryTypeColors: Record<string, string> = {
  receita: "text-emerald-600",
  custo_direto: "text-rose-500",
  despesa_operacional: "text-amber-600",
  deducao: "text-orange-500",
  investimento: "text-blue-500",
}

// ── Select compacto para uso dentro da tabela ────────────────
function InlineSelect({
  value,
  onChange,
  placeholder,
  options,
  getLabel,
  wide,
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  options: { id: string; label: string; sub?: string; subColor?: string }[]
  getLabel: (id: string) => string
  wide?: boolean
}) {
  const filled = !!value

  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
      <SelectTrigger
        className={cn(
          "h-7 text-xs border transition-all duration-150 w-full",
          filled
            ? "border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
            : "border-dashed border-muted-foreground/40 text-muted-foreground hover:border-muted-foreground/70 hover:bg-muted/40"
        )}
      >
        <SelectValue>
          {(v: string) => (
            <span className="truncate block">
              {v ? getLabel(v) : placeholder}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        alignItemWithTrigger={false}
        align="start"
        className={cn(wide ? "min-w-[260px]" : "min-w-[180px]")}
      >
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            <span className="flex items-center justify-between gap-3 w-full">
              <span>{opt.label}</span>
              {opt.sub && (
                <span className={cn("text-xs", opt.subColor ?? "text-muted-foreground")}>
                  {opt.sub}
                </span>
              )}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type Institution = "c6" | "santander"

const INSTITUTION_CONFIG: Record<Institution, {
  label: string
  color: string
  borderColor: string
  bgColor: string
  steps: string[]
}> = {
  c6: {
    label: "C6 Bank",
    color: "text-yellow-700",
    borderColor: "border-yellow-300",
    bgColor: "bg-yellow-50",
    steps: [
      "Acesse o Internet Banking do C6",
      "Vá em Extrato → Exportar",
      "Selecione o período desejado",
      "Escolha o formato OFX e baixe",
    ],
  },
  santander: {
    label: "Santander",
    color: "text-red-700",
    borderColor: "border-red-200",
    bgColor: "bg-red-50",
    steps: [
      "Acesse o Internet Banking do Santander",
      "Vá em Conta → Extrato",
      "Selecione o período desejado",
      "Clique em Exportar e escolha OFX",
    ],
  },
}

export function OFXImportClient({ businessUnits, categories, bankAccounts }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [institution, setInstitution] = useState<Institution | null>(null)
  const [parsed, setParsed] = useState<ReturnType<typeof parseOFX> | null>(null)
  const [fileName, setFileName] = useState("")
  const [globalBu, setGlobalBu] = useState("")
  const [globalBank, setGlobalBank] = useState("")
  const [rowConfigs, setRowConfigs] = useState<Record<number, RowConfig>>({})
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [importedCount, setImportedCount] = useState(0)

  function handleSelectInstitution(inst: Institution) {
    setInstitution(inst)
    // Tenta pré-selecionar a conta bancária correspondente
    const keyword = inst === "c6" ? "c6" : "santander"
    const match = bankAccounts.find((b) =>
      b.bank_name.toLowerCase().includes(keyword)
    )
    if (match) setGlobalBank(match.id)
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const content = ev.target?.result as string
      const result = parseOFX(content)
      setParsed(result)
      const configs: Record<number, RowConfig> = {}
      result.transactions.forEach((_, i) => {
        configs[i] = { skip: false, business_unit_id: "", category_id: "" }
      })
      setRowConfigs(configs)
      setStep(2)
    }
    reader.readAsText(file, "latin1")
  }

  function getRowConfig(i: number): RowConfig {
    return rowConfigs[i] ?? { skip: false, business_unit_id: "", category_id: "" }
  }

  function setRowField(i: number, field: keyof RowConfig, value: string | boolean) {
    setRowConfigs((prev) => ({
      ...prev,
      [i]: { ...getRowConfig(i), [field]: value },
    }))
  }

  function applyGlobalToAll() {
    if (!globalBu) return
    setRowConfigs((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => {
        const i = parseInt(k)
        next[i] = { ...next[i], business_unit_id: globalBu }
      })
      return next
    })
  }

  function applyOutrasDespesasToAll() {
    const outrasDespesas = categories.find(
      (c) => c.name === "Outras despesas" || (c as any).slug === "outras-despesas"
    )
    if (!outrasDespesas) return
    setRowConfigs((prev) => {
      const next = { ...prev }
      Object.keys(next).forEach((k) => {
        const i = parseInt(k)
        if (!next[i].skip) {
          next[i] = { ...next[i], category_id: outrasDespesas.id }
        }
      })
      return next
    })
  }

  async function handleImport() {
    if (!parsed) return
    setImportError(null)
    setImporting(true)

    const transactions = parsed.transactions
      .map((t, i) => {
        const cfg = getRowConfig(i)
        if (cfg.skip) return null
        const buId = cfg.business_unit_id || globalBu
        const catId = cfg.category_id
        if (!buId || !catId || !globalBank) return null
        return {
          business_unit_id: buId,
          category_id: catId,
          bank_account_id: globalBank,
          type: t.amount > 0 ? "entrada" : "saida",
          amount: Math.abs(t.amount),
          description: t.memo || `OFX ${t.fitid}`,
          transaction_date: t.date,
          competence_date: t.date.slice(0, 7) + "-01",
          notes: `Importado via OFX | FITID: ${t.fitid}`,
        } as const
      })
      .filter(Boolean)

    if (transactions.length === 0) {
      setImportError("Nenhuma transação pronta. Verifique BU, categoria e banco.")
      setImporting(false)
      return
    }

    const res = await fetch("/api/financeiro/importar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactions }),
    })
    const data = await res.json()
    setImporting(false)
    if (!res.ok) { setImportError(data.error ?? "Erro ao importar."); return }
    setImportedCount(data.imported)
    setStep(3)
  }

  const total = parsed?.transactions.length ?? 0
  const skipped = Object.values(rowConfigs).filter((c) => c.skip).length
  const readyToImport = parsed?.transactions.filter((_, i) => {
    const cfg = getRowConfig(i)
    if (cfg.skip) return false
    return (cfg.business_unit_id || globalBu) && cfg.category_id && globalBank
  }).length ?? 0

  const buOptions = businessUnits.map((bu) => ({ id: bu.id, label: bu.name }))
  const catOptions = categories.map((cat) => ({
    id: cat.id,
    label: cat.name,
    sub: categoryTypeLabels[cat.type],
    subColor: categoryTypeColors[cat.type],
  }))
  const bankOptions = bankAccounts.map((b) => ({ id: b.id, label: b.bank_name }))

  // ── Step 3: Sucesso ──────────────────────────────────────────
  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center py-28 gap-5">
        <div className="w-16 h-16 rounded-full bg-emerald-50 border-2 border-emerald-200 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-600" />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-semibold">{importedCount} transações importadas</h2>
          <p className="text-sm text-muted-foreground mt-1">Lançamentos disponíveis na aba Lançamentos.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => { setStep(1); setParsed(null); setFileName(""); setInstitution(null); setGlobalBank("") }}>
            Importar outro arquivo
          </Button>
          <Button onClick={() => startTransition(() => router.push("/financeiro/lancamentos"))}>
            Ver lançamentos <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    )
  }

  // ── Step 1: Upload ───────────────────────────────────────────
  if (step === 1) {
    const instConfig = institution ? INSTITUTION_CONFIG[institution] : null

    return (
      <div className="space-y-6 max-w-xl">
        <div>
          <h1 className="text-2xl font-semibold">Importar OFX</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Selecione o banco de origem do extrato OFX.
          </p>
        </div>

        {/* Seletor de instituição */}
        <div className="grid grid-cols-2 gap-3">
          {(["c6", "santander"] as Institution[]).map((inst) => {
            const cfg = INSTITUTION_CONFIG[inst]
            const selected = institution === inst
            return (
              <button
                key={inst}
                type="button"
                onClick={() => handleSelectInstitution(inst)}
                className={cn(
                  "rounded-xl border-2 px-5 py-4 text-left transition-all duration-150",
                  selected
                    ? `${cfg.borderColor} ${cfg.bgColor}`
                    : "border-border bg-card hover:border-muted-foreground/40 hover:bg-muted/30"
                )}
              >
                <p className={cn("font-semibold text-sm", selected ? cfg.color : "text-foreground")}>
                  {cfg.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Extrato OFX</p>
              </button>
            )
          })}
        </div>

        {/* Instruções específicas do banco */}
        {instConfig && (
          <div className={cn("rounded-lg border px-4 py-3 text-sm text-muted-foreground space-y-1", instConfig.borderColor, instConfig.bgColor)}>
            <p className={cn("font-medium text-xs uppercase tracking-wide mb-2", instConfig.color)}>
              Como exportar do {instConfig.label}
            </p>
            {instConfig.steps.map((s, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-muted-foreground/20 text-[10px] flex items-center justify-center font-medium shrink-0">{i + 1}</span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        )}

        {/* Drop zone — só aparece após selecionar banco */}
        {institution && (
          <>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-border rounded-xl p-12 flex flex-col items-center gap-4 hover:border-primary hover:bg-muted/30 transition-all duration-200 cursor-pointer group"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-medium text-sm">Clique para selecionar o arquivo OFX</p>
                <p className="text-xs text-muted-foreground mt-1">Arquivos .ofx exportados pelo {instConfig!.label}</p>
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept=".ofx,.OFX" className="hidden" onChange={handleFileChange} />
          </>
        )}
      </div>
    )
  }

  // ── Step 2: Preview + mapeamento ────────────────────────────
  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Revisar importação</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
            <FileText className="h-3.5 w-3.5" />
            <span>{fileName}</span>
            {parsed?.startDate && parsed?.endDate && (
              <Badge variant="outline" className="text-xs ml-1">
                {formatDate(parsed.startDate)} → {formatDate(parsed.endDate)}
              </Badge>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => { setStep(1); setParsed(null); setInstitution(null); setGlobalBank("") }}>
          Trocar arquivo
        </Button>
      </div>

      {/* Mapeamento global — destaque visual */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold">Configuração global</p>
          <p className="text-xs text-muted-foreground mt-0.5">Aplica-se a todas as linhas. Você pode ajustar individualmente abaixo.</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {/* Banco */}
          <div className="space-y-1.5 w-44">
            <label className="text-xs font-medium flex items-center gap-1">
              Conta bancária
              <span className="text-rose-500">*</span>
            </label>
            <Select value={globalBank} onValueChange={(v) => setGlobalBank(v ?? "")}>
              <SelectTrigger className={cn(
                "transition-all",
                globalBank ? "border-emerald-300 bg-emerald-50" : ""
              )}>
                <SelectValue>
                  {(v: string) => bankAccounts.find(b => b.id === v)?.bank_name ?? "Selecionar banco..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {bankOptions.map((b) => (
                  <SelectItem key={b.id} value={b.id}>{b.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* BU padrão */}
          <div className="space-y-1.5 w-44">
            <label className="text-xs font-medium">BU padrão (opcional)</label>
            <Select value={globalBu} onValueChange={(v) => setGlobalBu(v ?? "")}>
              <SelectTrigger className={cn(
                "transition-all",
                globalBu ? "border-emerald-300 bg-emerald-50" : ""
              )}>
                <SelectValue>
                  {(v: string) => businessUnits.find(bu => bu.id === v)?.name ?? "Selecionar BU..."}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {buOptions.map((bu) => (
                  <SelectItem key={bu.id} value={bu.id}>{bu.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Botões de aplicação rápida */}
          <div className="flex gap-2 items-end">
            <Button
              size="sm"
              variant="outline"
              disabled={!globalBu}
              onClick={applyGlobalToAll}
            >
              Aplicar BU a todas
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="text-amber-700 border-amber-200 hover:bg-amber-50 hover:border-amber-300"
              onClick={applyOutrasDespesasToAll}
            >
              Marcar todas como Outras despesas
            </Button>
          </div>
        </div>
      </div>

      {/* Contadores */}
      <div className="flex items-center gap-3 text-sm px-0.5">
        <span className="text-muted-foreground">{total} transações</span>
        <span className="text-muted-foreground">·</span>
        <span className={cn("font-medium", readyToImport > 0 ? "text-emerald-600" : "text-muted-foreground")}>
          {readyToImport} prontas
        </span>
        {skipped > 0 && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">{skipped} ignoradas</span>
          </>
        )}
        {total - skipped - readyToImport > 0 && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-amber-600 font-medium">{total - skipped - readyToImport} incompletas</span>
          </>
        )}
      </div>

      {/* Tabela */}
      <div className="rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="w-10 px-3 py-2.5"></th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground w-24">Data</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">Descrição</th>
                <th className="px-3 py-2.5 text-right text-xs font-medium text-muted-foreground w-32">Valor</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground w-[160px]">BU</th>
                <th className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground w-[200px]">Categoria</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {parsed?.transactions.map((t, i) => {
                const cfg = getRowConfig(i)
                const isEntrada = t.amount > 0
                const buSet = !!(cfg.business_unit_id || globalBu)
                const catSet = !!cfg.category_id
                const isReady = buSet && catSet && !!globalBank

                return (
                  <tr
                    key={i}
                    className={cn(
                      "transition-colors group",
                      cfg.skip
                        ? "opacity-35 bg-muted/20"
                        : isReady
                          ? "hover:bg-emerald-50/40"
                          : "hover:bg-muted/30"
                    )}
                  >
                    {/* Toggle skip */}
                    <td className="px-3 py-2">
                      <button
                        onClick={() => setRowField(i, "skip", !cfg.skip)}
                        title={cfg.skip ? "Incluir" : "Ignorar"}
                        className="flex items-center justify-center w-6 h-6 rounded-md transition-colors"
                      >
                        {cfg.skip ? (
                          <Minus className="h-3.5 w-3.5 text-muted-foreground" />
                        ) : isReady ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-amber-400 border-dashed" />
                        )}
                      </button>
                    </td>

                    {/* Data */}
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {formatDate(t.date)}
                    </td>

                    {/* Descrição */}
                    <td className="px-3 py-2">
                      <p className="text-sm truncate max-w-[280px]" title={t.memo}>
                        {t.memo || <span className="text-muted-foreground italic">sem descrição</span>}
                      </p>
                    </td>

                    {/* Valor */}
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <span className={cn(
                        "font-mono font-medium text-sm",
                        isEntrada ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {isEntrada ? "+" : "−"}{formatCurrency(Math.abs(t.amount))}
                      </span>
                    </td>

                    {/* BU select */}
                    <td className="px-2 py-1.5">
                      {!cfg.skip && (
                        <InlineSelect
                          value={cfg.business_unit_id || globalBu}
                          onChange={(v) => setRowField(i, "business_unit_id", v)}
                          placeholder="BU..."
                          options={buOptions}
                          getLabel={(id) => businessUnits.find(bu => bu.id === id)?.name ?? id}
                        />
                      )}
                    </td>

                    {/* Categoria select */}
                    <td className="px-2 py-1.5">
                      {!cfg.skip && (
                        <InlineSelect
                          value={cfg.category_id}
                          onChange={(v) => setRowField(i, "category_id", v)}
                          placeholder="Categoria..."
                          options={catOptions}
                          getLabel={(id) => categories.find(c => c.id === id)?.name ?? id}
                          wide
                        />
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Erro */}
      {importError && (
        <div className="flex items-center gap-2 text-sm text-rose-600 border border-rose-200 bg-rose-50 rounded-lg px-3 py-2.5">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {importError}
        </div>
      )}

      {/* Ações */}
      <div className="flex justify-between items-center pt-1">
        <p className="text-xs text-muted-foreground">
          Linhas sem BU, categoria ou banco serão ignoradas.
        </p>
        <Button
          onClick={handleImport}
          disabled={importing || readyToImport === 0 || !globalBank}
          className="min-w-36"
        >
          {importing
            ? "Importando..."
            : `Importar ${readyToImport} transações`}
          {!importing && <ChevronRight className="h-4 w-4 ml-1" />}
        </Button>
      </div>
    </div>
  )
}
