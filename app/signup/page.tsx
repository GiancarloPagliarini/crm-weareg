"use client"

import { useActionState } from "react"
import Link from "next/link"
import Image from "next/image"
import { signUp } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SignupPage() {
  const [state, action, pending] = useActionState(signUp, null)

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[340px] space-y-7">
        <div className="flex items-center gap-3">
          <Image src="/logo_weareg.png" width={36} height={36} alt="WeAreG" />
          <div>
            <p className="text-sm font-semibold leading-none">WeAreG</p>
            <p className="text-xs text-muted-foreground mt-0.5">Painel Financeiro</p>
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight">Criar conta</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Cadastro inicial protegido por chave.
          </p>
        </div>

        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="seu@email.com"
              autoComplete="email"
              required
              disabled={pending}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              autoComplete="new-password"
              required
              minLength={6}
              disabled={pending}
              className="h-10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="setupKey" className="text-sm font-medium">Chave de instalação</Label>
            <Input
              id="setupKey"
              name="setupKey"
              type="text"
              placeholder="wgsetup-..."
              required
              disabled={pending}
              className="h-10"
            />
          </div>

          {state?.error && (
            <p className="text-sm text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2.5">
              {state.error}
            </p>
          )}

          {state?.success && (
            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2.5">
              {state.success}
            </p>
          )}

          <Button type="submit" disabled={pending} className="w-full h-10">
            {pending ? "Criando..." : "Criar conta"}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            Já tem conta?{" "}
            <Link href="/login" className="underline">
              Entrar
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
