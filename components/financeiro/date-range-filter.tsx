"use client"

import { useState } from "react"
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfYear,
  endOfYear,
  subDays,
  startOfDay,
  endOfDay,
} from "date-fns"
import { ptBR } from "date-fns/locale"
import type { DateRange } from "react-day-picker"
import { CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

type Props = {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  className?: string
  placeholder?: string
}

const today = () => {
  const d = new Date()
  return { from: startOfDay(d), to: endOfDay(d) }
}

const presets = [
  { label: "Hoje",             get: today },
  { label: "Últimos 7 dias",   get: () => ({ from: subDays(new Date(), 6),  to: endOfDay(new Date()) }) },
  { label: "Últimos 30 dias",  get: () => ({ from: subDays(new Date(), 29), to: endOfDay(new Date()) }) },
  { label: "Este mês",         get: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: "Mês passado",      get: () => {
    const lm = subMonths(new Date(), 1)
    return { from: startOfMonth(lm), to: endOfMonth(lm) }
  }},
  { label: "Este ano",         get: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
]

export function DateRangeFilter({ value, onChange, className, placeholder = "Período" }: Props) {
  const [open, setOpen] = useState(false)

  const label = !value?.from
    ? placeholder
    : value.to && value.to.getTime() !== value.from.getTime()
      ? `${format(value.from, "dd/MM/yy", { locale: ptBR })} – ${format(value.to, "dd/MM/yy", { locale: ptBR })}`
      : format(value.from, "dd/MM/yyyy", { locale: ptBR })

  const hasValue = !!value?.from

  const rangeKey = (r?: { from?: Date; to?: Date }) =>
    r?.from
      ? `${format(r.from, "yyyy-MM-dd")}_${format(r.to ?? r.from, "yyyy-MM-dd")}`
      : ""
  const activeKey = rangeKey(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "justify-start font-normal bg-background",
              !hasValue && "text-muted-foreground",
              className,
            )}
          >
            <CalendarIcon className="h-4 w-4" />
            <span className="truncate">{label}</span>
            {hasValue && (
              <span
                role="button"
                tabIndex={0}
                className="ml-1 rounded-sm hover:bg-muted p-0.5 -mr-1 cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange(undefined)
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    e.stopPropagation()
                    onChange(undefined)
                  }
                }}
                title="Limpar"
              >
                <X className="h-3 w-3" />
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent align="start" className="flex w-auto flex-col p-0">
        <div className="flex flex-wrap items-center gap-1 border-b p-2">
          {presets.map((p) => {
            const isActive = rangeKey(p.get()) === activeKey
            return (
              <Button
                key={p.label}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={cn(
                  "h-7 px-2.5 text-xs font-normal",
                  isActive && "font-medium",
                )}
                onClick={() => {
                  onChange(p.get())
                  setOpen(false)
                }}
              >
                {p.label}
              </Button>
            )
          })}
          {hasValue && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 text-xs font-normal text-muted-foreground ml-auto"
              onClick={() => {
                onChange(undefined)
                setOpen(false)
              }}
            >
              Limpar
            </Button>
          )}
        </div>
        <div className="p-2">
          <Calendar
            mode="range"
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
            locale={ptBR}
            defaultMonth={value?.from ?? new Date()}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
