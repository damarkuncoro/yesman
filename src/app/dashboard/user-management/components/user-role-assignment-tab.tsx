"use client"

import { useState, useEffect } from "react"
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

interface User {
  id: string
  email: string
  name: string
  department: string
  region: string
  level: string
  status: 'active' | 'inactive'
}

interface Role {
  id: string
  name: string
  description: string
  permissions: string[]
}

interface UserRole {
  id: string
  userId: string
  roleId: string
  assignedAt: string
  assignedBy: string
  expiresAt?: string
  status: 'active' | 'expired' | 'revoked'
}

interface UserRoleAssignmentTabProps {
  selectedUserId?: string
}

/**
 * Komponen untuk manage role assignment user
 * Menangani assign, update, dan revoke role untuk user
 */
export function UserRoleAssignmentTab({ selectedUserId }: UserRoleAssignmentTabProps) {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [selectedUser, setSelectedUser] = useState<string>(selectedUserId || '')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(false)
  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState('')
  const [expiryDate, setExpiryDate] = useState('')

  // Mock data untuk users
  useEffect(() => {
    const mockUsers: User[] = [
      {
        id: '1',
        email: 'admin@company.com',
        name: 'Admin User',
        department: 'IT',
        region: 'Jakarta',
        level: 'Senior',
        status: 'active'
      },
      {
        id: '2',
        email: 'manager@company.com',
        name: 'Manager User',
        department: 'Sales',
        region: 'Surabaya',
        level: 'Manager',
        status: 'active'
      },
      {
        id: '3',
        email: 'employee@company.com',
        name: 'Employee User',
        department: 'Marketing',
        region: 'Bandung',
        level: 'Junior',
        status: 'active'
      }
    ]
    setUsers(mockUsers)
  }, [])

  // Mock data untuk roles
  useEffect(() => {
    const mockRoles: Role[] = [
      {
        id: '1',
        name: 'Admin',
        description: 'Full system administrator access',
        permissions: ['read', 'write', 'delete', 'admin']
      },
      {
        id: '2',
        name: 'Manager',
        description: 'Department manager privileges',
        permissions: ['read', 'write', 'manage_team']
      },
      {
        id: '3',
        name: 'Employee',
        description: 'Standard employee access',
        permissions: ['read', 'write_own']
      },
      {
        id: '4',
        name: 'Super User',
        description: 'Extended user privileges',
        permissions: ['read', 'write', 'advanced_features']
      },
      {
        id: '5',
        name: 'Viewer',
        description: 'Read-only access',
        permissions: ['read']
      }
    ]
    setRoles(mockRoles)
  }, [])

  // Mock data untuk user roles
  useEffect(() => {
    if (selectedUser) {
      const mockUserRoles: UserRole[] = [
        {
          id: '1',
          userId: selectedUser,
          roleId: '1',
          assignedAt: '2024-01-15T10:00:00Z',
          assignedBy: 'system@company.com',
          status: 'active'
        },
        {
          id: '2',
          userId: selectedUser,
          roleId: '4',
          assignedAt: '2024-01-20T14:30:00Z',
          assignedBy: 'admin@company.com',
          expiresAt: '2024-12-31T23:59:59Z',
          status: 'active'
        }
      ]
      setUserRoles(mockUserRoles)
    } else {
      setUserRoles([])
    }
  }, [selectedUser])

  /**
   * Filter users berdasarkan search term
   */
  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  /**
   * Get role name by role ID
   */
  const getRoleName = (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    return role?.name || 'Unknown Role'
  }

  /**
   * Get role description by role ID
   */
  const getRoleDescription = (roleId: string) => {
    const role = roles.find(r => r.id === roleId)
    return role?.description || ''
  }

  /**
   * Get user name by user ID
   */
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId)
    return user?.name || 'Unknown User'
  }

  /**
   * Get available roles untuk assignment (yang belum di-assign)
   */
  const getAvailableRoles = () => {
    const assignedRoleIds = userRoles
      .filter(ur => ur.status === 'active')
      .map(ur => ur.roleId)
    return roles.filter(role => !assignedRoleIds.includes(role.id))
  }

  /**
   * Handle assign role ke user
   */
  const handleAssignRole = async () => {
    if (!selectedUser || !selectedRole) {
      toast.error('Please select user and role')
      return
    }

    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const newUserRole: UserRole = {
        id: Date.now().toString(),
        userId: selectedUser,
        roleId: selectedRole,
        assignedAt: new Date().toISOString(),
        assignedBy: 'current-user@company.com',
        expiresAt: expiryDate || undefined,
        status: 'active'
      }
      
      setUserRoles(prev => [...prev, newUserRole])
      setAssignDialogOpen(false)
      setSelectedRole('')
      setExpiryDate('')
      
      toast.success(`Role ${getRoleName(selectedRole)} assigned to ${getUserName(selectedUser)}`)
    } catch (error) {
      toast.error('Failed to assign role. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Handle revoke role dari user
   */
  const handleRevokeRole = async (userRoleId: string, roleId: string) => {
    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setUserRoles(prev => 
        prev.map(ur => 
          ur.id === userRoleId 
            ? { ...ur, status: 'revoked' as const }
            : ur
        )
      )
      
      toast.success(`Role ${getRoleName(roleId)} revoked from ${getUserName(selectedUser)}`)
    } catch (error) {
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  /**
   * Get status badge variant
   */
  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default'
      case 'expired':
        return 'secondary'
      case 'revoked':
        return 'destructive'
      default:
        return 'outline'
    }
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
                  {filteredUsers.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      <div className="flex flex-col">
                        <span>{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </SelectItem>
                  ))}
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
                <CardTitle>Current Roles for {getUserName(selectedUser)}</CardTitle>
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
                      Select a role to assign to {getUserName(selectedUser)}
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
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex flex-col">
                                <span>{role.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {role.description}
                                </span>
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
                  {userRoles.map((userRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell className="font-medium">
                        {getRoleName(userRole.roleId)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {getRoleDescription(userRole.roleId)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(userRole.assignedAt)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {userRole.assignedBy}
                      </TableCell>
                      <TableCell className="text-sm">
                        {userRole.expiresAt ? formatDate(userRole.expiresAt) : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(userRole.status)}>
                          {userRole.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {userRole.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRevokeRole(userRole.id, userRole.roleId)}
                            disabled={loading}
                          >
                            <IconTrash className="h-4 w-4 mr-2" />
                            Revoke
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
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
            {roles.map((role) => (
              <div key={role.id} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <IconShield className="h-4 w-4" />
                  <h4 className="font-medium">{role.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {role.description}
                </p>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Permissions:</p>
                  <div className="flex flex-wrap gap-1">
                    {role.permissions.map((permission) => (
                      <Badge key={permission} variant="outline" className="text-xs">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}