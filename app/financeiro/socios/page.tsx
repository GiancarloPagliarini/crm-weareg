import { createClient } from "@/lib/supabase/server"
import { currentMonthRange } from "@/lib/formatters"
import type { ProfitDistributionRow } from "@/lib/types"
import { SociosClient } from "@/components/financeiro/socios-client"

type SearchParams = Promise<{
  from?: string | string[]
  to?: string | string[]
}>

function pickString(v: string | string[] | undefined): string | null {
  if (typeof v === "string" && v.trim() !== "") return v
  return null
}

export default async function SociosPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const sp = await searchParams
  const customFrom = pickString(sp.from)
  const customTo   = pickString(sp.to)

  const supabase = await createClient()
  const { start, end } =
    customFrom && customTo
      ? { start: customFrom, end: customTo }
      : currentMonthRange()

  const { data: rows } = await supabase.rpc("fn_profit_distribution", {
    p_start_date: start,
    p_end_date: end,
  })

  const distribution = (rows as ProfitDistributionRow[]) ?? []

  const periodLabel = (() => {
    if (customFrom && customTo) {
      const sameDay = customFrom === customTo
      if (sameDay) {
        return new Date(customFrom + "T00:00:00").toLocaleDateString("pt-BR")
      }
      return `${new Date(customFrom + "T00:00:00").toLocaleDateString("pt-BR")} — ${new Date(customTo + "T00:00:00").toLocaleDateString("pt-BR")}`
    }
    return new Date(start + "T00:00:00").toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    })
  })()

  return <SociosClient distribution={distribution} periodLabel={periodLabel} />
}
