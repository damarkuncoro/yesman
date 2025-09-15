"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/ui/tabs"
import PolicyListTab from "./policy-list-tab"
import PolicyDetailTab from "./policy-detail-tab"
import PolicyCreateEditTab from "./policy-create-edit-tab"

/**
 * Komponen tabs untuk Policy Management
 * Mengelola navigasi antar tab: Policy List, Policy Detail, Policy Create/Edit
 */
export function PolicyManagementTabs() {
  const [activeTab, setActiveTab] = useState("policy-list")
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create')

  /**
   * Handle ketika policy dipilih dari Policy List
   * Akan switch ke Policy Detail tab
   */
  const handlePolicySelect = (policyId: string) => {
    setSelectedPolicyId(policyId)
    setActiveTab("policy-detail")
  }

  /**
   * Handle ketika ingin edit policy
   * Akan switch ke Policy Create/Edit tab dalam mode edit
   */
  const handlePolicyEdit = (policyId: string) => {
    setSelectedPolicyId(policyId)
    setEditMode('edit')
    setActiveTab("policy-create-edit")
  }

  /**
   * Handle ketika ingin create policy baru
   * Akan switch ke Policy Create/Edit tab dalam mode create
   */
  const handlePolicyCreate = () => {
    setSelectedPolicyId(null)
    setEditMode('create')
    setActiveTab("policy-create-edit")
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="policy-list">Policy List</TabsTrigger>
        <TabsTrigger value="policy-detail">Policy Detail</TabsTrigger>
        <TabsTrigger value="policy-create-edit">
          {editMode === 'create' ? 'Create Policy' : 'Edit Policy'}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="policy-list" className="mt-6">
         <PolicyListTab 
           onCreatePolicy={handlePolicyCreate}
           onEditPolicy={handlePolicyEdit}
           onViewDetail={handlePolicySelect}
         />
       </TabsContent>

       <TabsContent value="policy-detail" className="mt-6">
         <PolicyDetailTab 
           policyId={selectedPolicyId}
           onBack={() => setActiveTab("policy-list")}
           onEdit={handlePolicyEdit}
         />
       </TabsContent>

       <TabsContent value="policy-create-edit" className="mt-6">
         <PolicyCreateEditTab 
           policyId={selectedPolicyId}
           isEditMode={editMode === 'edit'}
           onSuccess={() => setActiveTab("policy-list")}
           onCancel={() => setActiveTab("policy-list")}
         />
       </TabsContent>
    </Tabs>
  )
}