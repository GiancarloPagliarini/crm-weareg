import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { transactions } = body as {
      transactions: {
        business_unit_id: string
        category_id: string
        bank_account_id: string
        type: "entrada" | "saida"
        amount: number
        description: string
        transaction_date: string
        competence_date: string
        counterpart_name?: string
        notes?: string
      }[]
    }

    if (!transactions?.length) {
      return NextResponse.json({ error: "Nenhuma transação para importar." }, { status: 400 })
    }

    const supabase = await createClient()
    const { error } = await supabase.from("transactions").insert(transactions)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ imported: transactions.length })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
