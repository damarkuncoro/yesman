import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/shadcn/ui/sidebar"

// Dashboard Components
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { FeatureAccessChart } from "@/components/dashboard/feature-access-chart"
import { AccessDeniedStats } from "@/components/dashboard/access-denied-stats"
import { DepartmentRegionStats } from "@/components/dashboard/department-region-stats"

export default function Page() {
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
            <div className="flex flex-col gap-6 py-4 md:gap-8 md:py-6">
              {/* Dashboard Statistics - User per Role */}
              <div className="px-4 lg:px-6">
                <DashboardStats />
              </div>
              
              {/* Feature Access Chart */}
              <div className="px-4 lg:px-6">
                <FeatureAccessChart />
              </div>
              
              {/* Access Denied Statistics */}
              <div className="px-4 lg:px-6">
                <AccessDeniedStats />
              </div>
              
              {/* Department & Region Statistics */}
              <div className="px-4 lg:px-6">
                <DepartmentRegionStats />
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
