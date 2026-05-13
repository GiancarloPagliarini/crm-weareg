"use server"

import { createClient } from "@/lib/supabase/server"

const SETUP_KEY = "wgsetup-7K9mN3pQ2vR8xT5yU1jL4hF6sD0aZ8bV"

export async function signUp(_: unknown, formData: FormData) {
  const setupKey = (formData.get("setupKey") as string)?.trim()
  if (setupKey !== SETUP_KEY) {
    return { error: "Chave de instalação inválida." }
  }

  const email = (formData.get("email") as string)?.trim()
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Informe email e senha." }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    return { error: error.message }
  }

  if (data.user && !data.session) {
    return {
      success:
        "Conta criada. Verifique seu email para confirmar antes de fazer login.",
    }
  }

  return { success: "Conta criada. Você já pode fazer login." }
}
