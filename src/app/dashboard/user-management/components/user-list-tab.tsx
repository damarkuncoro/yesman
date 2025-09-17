"use client"

import { Button } from "@/components/shadcn/ui/button"
import { Input } from "@/components/shadcn/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card"
import { IconSearch, IconUserPlus } from "@tabler/icons-react"
import { UserListTable } from "./UI/UserListTable"
import { useUserList } from "./LOGIC/useUserList"

interface UserListTabProps {
  onUserSelect: (userId: string) => void
  onUserEdit: (userId: string) => void
  onUserCreate: () => void
  onRoleAssignment: (userId: string) => void
}

/**
 * Komponen untuk menampilkan daftar user dalam bentuk tabel
 * Menggunakan UserListTable component dan useUserList hook
 */
export function UserListTab({
  onUserSelect,
  onUserEdit,
  onUserCreate,
  onRoleAssignment
}: UserListTabProps) {

  
  const { users, isLoading, filters, updateFilter } = useUserList()



  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Memuat data user...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>User List</CardTitle>
            <CardDescription>
              Daftar semua user dalam sistem dengan informasi lengkap
            </CardDescription>
          </div>
          <Button onClick={onUserCreate} className="flex items-center gap-2">
            <IconUserPlus className="h-4 w-4" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by email, name, department, or region..."
              value={filters.search}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Table */}
        <UserListTable
          users={users}
          onUserSelect={onUserSelect}
          onUserEdit={onUserEdit}
          onRoleAssignment={onRoleAssignment}
        />

        {/* Summary */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {users.length} users
        </div>
      </CardContent>
    </Card>
  )
}