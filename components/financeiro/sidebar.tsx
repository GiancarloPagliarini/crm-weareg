"use client"

import Image from 'next/image'
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  ArrowLeftRight,
  FileBarChart2,
  Users,
  Receipt,
  FileUp,
  Wallet,
} from "lucide-react"
import { LogoutButton } from "./logout-button"
import { ThemeToggle } from "./theme-toggle"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar"

const navItems = [
  {
    title: "Dashboard",
    href: "/financeiro/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Lançamentos",
    href: "/financeiro/lancamentos",
    icon: ArrowLeftRight,
  },
  {
    title: "DRE",
    href: "/financeiro/dre",
    icon: FileBarChart2,
  },
  {
    title: "Sócios",
    href: "/financeiro/socios",
    icon: Users,
  },
  {
    title: "A Receber",
    href: "/financeiro/receber",
    icon: Receipt,
  },
  {
    title: "Central de Custo",
    href: "/financeiro/central-custo",
    icon: Wallet,
  },
  {
    title: "Importar OFX",
    href: "/financeiro/importar",
    icon: FileUp,
  },
]

type Props = { userEmail?: string }

export function FinanceiroSidebar({ userEmail }: Props) {
  const pathname = usePathname()

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2">
          <Image
            src="/logo_weareg.png"
            width={35}
            height={35}
            alt="logo"
          />
          <div>
            <p className="text-sm font-semibold leading-none">WeAreG</p>
            <p className="text-xs text-muted-foreground mt-0.5">Financeiro</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Módulo Financeiro</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    render={<Link href={item.href} />}
                    isActive={pathname === item.href}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 space-y-2">
        {userEmail && (
          <p className="text-xs text-muted-foreground truncate" title={userEmail}>{userEmail}</p>
        )}
        <div className="flex items-center justify-between gap-2">
          <LogoutButton />
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
