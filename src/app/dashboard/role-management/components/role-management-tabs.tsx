"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/ui/tabs"
import { RoleListTab } from "./role-list-tab"
import { RoleDetailTab } from "./role-detail-tab"
import { RoleCreateEditTab } from "./role-create-edit-tab"
import { RoleUserMappingTab } from "./role-user-mapping-tab"

/**
 * Komponen tabs untuk Role Management
 * Mengelola navigasi antar tab: Role List, Role Detail, Role Create/Edit, Role User Mapping
 */
export function RoleManagementTabs() {
  const [activeTab, setActiveTab] = useState("role-list")
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create')

  /**
   * Handle ketika role dipilih dari Role List
   * Akan switch ke Role Detail tab
   */
  const handleRoleSelect = (roleId: string) => {
    setSelectedRoleId(roleId)
    setActiveTab("role-detail")
  }

  /**
   * Handle ketika ingin edit role
   * Akan switch ke Role Create/Edit tab dalam mode edit
   */
  const handleRoleEdit = (roleId: string) => {
    setSelectedRoleId(roleId)
    setEditMode('edit')
    setActiveTab("role-create-edit")
  }

  /**
   * Handle ketika ingin create role baru
   * Akan switch ke Role Create/Edit tab dalam mode create
   */
  const handleRoleCreate = () => {
    setSelectedRoleId(null)
    setEditMode('create')
    setActiveTab("role-create-edit")
  }

  /**
   * Handle ketika ingin lihat user mapping
   * Akan switch ke Role User Mapping tab
   */
  const handleRoleUserMapping = (roleId: string) => {
    setSelectedRoleId(roleId)
    setActiveTab("role-user-mapping")
  }

  /**
   * Handle success action (create/edit/delete)
   * Akan kembali ke Role List tab
   */
  const handleSuccess = () => {
    setActiveTab("role-list")
    setSelectedRoleId(null)
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="role-list">Role List</TabsTrigger>
        <TabsTrigger value="role-detail">Role Detail</TabsTrigger>
        <TabsTrigger value="role-create-edit">
          {editMode === 'create' ? 'Create Role' : 'Edit Role'}
        </TabsTrigger>
        <TabsTrigger value="role-user-mapping">User Mapping</TabsTrigger>
      </TabsList>

      <TabsContent value="role-list" className="mt-6">
        <RoleListTab 
          onRoleSelect={handleRoleSelect}
          onRoleEdit={handleRoleEdit}
          onRoleCreate={handleRoleCreate}
          onRoleUserMapping={handleRoleUserMapping}
        />
      </TabsContent>

      <TabsContent value="role-detail" className="mt-6">
        <RoleDetailTab 
          roleId={selectedRoleId}
          onEdit={() => selectedRoleId && handleRoleEdit(selectedRoleId)}
          onUserMapping={() => selectedRoleId && handleRoleUserMapping(selectedRoleId)}
        />
      </TabsContent>

      <TabsContent value="role-create-edit" className="mt-6">
        <RoleCreateEditTab 
          roleId={selectedRoleId}
          mode={editMode}
          onSuccess={handleSuccess}
        />
      </TabsContent>

      <TabsContent value="role-user-mapping" className="mt-6">
        <RoleUserMappingTab 
          selectedRoleId={selectedRoleId || undefined}
        />
      </TabsContent>
    </Tabs>
  )
}