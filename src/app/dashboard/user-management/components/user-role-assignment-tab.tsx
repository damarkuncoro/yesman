"use client"

import React, { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/shadcn/ui/button"
import { Input } from "@/components/shadcn/ui/input"
import { Label } from "@/components/shadcn/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card"
import { Badge } from "@/components/shadcn/ui/badge"
import { Separator } from "@/components/shadcn/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/shadcn/ui/dialog"
import { IconPlus, IconTrash, IconEdit, IconShield, IconSearch } from "@tabler/icons-react"
import { toast } from "sonner"
import { useAuth } from '@/contexts/AuthContext'

interface User {
  id: number
  email: string
  name: string
  department: string | null
  region: string | null
  active: boolean
}

interface Role {
  id: number
  name: string
  grantsAll: boolean
  createdAt: string
  updatedAt?: string
}

interface UserRole {
  id: number
  userId: number
  roleId: number
  role: Role
}

interface UserRoleAssignmentTabProps {
  selectedUserId?: string
}

/**
 * Komponen untuk manage role assignment user
 * Menangani assign, update, dan revoke role untuk user
 */
export function UserRoleAssignmentTab({ selectedUserId }: UserRoleAssignmentTabProps) {
  const { accessToken } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [selectedUser, setSelectedUser] = useState<string>(selectedUserId || '')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  // Fetch users dari API
  const fetchUsers = async () => {
    try {
      setDataLoading(true)
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        console.log('Raw users data:', data)
        // Handle nested response format
        const usersData = data.data || data.users || data
        console.log('Processed users data:', usersData)
        setUsers(Array.isArray(usersData) ? usersData : [])
      } else {
        console.error('Failed to fetch users:', response.status)
        setUsers([])
        toast.error('Gagal memuat data users')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([])
      toast.error('Terjadi kesalahan saat memuat data users')
    } finally {
      setDataLoading(false)
    }
  }

  // Fetch roles dari API
  const fetchRoles = async () => {
    try {
      const response = await fetch('/api/rbac/roles', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Handle nested response format
        const rolesData = data.data || data.roles || data
        setRoles(Array.isArray(rolesData) ? rolesData : [])
      } else {
        console.error('Failed to fetch roles:', response.status)
        setRoles([])
        toast.error('Gagal memuat data roles')
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      setRoles([])
      toast.error('Terjadi kesalahan saat memuat data roles')
    }
  }

  // Fetch user roles dari API
  const fetchUserRoles = async (userId: number) => {
    try {
      const response = await fetch(`/api/rbac/users/${userId}/roles`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        // Handle nested response format
        const userRolesData = data.data || data.userRoles || data.roles || data
        setUserRoles(Array.isArray(userRolesData) ? userRolesData : [])
      } else {
        console.error('Failed to fetch user roles:', response.status)
        setUserRoles([])
        toast.error('Gagal memuat data user roles')
      }
    } catch (error) {
      console.error('Error fetching user roles:', error)
      setUserRoles([])
      toast.error('Terjadi kesalahan saat memuat data user roles')
    }
  }

  useEffect(() => {
    if (accessToken) {
      fetchUsers()
      fetchRoles()
    }
  }, [accessToken])

  useEffect(() => {
    if (selectedUser && accessToken) {
      fetchUserRoles(parseInt(selectedUser))
    }
  }, [selectedUser, accessToken])

  /**
   * Filter users berdasarkan search term
   */
  const filteredUsers = useMemo(() => {
    if (!Array.isArray(users) || users.length === 0) {
      console.log('No users available for filtering')
      return []
    }
    
    const filtered = users.filter(user => {
      if (!user || !user.name || !user.email) {
        console.warn('Invalid user object:', user)
        return false
      }
      
      const matchesSearch = searchTerm === '' || 
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      
      return matchesSearch && user.active === true
    })
    
    console.log('Users state:', users)
    console.log('Search term:', searchTerm)
    console.log('Filtered users:', filtered)
    
    return filtered
  }, [users, searchTerm])

  /**
   * Get role name by role ID
   */
  const getRoleName = (roleId: number) => {
    const role = Array.isArray(roles) ? roles.find(r => r.id === roleId) : undefined
    return role?.name || 'Unknown Role'
  }

  /**
   * Get user name by user ID
   */
  const getUserName = (userId: number) => {
    const user = Array.isArray(users) ? users.find(u => u.id === userId) : undefined
    return user?.name || 'Unknown User'
  }

  /**
   * Get available roles untuk assignment (yang belum di-assign)
   */
  const getAvailableRoles = () => {
    if (!Array.isArray(roles) || !Array.isArray(userRoles)) return []
    const assignedRoleIds = userRoles
      .filter(ur => ur.role)
      .map(ur => ur.roleId)
    return roles.filter(role => !assignedRoleIds.includes(role.id))
  }

  /**
   * Handle assign role ke user
   */
  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error('Please select both user and role')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch('/api/rbac/user-roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: parseInt(selectedUser),
          roleId: parseInt(selectedRole),
          expiresAt: expiryDate || null
        })
      })
      
      if (response.ok) {
        await fetchUserRoles(parseInt(selectedUser))
        setAssignDialogOpen(false)
        setSelectedRole('')
        setExpiryDate('')
        
        toast.success(`Role ${getRoleName(parseInt(selectedRole))} assigned to ${getUserName(parseInt(selectedUser))}`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to assign role')
      }
    } catch (error) {
      console.error('Error assigning role:', error)
      toast.error('Failed to assign role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle revoke role dari user
   */
  const handleRevokeRole = async (userRoleId: number, roleId: number) => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/rbac/user-roles', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: parseInt(selectedUser),
          roleId: roleId
        })
      })
      
      if (response.ok) {
        await fetchUserRoles(parseInt(selectedUser))
        toast.success(`Role ${getRoleName(roleId)} revoked from ${getUserName(parseInt(selectedUser))}`)
      } else {
        const errorData = await response.json()
        toast.error(errorData.message || 'Failed to revoke role')
      }
    } catch (error) {
      console.error('Error revoking role:', error)
      toast.error('Failed to revoke role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Format date untuk display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="space-y-6">
      {/* User Selection Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconShield className="h-5 w-5" />
            <CardTitle>User Role Assignment</CardTitle>
          </div>
          <CardDescription>
            Assign, update, or revoke roles for users
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <IconSearch className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-[300px]">
              <Label htmlFor="user-select">Select User</Label>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user" />
                </SelectTrigger>
                <SelectContent>
                  {dataLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading users...
                    </SelectItem>
                  ) : filteredUsers.length === 0 ? (
                    <SelectItem value="no-users" disabled>
                      {searchTerm ? 'No users found matching search' : 'No users available'}
                    </SelectItem>
                  ) : (
                    filteredUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        <div className="flex flex-col">
                          <span>{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Roles Card */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Current Roles for {selectedUser ? getUserName(parseInt(selectedUser)) : 'No User Selected'}</CardTitle>
                <CardDescription>
                  Manage roles assigned to this user
                </CardDescription>
              </div>
              <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <IconPlus className="h-4 w-4 mr-2" />
                    Assign Role
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Assign New Role</DialogTitle>
                    <DialogDescription>
                      Select a role to assign to {selectedUser ? getUserName(parseInt(selectedUser)) : 'No User Selected'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="role-select">Role</Label>
                      <Select value={selectedRole} onValueChange={setSelectedRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {getAvailableRoles().map((role) => (
                            <SelectItem key={role.id} value={role.id.toString()}>
                              <div className="flex flex-col">
                                <span>{role.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
                      <Input
                        id="expiry-date"
                        type="datetime-local"
                        value={expiryDate}
                        onChange={(e) => setExpiryDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      onClick={() => setAssignDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAssignRole} 
                      disabled={!selectedRole || loading}
                    >
                      {loading ? 'Assigning...' : 'Assign Role'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {userRoles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No roles assigned to this user
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Assigned At</TableHead>
                    <TableHead>Assigned By</TableHead>
                    <TableHead>Expires At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(userRoles) ? userRoles.map((userRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell className="font-medium">
                        {userRole.role.name}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {userRole.role.grantsAll ? 'Full Access' : 'Limited Access'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(userRole.role.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        System
                      </TableCell>
                      <TableCell className="text-sm">
                        Never
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">
                          active
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleRevokeRole(userRole.id, userRole.role.id)}
                           disabled={loading}
                         >
                           <IconTrash className="h-4 w-4 mr-2" />
                           Revoke
                         </Button>
                      </TableCell>
                    </TableRow>
                  )) : null}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Available Roles Reference */}
      <Card>
        <CardHeader>
          <CardTitle>Available Roles</CardTitle>
          <CardDescription>
            Reference of all available roles in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(roles) ? roles.map((role) => (
              <div key={role.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <IconShield className="h-4 w-4" />
                  <h4 className="font-medium">{role.name}</h4>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Access Level:</p>
                  <Badge variant={role.grantsAll ? "default" : "secondary"} className="text-xs">
                    {role.grantsAll ? "Full Access" : "Limited Access"}
                  </Badge>
                </div>
              </div>
            )) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}