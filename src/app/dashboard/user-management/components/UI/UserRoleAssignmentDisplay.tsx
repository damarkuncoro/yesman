import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/shadcn/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/shadcn/ui/select'
import { Input } from '@/components/shadcn/ui/input'
import { Button } from '@/components/shadcn/ui/button'
import { Badge } from '@/components/shadcn/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/shadcn/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/shadcn/ui/dialog'
import { Label } from '@/components/shadcn/ui/label'
import { Loader2, Plus, Trash2, Search } from 'lucide-react'
import { User, Role, UserRole } from '../LOGIC/useUserRoleAssignment'

/**
 * Props untuk UserRoleAssignmentDisplay component
 */
interface UserRoleAssignmentDisplayProps {
  // State
  users: User[]
  roles: Role[]
  userRoles: UserRole[]
  selectedUser: string
  searchTerm: string
  loading: boolean
  dataLoading: boolean
  assignDialogOpen: boolean
  selectedRole: string
  expiryDate: string
  filteredUsers: User[]
  
  // Setters
  setSelectedUser: (userId: string) => void
  setSearchTerm: (term: string) => void
  setAssignDialogOpen: (open: boolean) => void
  setSelectedRole: (roleId: string) => void
  setExpiryDate: (date: string) => void
  
  // Functions
  getRoleName: (roleId: number) => string
  getUserName: (userId: number) => string
  getAvailableRoles: () => Role[]
  handleAssignRole: () => Promise<void>
  handleRevokeRole: (userRoleId: number, roleId: number) => Promise<void>
  formatDate: (dateString: string) => string
}

/**
 * Komponen UI untuk menampilkan user role assignment
 * Terpisah dari logic dan hanya fokus pada rendering
 */
export function UserRoleAssignmentDisplay({
  users,
  roles,
  userRoles,
  selectedUser,
  searchTerm,
  loading,
  dataLoading,
  assignDialogOpen,
  selectedRole,
  expiryDate,
  filteredUsers,
  setSelectedUser,
  setSearchTerm,
  setAssignDialogOpen,
  setSelectedRole,
  setExpiryDate,
  getRoleName,
  getUserName,
  getAvailableRoles,
  handleAssignRole,
  handleRevokeRole,
  formatDate
}: UserRoleAssignmentDisplayProps) {
  
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* User Selection Card */}
      <Card>
        <CardHeader>
          <CardTitle>Select User</CardTitle>
          <CardDescription>
            Choose a user to manage their role assignments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger>
              <SelectValue placeholder="Select a user" />
            </SelectTrigger>
            <SelectContent>
              {filteredUsers.map((user) => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* User Roles Management */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Role Assignments</CardTitle>
                <CardDescription>
                  Manage roles for {getUserName(parseInt(selectedUser))}
                </CardDescription>
              </div>
              <Button
                onClick={() => setAssignDialogOpen(true)}
                disabled={loading || getAvailableRoles().length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                Assign Role
              </Button>
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
                    <TableHead>Assigned Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRoles.map((userRole) => (
                    <TableRow key={userRole.id}>
                      <TableCell className="font-medium">
                        {userRole.role?.name || getRoleName(userRole.roleId)}
                      </TableCell>
                      <TableCell>
                        {userRole.role?.createdAt ? formatDate(userRole.role.createdAt) : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">Active</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleRevokeRole(userRole.id, userRole.roleId)}
                          disabled={loading}
                        >
                          {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assign Role Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Role</DialogTitle>
            <DialogDescription>
              Assign a new role to {selectedUser ? getUserName(parseInt(selectedUser)) : 'selected user'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableRoles().map((role) => (
                    <SelectItem key={role.id} value={role.id.toString()}>
                      <div className="flex flex-col">
                        <span className="font-medium">{role.name}</span>
                        <span className="text-sm text-muted-foreground">
                          {role.grantsAll ? 'Grants All Permissions' : 'Limited Permissions'}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="expiry">Expiry Date (Optional)</Label>
              <Input
                id="expiry"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAssignDialogOpen(false)
                setSelectedRole('')
                setExpiryDate('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAssignRole}
              disabled={loading || !selectedRole}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Assigning...
                </>
              ) : (
                'Assign Role'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}