"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/shadcn/ui/button"
import { Input } from "@/components/shadcn/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/shadcn/ui/dropdown-menu"
import { Badge } from "@/components/shadcn/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card"
import { IconDots, IconPlus, IconSearch, IconUserPlus } from "@tabler/icons-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

interface User {
  id: number
  email: string
  name: string
  department: string | null
  region: string | null
  level: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

interface UserListTabProps {
  onUserSelect: (userId: string) => void
  onUserEdit: (userId: string) => void
  onUserCreate: () => void
  onRoleAssignment: (userId: string) => void
}

/**
 * Komponen untuk menampilkan daftar user dalam bentuk tabel
 * Menampilkan informasi: email, role, department, region, level, status
 */
export function UserListTab({ 
  onUserSelect, 
  onUserEdit, 
  onUserCreate, 
  onRoleAssignment 
}: UserListTabProps) {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])

  const { accessToken } = useAuth()

  /**
   * Fetch users dari API
   */
  const fetchUsers = async () => {
    if (!accessToken) {
      toast.error('Token akses tidak tersedia')
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data users')
      }

      if (result.success && result.data?.users) {
        setUsers(result.data.users)
        setFilteredUsers(result.data.users)
      } else {
        throw new Error('Format response tidak valid')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal mengambil data users')
      setUsers([])
      setFilteredUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [accessToken])

  /**
   * Filter users berdasarkan search term
   */
  useEffect(() => {
    const filtered = Array.isArray(users) ? users.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department && user.department.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.region && user.region.toLowerCase().includes(searchTerm.toLowerCase()))
    ) : []
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  /**
   * Render status badge dengan warna yang sesuai
   */
  const renderStatusBadge = (active: boolean) => {
    return (
      <Badge variant={active ? 'default' : 'secondary'}>
        {active ? 'Active' : 'Inactive'}
      </Badge>
    )
  }

  /**
   * Render placeholder untuk roles (akan diambil dari API terpisah jika diperlukan)
   */
  const renderRoles = () => {
    return (
      <Badge variant="outline" className="text-xs">
        User
      </Badge>
    )
  }

  if (loading) {
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    {searchTerm ? 'No users found matching your search.' : 'No users available.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow 
                    key={user.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => onUserSelect(user.id.toString())}
                  >
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{renderRoles()}</TableCell>
                    <TableCell>{user.department || '-'}</TableCell>
                    <TableCell>{user.region || '-'}</TableCell>
                    <TableCell>{user.level || '-'}</TableCell>
                    <TableCell>{renderStatusBadge(user.active)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.createdAt).toLocaleDateString('id-ID')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <IconDots className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onUserSelect(user.id.toString())
                          }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onUserEdit(user.id.toString())
                          }}>
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onRoleAssignment(user.id.toString())
                          }}>
                            Manage Roles
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Summary */}
        <div className="mt-4 text-sm text-muted-foreground">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </CardContent>
    </Card>
  )
}