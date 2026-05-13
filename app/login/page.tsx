"use client"

import { useActionState } from "react"
import Image from "next/image"
import { signIn } from "./actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const BRAND_GREEN = "#B5D224"

export default function LoginPage() {
  const [state, action, pending] = useActionState(signIn, null)
  const year = new Date().getFullYear()

  return (
    <div className="min-h-screen w-full bg-white lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ============ BRAND PANEL ============ */}
      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16"
        style={{ backgroundColor: BRAND_GREEN }}
      >
        {/* Decorative seal — large, soft, off-canvas */}
        <Image
          src="/brand/selo.png"
          alt=""
          width={1100}
          height={1100}
          priority
          className="pointer-events-none absolute -right-[28%] -bottom-[22%] w-[120%] max-w-none opacity-[0.18] mix-blend-multiply select-none"
        />

        {/* Soft top-light vignette to add depth */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 80% at 0% 0%, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0) 55%)",
          }}
        />

        {/* Top: logo */}
        <div className="relative z-10 flex items-center">
          <Image
            src="/brand/logo-horizontal-dark.png"
            alt="WeAreG"
            width={420}
            height={120}
            priority
            className="h-10 w-auto xl:h-11"
          />
        </div>

        {/* Middle: editorial headline */}
        <div className="relative z-10 max-w-[28ch]">
          <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-neutral-900/70">
            Painel Financeiro
          </p>
          <h2 className="mt-5 text-4xl font-semibold leading-[1.05] tracking-tight text-neutral-900 xl:text-5xl">
            Tempo, clareza e controle{" "}
            <span className="italic font-normal">para cada decisão.</span>
          </h2>
          <p className="mt-6 max-w-[34ch] text-base leading-relaxed text-neutral-900/75">
            Centralize sua gestão financeira multi-BU em um ambiente desenhado
            para precisão e velocidade.
          </p>
        </div>

        {/* Bottom: meta */}
        <div className="relative z-10 flex items-end justify-between text-[12px] font-medium tracking-wide text-neutral-900/70">
          <span>© {year} WeAreG</span>
          <span className="inline-flex items-center gap-2">
            <span
              className="inline-block size-1.5 rounded-full bg-neutral-900/70"
              aria-hidden
            />
            Ambiente seguro
          </span>
        </div>
      </aside>

      {/* ============ FORM PANEL ============ */}
      <main className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12 sm:px-10 lg:min-h-0 lg:py-16">
        {/* Mobile logo (visible only when brand panel is hidden) */}
        <div className="absolute top-8 left-6 sm:left-10 lg:hidden">
          <Image
            src="/brand/logo-horizontal-dark.png"
            alt="WeAreG"
            width={320}
            height={92}
            className="h-8 w-auto"
          />
        </div>

        <div className="w-full max-w-[380px]">
          {/* Heading */}
          <div className="space-y-2">
            <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-neutral-950">
              Bem-vindo de volta
            </h1>
            <p className="text-sm leading-relaxed text-neutral-500">
              Entre com suas credenciais para acessar o painel financeiro.
            </p>
          </div>

          {/* Form */}
          <form action={action} className="mt-10 space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-[13px] font-medium text-neutral-700"
              >
                E-mail corporativo
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@weareg.com"
                autoComplete="email"
                required
                disabled={pending}
                className="h-11 rounded-lg border-neutral-200 bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus-visible:border-[color:var(--brand)] focus-visible:ring-[color:var(--brand)]/30"
                style={{ ["--brand" as string]: BRAND_GREEN }}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <Label
                  htmlFor="password"
                  className="text-[13px] font-medium text-neutral-700"
                >
                  Senha
                </Label>
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                required
                disabled={pending}
                className="h-11 rounded-lg border-neutral-200 bg-white px-3.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus-visible:border-[color:var(--brand)] focus-visible:ring-[color:var(--brand)]/30"
                style={{ ["--brand" as string]: BRAND_GREEN }}
              />
            </div>

            {state?.error && (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[13px] text-rose-700"
              >
                {state.error}
              </p>
            )}

            <Button
              type="submit"
              disabled={pending}
              className="h-11 w-full rounded-lg text-[14px] font-semibold text-neutral-900 shadow-sm transition-[transform,box-shadow,background-color] hover:brightness-[0.96] active:translate-y-px"
              style={{ backgroundColor: BRAND_GREEN }}
            >
              {pending ? "Entrando..." : "Entrar no painel"}
            </Button>
          </form>

          {/* Footer note */}
          <p className="mt-10 text-center text-[12px] leading-relaxed text-neutral-400">
            Acesso restrito a colaboradores autorizados.
            <br className="hidden sm:inline" />
            Em caso de dúvida, fale com o time financeiro.
          </p>
        </div>

        {/* Mobile-only bottom copyright */}
        <p className="absolute bottom-6 text-[11px] tracking-wide text-neutral-400 lg:hidden">
          © {year} WeAreG
        </p>
      </main>
    </div>
  )
}
