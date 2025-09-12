"use client";

import { SidebarProvider } from "@/components/shadcn/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { RouteManagementTabs } from "./components/route-management-tabs";

/**
 * Halaman utama Route Management
 * Menampilkan interface untuk mengelola mapping route ke feature
 */
export default function RouteManagementPage() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <main className="flex-1">
        <SiteHeader />
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Route Management</h1>
            <p className="text-muted-foreground">
              Kelola mapping endpoint/path ke feature dan atur akses berdasarkan role
            </p>
          </div>
          <RouteManagementTabs />
        </div>
      </main>
    </SidebarProvider>
  );
}