import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { FinanceiroSidebar } from "@/components/financeiro/sidebar"
import { createClient } from "@/lib/supabase/server"

export default async function FinanceiroLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <SidebarProvider>
      <FinanceiroSidebar userEmail={user?.email} />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b flex items-center px-4 gap-3 shrink-0">
          <SidebarTrigger />
          <span className="text-sm text-muted-foreground font-medium">CRM WeAreG</span>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </SidebarProvider>
  )
}
