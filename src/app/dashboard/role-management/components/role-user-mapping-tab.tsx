"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/shadcn/ui/button"
import { Input } from "@/components/shadcn/ui/input"
import { Badge } from "@/components/shadcn/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/ui/select"
import { IconSearch, IconUserPlus, IconUserMinus, IconCalendar, IconX } from "@tabler/icons-react"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/shadcn/ui/dialog"

// Interface untuk Role
interface Role {
  id: string
  name: string
}

// Interface untuk User Mapping
interface UserMapping {
  id: string
  name: string
  email: string
  status: string
  assignedAt: string
  assignedBy: string
  expiresAt?: string
}

// Interface untuk Available User (untuk assign)
interface AvailableUser {
  id: string
  name: string
  email: string
  active: boolean
}

interface RoleUserMappingTabProps {
  selectedRoleId?: string
}

/**
 * Komponen tab untuk menampilkan user mapping
 * Menampilkan user-user yang memiliki role tertentu
 */
export function RoleUserMappingTab({ selectedRoleId }: RoleUserMappingTabProps) {
  const { accessToken } = useAuth()
  const [currentRoleId, setCurrentRoleId] = useState<string>(selectedRoleId || "")
  const [searchTerm, setSearchTerm] = useState("")
  const [userMappings, setUserMappings] = useState<UserMapping[]>([])
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingRoles, setLoadingRoles] = useState(false)
  const [showAssignDialog, setShowAssignDialog] = useState(false)
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [assignSearchTerm, setAssignSearchTerm] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [assigningUsers, setAssigningUsers] = useState(false)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)

  /**
   * Fetch available roles dari API
   */
  const fetchRoles = async () => {
    if (!accessToken) return

    try {
      setLoadingRoles(true)
      const response = await fetch('/api/roles', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch roles')
      }

      const data = await response.json()
      setAvailableRoles(data.data?.roles || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast.error('Failed to load roles')
    } finally {
      setLoadingRoles(false)
    }
  }

  /**
   * Fetch user mappings berdasarkan role yang dipilih
   */
  const fetchUserMappings = async (roleId: string) => {
    if (!accessToken || !roleId) return

    try {
      setLoading(true)
      const response = await fetch(`/api/roles/${roleId}/users`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        const data = await response.json()
        
        // Handle specific error cases
        if (response.status === 404) {
          toast.error('Role tidak ditemukan atau telah dihapus')
          setUserMappings([])
        } else if (response.status === 403) {
          toast.error('Anda tidak memiliki izin untuk melihat user mapping role ini')
        } else {
          toast.error(data.message || 'Gagal memuat user mappings')
        }
        return
      }

      const data = await response.json()
      setUserMappings(data.users || [])
    } catch (error) {
      console.error('Error fetching user mappings:', error)
      toast.error('Terjadi kesalahan saat memuat user mappings')
      setUserMappings([])
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load roles saat komponen mount
   */
  useEffect(() => {
    fetchRoles()
  }, [accessToken])

  /**
   * Load user mappings berdasarkan role yang dipilih
   */
  useEffect(() => {
    if (currentRoleId) {
      fetchUserMappings(currentRoleId)
    } else {
      setUserMappings([])
    }
  }, [currentRoleId, accessToken])

  /**
   * Update currentRoleId ketika selectedRoleId berubah
   */
  useEffect(() => {
    if (selectedRoleId) {
      setCurrentRoleId(selectedRoleId)
    }
  }, [selectedRoleId])

  /**
   * Filter users berdasarkan search term
   */
  const filteredUsers = userMappings.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  /**
   * Render status badge
   */
  const renderStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      active: "default",
      inactive: "secondary",
      expired: "destructive"
    }
    
    return (
      <Badge variant={variants[status] || "secondary"}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  /**
   * Render expiry information
   */
  const renderExpiryInfo = (expiresAt?: string) => {
    if (!expiresAt) {
      return (
        <Badge variant="outline">
          No Expiry
        </Badge>
      )
    }

    const expiryDate = new Date(expiresAt)
    const now = new Date()
    const isExpired = expiryDate < now
    const isExpiringSoon = expiryDate.getTime() - now.getTime() < 30 * 24 * 60 * 60 * 1000 // 30 days

    return (
      <div className="flex items-center gap-2">
        <IconCalendar className="h-4 w-4 text-muted-foreground" />
        <span className={`text-sm ${
          isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-muted-foreground'
        }`}>
          {expiryDate.toLocaleDateString()}
        </span>
        {isExpired && (
          <Badge variant="destructive" className="text-xs">
            Expired
          </Badge>
        )}
        {!isExpired && isExpiringSoon && (
          <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-600">
            Expiring Soon
          </Badge>
        )}
      </div>
    )
  }

  /**
   * Handle remove user from role
   */
  const handleRemoveUser = async (userId: string, username: string) => {
    if (!accessToken || !currentRoleId) {
      toast.error('Authentication required')
      return
    }

    setRemovingUserId(userId)
    try {
      const response = await fetch(`/api/roles/${currentRoleId}/users`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        if (response.status === 404) {
          toast.error('User atau role tidak ditemukan')
        } else if (response.status === 403) {
          toast.error('Anda tidak memiliki izin untuk menghapus user dari role ini')
        } else {
          toast.error(errorData.message || 'Gagal menghapus user dari role')
        }
        return
      }
      
      setUserMappings(prev => prev.filter(user => user.id !== userId))
      toast.success(`User ${username} berhasil dihapus dari role`)
    } catch (error) {
      console.error('Error removing user from role:', error)
      toast.error('Terjadi kesalahan saat menghapus user dari role')
    } finally {
      setRemovingUserId(null)
    }
  }

  /**
   * Fetch available users yang belum memiliki role ini
   */
  const fetchAvailableUsers = async () => {
    if (!accessToken) return

    try {
      setLoadingUsers(true)
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      const allUsers = data.data?.users || []
      
      // Filter users yang belum memiliki role ini
      const currentUserIds = userMappings.map(um => um.id)
      const availableUsersFiltered = allUsers.filter((user: any) => 
        !currentUserIds.includes(user.id.toString()) && user.active
      )
      
      setAvailableUsers(availableUsersFiltered.map((user: any) => ({
        id: user.id.toString(),
        name: user.name,
        email: user.email,
        active: user.active
      })))
    } catch (error) {
      console.error('Error fetching available users:', error)
      toast.error('Failed to load available users')
    } finally {
      setLoadingUsers(false)
    }
  }

  /**
   * Handle assign users to role
   */
  const handleAssignUsers = async () => {
    if (!accessToken || !currentRoleId || selectedUsers.length === 0) {
      toast.error('Please select at least one user')
      return
    }

    try {
      setAssigningUsers(true)
      
      // Assign each selected user
      const promises = selectedUsers.map(userId => 
        fetch(`/api/roles/${currentRoleId}/users`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ userId })
        })
      )
      
      const responses = await Promise.all(promises)
      const results = await Promise.all(
        responses.map(async (response, index) => ({
          success: response.ok,
          status: response.status,
          data: response.ok ? await response.json() : await response.json().catch(() => ({})),
          userId: selectedUsers[index]
        }))
      )
      
      const successful = results.filter(r => r.success)
      const failed = results.filter(r => !r.success)
      
      if (successful.length > 0) {
        toast.success(`Berhasil menambahkan ${successful.length} user ke role`)
      }
      
      if (failed.length > 0) {
        const errorMessages = failed.map(f => {
          if (f.status === 409) return "User sudah memiliki role ini"
          if (f.status === 404) return "User atau role tidak ditemukan"
          if (f.status === 403) return "Tidak memiliki izin"
          return f.data.message || "Gagal menambahkan user"
        })
        
        toast.error(`${failed.length} user gagal ditambahkan: ${errorMessages[0]}`)
      }
      
      // Refresh user mappings if any successful
      if (successful.length > 0) {
        await fetchUserMappings(currentRoleId)
        
        // Reset and close dialog
        setSelectedUsers([])
        setAssignSearchTerm("")
        setShowAssignDialog(false)
      }
      
    } catch (error) {
      console.error('Error assigning users:', error)
      toast.error('Terjadi kesalahan saat menambahkan user ke role')
    } finally {
      setAssigningUsers(false)
    }
  }

  /**
   * Handle open assign dialog
   */
  const handleOpenAssignDialog = () => {
    setShowAssignDialog(true)
    fetchAvailableUsers()
  }

  /**
   * Get selected role name
   */
  const getSelectedRoleName = () => {
    const role = availableRoles.find(r => r.id === currentRoleId)
    return role?.name || "Unknown Role"
  }

  /**
   * Filter available users for assign dialog
   */
  const filteredAvailableUsers = availableUsers.filter(user =>
    user.name.toLowerCase().includes(assignSearchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(assignSearchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Role User Mapping</CardTitle>
          <CardDescription>
            Lihat dan kelola user yang memiliki role tertentu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={currentRoleId} onValueChange={setCurrentRoleId} disabled={loadingRoles}>
                <SelectTrigger>
                  <SelectValue placeholder={loadingRoles ? "Loading roles..." : "Select a role to view users"} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {currentRoleId && (
              <Button onClick={handleOpenAssignDialog}>
                <IconUserPlus className="mr-2 h-4 w-4" />
                Assign Users
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* User List */}
      {currentRoleId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Users with {getSelectedRoleName()} Role</CardTitle>
                <CardDescription>
                  {filteredUsers.length} user(s) found
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading users...
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Assigned Date</TableHead>
                      <TableHead>Assigned By</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderStatusBadge(user.status)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.assignedAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.assignedBy}
                        </TableCell>
                        <TableCell>
                          {renderExpiryInfo(user.expiresAt)}
                        </TableCell>
                        <TableCell>
                          <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveUser(user.id, user.name)}
                              disabled={removingUserId === user.id}
                              className="text-red-600 hover:text-red-800 disabled:opacity-50"
                            >
                              {removingUserId === user.id ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-600 border-t-transparent" />
                              ) : (
                                <IconX className="h-4 w-4" />
                              )}
                            </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {!loading && filteredUsers.length === 0 && currentRoleId && (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm 
                  ? "No users found matching your search."
                  : "No users assigned to this role."
                }
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!currentRoleId && (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Select a role to view user mappings</p>
          </CardContent>
        </Card>
      )}

      {/* Assign Users Dialog */}
      <Dialog open={showAssignDialog} onOpenChange={setShowAssignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assign Users to {getSelectedRoleName()}</DialogTitle>
            <DialogDescription>
              Select users to assign to this role. Only active users who don't already have this role are shown.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={assignSearchTerm}
                onChange={(e) => setAssignSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* User List */}
            <div className="max-h-96 overflow-y-auto border rounded-md">
              {loadingUsers ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading users...
                </div>
              ) : filteredAvailableUsers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {assignSearchTerm 
                    ? "No users found matching your search."
                    : "No available users to assign."
                  }
                </div>
              ) : (
                <div className="p-2 space-y-2">
                  {filteredAvailableUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-3 p-3 rounded-md cursor-pointer hover:bg-muted ${
                        selectedUsers.includes(user.id) ? 'bg-muted border-2 border-primary' : 'border'
                      }`}
                      onClick={() => {
                        setSelectedUsers(prev => 
                          prev.includes(user.id)
                            ? prev.filter(id => id !== user.id)
                            : [...prev, user.id]
                        )
                      }}
                    >
                      <div className="flex-1">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                      {selectedUsers.includes(user.id) && (
                        <Badge variant="default">Selected</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selectedUsers.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {selectedUsers.length} user(s) selected
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAssignDialog(false)
                setSelectedUsers([])
                setAssignSearchTerm("")
              }}
              disabled={assigningUsers}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignUsers}
              disabled={selectedUsers.length === 0 || assigningUsers}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {assigningUsers ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Menambahkan...
                </>
              ) : (
                `Assign (${selectedUsers.length})`
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}