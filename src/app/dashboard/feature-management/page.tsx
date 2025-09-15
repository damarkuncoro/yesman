"use client";

import { SidebarProvider } from "@/components/shadcn/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { FeatureManagementTabs } from "./components/feature-management-tabs";

/**
 * Halaman utama Feature Management
 * Mengelola fitur-fitur aplikasi, role yang memiliki akses, dan policy yang berlaku
 */
export default function FeatureManagementPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <SiteHeader />
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Feature Management</h1>
            <p className="text-muted-foreground">
              Kelola fitur-fitur aplikasi, role yang memiliki akses, dan policy yang berlaku
            </p>
          </div>
          <FeatureManagementTabs />
        </div>
      </main>
    </SidebarProvider>
  );
}