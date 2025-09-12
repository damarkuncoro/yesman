import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/shadcn/ui/sidebar"

import PolicyManagementTabs from './components/policy-management-tabs';

/**
 * Halaman utama Policy Management (ABAC)
 * Menampilkan sistem manajemen policy berbasis atribut
 */
export default function PolicyManagementPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min">
            <div className="p-6">
              <div className="mb-6">
                <h1 className="text-3xl font-bold tracking-tight">Role Management</h1>
                <p className="text-muted-foreground">
                  Kelola role, permissions, dan mapping user dalam sistem RBAC/ABAC
                </p>
              </div>
              <PolicyManagementTabs />
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}