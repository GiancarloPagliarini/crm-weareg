import { TRACKING_START_DATE } from './constants'

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

export function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR')
}

export function formatCompetenceDate(date: string): string {
  const [year, month] = date.split('-')
  const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
                  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  return `${months[parseInt(month) - 1]}/${year}`
}

export function currentMonthRange(): { start: string; end: string } {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const startStr = start.toISOString().split('T')[0]
  return {
    start: startStr < TRACKING_START_DATE ? TRACKING_START_DATE : startStr,
    end: end.toISOString().split('T')[0],
  }
}
