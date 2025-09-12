"use client"

import { useState, useEffect } from "react"
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

// Mock data untuk role options
const mockRoles = [
  { id: "1", name: "Admin" },
  { id: "2", name: "Editor" },
  { id: "3", name: "Viewer" },
  { id: "4", name: "Manager" },
  { id: "5", name: "Analyst" }
]

// Mock data untuk user mappings
const mockUserMappings = {
  "1": [ // Admin role
    {
      id: "1",
      username: "john.doe",
      email: "john.doe@company.com",
      fullName: "John Doe",
      status: "active",
      assignedAt: "2024-01-15",
      assignedBy: "system",
      expiresAt: null
    },
    {
      id: "2",
      username: "jane.smith",
      email: "jane.smith@company.com",
      fullName: "Jane Smith",
      status: "active",
      assignedAt: "2024-01-18",
      assignedBy: "john.doe",
      expiresAt: null
    },
    {
      id: "3",
      username: "admin.user",
      email: "admin@company.com",
      fullName: "Admin User",
      status: "active",
      assignedAt: "2024-01-10",
      assignedBy: "system",
      expiresAt: null
    }
  ],
  "2": [ // Editor role
    {
      id: "4",
      username: "editor1",
      email: "editor1@company.com",
      fullName: "Editor One",
      status: "active",
      assignedAt: "2024-01-20",
      assignedBy: "john.doe",
      expiresAt: "2024-12-31"
    },
    {
      id: "5",
      username: "editor2",
      email: "editor2@company.com",
      fullName: "Editor Two",
      status: "active",
      assignedAt: "2024-01-22",
      assignedBy: "jane.smith",
      expiresAt: null
    }
  ],
  "3": [ // Viewer role
    {
      id: "6",
      username: "viewer1",
      email: "viewer1@company.com",
      fullName: "Viewer One",
      status: "active",
      assignedAt: "2024-01-25",
      assignedBy: "john.doe",
      expiresAt: "2024-06-30"
    },
    {
      id: "7",
      username: "viewer2",
      email: "viewer2@company.com",
      fullName: "Viewer Two",
      status: "inactive",
      assignedAt: "2024-01-20",
      assignedBy: "jane.smith",
      expiresAt: "2024-03-31"
    }
  ]
}

interface RoleUserMappingTabProps {
  selectedRoleId?: string
}

/**
 * Komponen tab untuk menampilkan user mapping
 * Menampilkan user-user yang memiliki role tertentu
 */
export function RoleUserMappingTab({ selectedRoleId }: RoleUserMappingTabProps) {
  const [currentRoleId, setCurrentRoleId] = useState<string>(selectedRoleId || "")
  const [searchTerm, setSearchTerm] = useState("")
  const [userMappings, setUserMappings] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  /**
   * Load user mappings berdasarkan role yang dipilih
   */
  useEffect(() => {
    if (currentRoleId) {
      setLoading(true)
      // Simulasi API call
      setTimeout(() => {
        const mappings = mockUserMappings[currentRoleId as keyof typeof mockUserMappings] || []
        setUserMappings(mappings)
        setLoading(false)
      }, 500)
    } else {
      setUserMappings([])
    }
  }, [currentRoleId])

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
    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setUserMappings(prev => prev.filter(user => user.id !== userId))
      toast.success(`User ${username} removed from role successfully`)
    } catch (error) {
      toast.error("Failed to remove user from role")
    }
  }

  /**
   * Get selected role name
   */
  const getSelectedRoleName = () => {
    const role = mockRoles.find(r => r.id === currentRoleId)
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
              <Select value={currentRoleId} onValueChange={setCurrentRoleId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role to view users" />
                </SelectTrigger>
                <SelectContent>
                  {mockRoles.map((role) => (
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