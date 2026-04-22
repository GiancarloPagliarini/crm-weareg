import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

type ImportTransaction = {
  business_unit_id: string
  category_id: string
  bank_account_id: string
  type: "entrada" | "saida"
  amount: number
  description: string
  transaction_date: string
  competence_date: string
  counterpart_name?: string | null
  notes?: string | null
  fitid?: string | null
  cost_rule_id?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { transactions } = body as { transactions: ImportTransaction[] }

    if (!transactions?.length) {
      return NextResponse.json({ error: "Nenhuma transação para importar." }, { status: 400 })
    }

    const supabase = await createClient()

    const withFitid    = transactions.filter((t) => t.fitid && t.fitid.trim() !== "")
    const withoutFitid = transactions.filter((t) => !t.fitid || t.fitid.trim() === "")

    let imported = 0
    let skipped = 0

    // Com FITID: upsert que ignora duplicatas contra o índice único
    // (bank_account_id, fitid). `.select()` só retorna as linhas de fato inseridas.
    if (withFitid.length > 0) {
      const { data, error } = await supabase
        .from("transactions")
        .upsert(withFitid, {
          onConflict: "bank_account_id,fitid",
          ignoreDuplicates: true,
        })
        .select("id")

      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      const inserted = data?.length ?? 0
      imported += inserted
      skipped  += withFitid.length - inserted
    }

    // Sem FITID: insert direto (não dá para deduplicar sem identificador único do banco)
    if (withoutFitid.length > 0) {
      const { error } = await supabase.from("transactions").insert(withoutFitid)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      imported += withoutFitid.length
    }

    return NextResponse.json({ imported, skipped })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
