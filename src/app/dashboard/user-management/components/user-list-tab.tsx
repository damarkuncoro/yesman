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

interface User {
  id: string
  email: string
  name: string
  roles: string[]
  department: string
  region: string
  level: string
  status: 'active' | 'inactive'
  lastLogin: string
  createdAt: string
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

  // Mock data - nanti akan diganti dengan API call
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: "1",
        email: "admin@company.com",
        name: "Admin User",
        roles: ["Admin", "Super User"],
        department: "IT",
        region: "Jakarta",
        level: "Senior",
        status: "active",
        lastLogin: "2024-01-15 10:30:00",
        createdAt: "2023-01-01"
      },
      {
        id: "2",
        email: "manager@company.com",
        name: "Manager User",
        roles: ["Manager"],
        department: "Sales",
        region: "Surabaya",
        level: "Manager",
        status: "active",
        lastLogin: "2024-01-14 15:45:00",
        createdAt: "2023-02-15"
      },
      {
        id: "3",
        email: "employee@company.com",
        name: "Employee User",
        roles: ["Employee"],
        department: "Marketing",
        region: "Bandung",
        level: "Junior",
        status: "inactive",
        lastLogin: "2024-01-10 09:15:00",
        createdAt: "2023-06-01"
      }
    ]
    
    setTimeout(() => {
      setUsers(mockUsers)
      setFilteredUsers(mockUsers)
      setLoading(false)
    }, 1000)
  }, [])

  /**
   * Filter users berdasarkan search term
   */
  useEffect(() => {
    const filtered = users.filter(user => 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.region.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredUsers(filtered)
  }, [searchTerm, users])

  /**
   * Render status badge dengan warna yang sesuai
   */
  const renderStatusBadge = (status: 'active' | 'inactive') => {
    return (
      <Badge variant={status === 'active' ? 'default' : 'secondary'}>
        {status === 'active' ? 'Active' : 'Inactive'}
      </Badge>
    )
  }

  /**
   * Render roles sebagai badges
   */
  const renderRoles = (roles: string[]) => {
    return (
      <div className="flex flex-wrap gap-1">
        {roles.map((role, index) => (
          <Badge key={index} variant="outline" className="text-xs">
            {role}
          </Badge>
        ))}
      </div>
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
                <TableHead>Roles</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
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
                    onClick={() => onUserSelect(user.id)}
                  >
                    <TableCell className="font-medium">{user.email}</TableCell>
                    <TableCell>{user.name}</TableCell>
                    <TableCell>{renderRoles(user.roles)}</TableCell>
                    <TableCell>{user.department}</TableCell>
                    <TableCell>{user.region}</TableCell>
                    <TableCell>{user.level}</TableCell>
                    <TableCell>{renderStatusBadge(user.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(user.lastLogin).toLocaleDateString('id-ID')}
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
                            onUserSelect(user.id)
                          }}>
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onUserEdit(user.id)
                          }}>
                            Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onRoleAssignment(user.id)
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