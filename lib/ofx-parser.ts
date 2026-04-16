export type OFXTransaction = {
  fitid: string
  trntype: string
  date: string        // YYYY-MM-DD
  amount: number      // positivo = crédito, negativo = débito
  memo: string
}

export type OFXParseResult = {
  bankId?: string
  accountId?: string
  currency?: string
  startDate?: string
  endDate?: string
  transactions: OFXTransaction[]
  error?: string
}

function parseOFXDate(raw: string): string {
  // Formatos: 20260401, 20260401120000, 20260401120000[-3:BRT]
  const digits = raw.replace(/\D.*/, "").trim()
  const year  = digits.slice(0, 4)
  const month = digits.slice(4, 6)
  const day   = digits.slice(6, 8)
  return `${year}-${month}-${day}`
}

function extractTag(content: string, tag: string): string {
  // Suporta <TAG>valor e <TAG>valor</TAG>
  const re = new RegExp(`<${tag}>([^<\\n\\r]+)`, "i")
  const m = re.exec(content)
  return m ? m[1].trim() : ""
}

function extractBlock(content: string, tag: string): string {
  const re = new RegExp(`<${tag}>[\\s\\S]*?<\\/${tag}>`, "i")
  const m = re.exec(content)
  return m ? m[0] : ""
}

export function parseOFX(raw: string): OFXParseResult {
  try {
    // Normaliza quebras de linha e remove o header SGML (antes de <OFX>)
    const content = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    const ofxStart = content.toUpperCase().indexOf("<OFX>")
    const body = ofxStart >= 0 ? content.slice(ofxStart) : content

    // Tenta extrair dados da conta
    const bankId    = extractTag(body, "BANKID") || extractTag(body, "ORG")
    const accountId = extractTag(body, "ACCTID")
    const currency  = extractTag(body, "CURDEF")
    const startDate = extractTag(body, "DTSTART")
    const endDate   = extractTag(body, "DTEND")

    // Extrai todas as transações
    const transactions: OFXTransaction[] = []
    const trnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi
    let match

    while ((match = trnRegex.exec(body)) !== null) {
      const t = match[1]

      const fitid   = extractTag(t, "FITID")
      const trntype = extractTag(t, "TRNTYPE")
      const dtRaw   = extractTag(t, "DTPOSTED") || extractTag(t, "DTUSER")
      const amtRaw  = extractTag(t, "TRNAMT")
      const memo    = extractTag(t, "MEMO") || extractTag(t, "NAME") || ""

      const amount = parseFloat(amtRaw.replace(",", "."))
      if (isNaN(amount)) continue

      transactions.push({
        fitid,
        trntype,
        date: parseOFXDate(dtRaw),
        amount,
        memo,
      })
    }

    // Fallback: OFX sem closing tags (SGML puro)
    if (transactions.length === 0) {
      const lines = body.split("\n")
      let current: Partial<OFXTransaction> | null = null

      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.toUpperCase() === "<STMTTRN>") {
          current = {}
        } else if (trimmed.toUpperCase() === "</STMTTRN>") {
          if (current && current.amount !== undefined && current.date) {
            transactions.push({
              fitid:   current.fitid   ?? "",
              trntype: current.trntype ?? "",
              date:    current.date,
              amount:  current.amount,
              memo:    current.memo    ?? "",
            })
          }
          current = null
        } else if (current !== null) {
          if      (/<FITID>/i.test(trimmed))   current.fitid   = trimmed.replace(/<FITID>/i,   "").trim()
          else if (/<TRNTYPE>/i.test(trimmed)) current.trntype = trimmed.replace(/<TRNTYPE>/i, "").trim()
          else if (/<DTPOSTED>/i.test(trimmed))current.date    = parseOFXDate(trimmed.replace(/<DTPOSTED>/i, "").trim())
          else if (/<TRNAMT>/i.test(trimmed))  current.amount  = parseFloat(trimmed.replace(/<TRNAMT>/i, "").trim().replace(",", "."))
          else if (/<MEMO>/i.test(trimmed))    current.memo    = trimmed.replace(/<MEMO>/i,    "").trim()
          else if (/<NAME>/i.test(trimmed) && !current.memo) current.memo = trimmed.replace(/<NAME>/i, "").trim()
        }
      }
    }

    return {
      bankId,
      accountId,
      currency,
      startDate: startDate ? parseOFXDate(startDate) : undefined,
      endDate:   endDate   ? parseOFXDate(endDate)   : undefined,
      transactions: transactions.sort((a, b) => a.date.localeCompare(b.date)),
    }
  } catch (e) {
    return { transactions: [], error: String(e) }
  }
}
