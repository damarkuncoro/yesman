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
import { IconSearch, IconUserPlus, IconUserMinus, IconCalendar } from "@tabler/icons-react"
import { toast } from "sonner"

// Interface untuk Role
interface Role {
  id: string
  name: string
}

// Interface untuk User Mapping
interface UserMapping {
  id: string
  username: string
  email: string
  fullName: string
  status: string
  assignedAt: string
  assignedBy: string
  expiresAt: string | null
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
      setAvailableRoles(data.roles || [])
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
        throw new Error('Failed to fetch user mappings')
      }

      const data = await response.json()
      setUserMappings(data.users || [])
    } catch (error) {
      console.error('Error fetching user mappings:', error)
      toast.error('Failed to load user mappings')
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
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
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
  const renderExpiryInfo = (expiresAt: string | null) => {
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

    try {
      const response = await fetch(`/api/roles/${currentRoleId}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to remove user from role')
      }
      
      setUserMappings(prev => prev.filter(user => user.id !== userId))
      toast.success(`User ${username} removed from role successfully`)
    } catch (error) {
      console.error('Error removing user from role:', error)
      toast.error('Failed to remove user from role')
    }
  }

  /**
   * Get selected role name
   */
  const getSelectedRoleName = () => {
    const role = availableRoles.find(r => r.id === currentRoleId)
    return role?.name || "Unknown Role"
  }

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
              <Button>
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
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-sm text-muted-foreground">
                              @{user.username} • {user.email}
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
                            onClick={() => handleRemoveUser(user.id, user.username)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <IconUserMinus className="h-4 w-4" />
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
    </div>
  )
}