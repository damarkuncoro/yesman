"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/ui/tabs"
import { AccessLogsTable } from "./access-logs-table"
import { PolicyViolationLogsTable } from "./policy-violation-logs-table"
import { ChangeHistoryTable } from "./change-history-table"
import { SessionLogsTable } from "./session-logs-table"

/**
 * Komponen tabs untuk Audit & Monitoring
 * Mengelola navigasi antar tab: Access Logs, Policy Violation Logs, Change History, Session Logs
 */
export function AuditMonitoringTabs() {
  const [activeTab, setActiveTab] = useState("access-logs")

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="access-logs">Access Logs</TabsTrigger>
        <TabsTrigger value="policy-violations">Policy Violations</TabsTrigger>
        <TabsTrigger value="change-history">Change History</TabsTrigger>
        <TabsTrigger value="session-logs">Session Logs</TabsTrigger>
      </TabsList>

      <TabsContent value="access-logs" className="mt-6">
        <AccessLogsTable />
      </TabsContent>

      <TabsContent value="policy-violations" className="mt-6">
        <PolicyViolationLogsTable />
      </TabsContent>

      <TabsContent value="change-history" className="mt-6">
        <ChangeHistoryTable />
      </TabsContent>

      <TabsContent value="session-logs" className="mt-6">
        <SessionLogsTable />
      </TabsContent>
    </Tabs>
  )
}