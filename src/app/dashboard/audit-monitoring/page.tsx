"use client"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/shadcn/ui/sidebar"
import { AuditMonitoringTabs } from "./components/audit-monitoring-tabs"

/**
 * Halaman utama Audit & Monitoring
 * Menampilkan tabs untuk Access Logs, Policy Violation Logs, Change History, dan Session Logs
 */
export default function AuditMonitoringPage() {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold tracking-tight">Audit & Monitoring</h1>
                  <p className="text-muted-foreground">
                    Monitor aktivitas sistem, akses user, dan perubahan kebijakan
                  </p>
                </div>
                <AuditMonitoringTabs />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}