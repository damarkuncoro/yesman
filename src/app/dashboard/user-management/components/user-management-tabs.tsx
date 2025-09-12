"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/shadcn/ui/tabs"
import { UserListTab } from "./user-list-tab"
import { UserDetailTab } from "./user-detail-tab"
import { UserCreateEditTab } from "./user-create-edit-tab"
import { UserRoleAssignmentTab } from "./user-role-assignment-tab"

/**
 * Komponen tabs untuk User Management
 * Mengelola navigasi antar tab: User List, User Detail, User Create/Edit, User Role Assignment
 */
export function UserManagementTabs() {
  const [activeTab, setActiveTab] = useState("user-list")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [editMode, setEditMode] = useState<'create' | 'edit'>('create')

  /**
   * Handle ketika user dipilih dari User List
   * Akan switch ke User Detail tab
   */
  const handleUserSelect = (userId: string) => {
    setSelectedUserId(userId)
    setActiveTab("user-detail")
  }

  /**
   * Handle ketika ingin edit user
   * Akan switch ke User Create/Edit tab dalam mode edit
   */
  const handleUserEdit = (userId: string) => {
    setSelectedUserId(userId)
    setEditMode('edit')
    setActiveTab("user-create-edit")
  }

  /**
   * Handle ketika ingin create user baru
   * Akan switch ke User Create/Edit tab dalam mode create
   */
  const handleUserCreate = () => {
    setSelectedUserId(null)
    setEditMode('create')
    setActiveTab("user-create-edit")
  }

  /**
   * Handle ketika ingin assign role
   * Akan switch ke User Role Assignment tab
   */
  const handleRoleAssignment = (userId: string) => {
    setSelectedUserId(userId)
    setActiveTab("user-role-assignment")
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="user-list">User List</TabsTrigger>
        <TabsTrigger value="user-detail">User Detail</TabsTrigger>
        <TabsTrigger value="user-create-edit">
          {editMode === 'create' ? 'Create User' : 'Edit User'}
        </TabsTrigger>
        <TabsTrigger value="user-role-assignment">Role Assignment</TabsTrigger>
      </TabsList>

      <TabsContent value="user-list" className="mt-6">
        <UserListTab 
          onUserSelect={handleUserSelect}
          onUserEdit={handleUserEdit}
          onUserCreate={handleUserCreate}
          onRoleAssignment={handleRoleAssignment}
        />
      </TabsContent>

      <TabsContent value="user-detail" className="mt-6">
        <UserDetailTab 
          userId={selectedUserId}
          onUserEdit={handleUserEdit}
          onRoleAssignment={handleRoleAssignment}
        />
      </TabsContent>

      <TabsContent value="user-create-edit" className="mt-6">
        <UserCreateEditTab 
          userId={selectedUserId}
          mode={editMode}
          onSuccess={() => setActiveTab("user-list")}
        />
      </TabsContent>

      <TabsContent value="user-role-assignment" className="mt-6">
        <UserRoleAssignmentTab 
          selectedUserId={selectedUserId || undefined}
        />
      </TabsContent>
    </Tabs>
  )
}