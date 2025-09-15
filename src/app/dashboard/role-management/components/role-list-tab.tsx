"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/shadcn/ui/button"
import { Input } from "@/components/shadcn/ui/input"
import { Badge } from "@/components/shadcn/ui/badge"
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcn/ui/alert-dialog"
import { IconPlus, IconSearch, IconEdit, IconUsers, IconEye, IconTrash, IconRefresh, IconDots } from "@tabler/icons-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

interface Role {
  id: number
  name: string
  description: string | null
  grantsAll: boolean
  createdAt: string
  updatedAt: string
}

interface RoleListTabProps {
  onRoleSelect: (roleId: string) => void
  onRoleEdit: (roleId: string) => void
  onRoleCreate: () => void
  onRoleUserMapping: (roleId: string) => void
}

/**
 * Komponen tab untuk menampilkan daftar role
 * Menampilkan tabel role dengan informasi grantsAll, jumlah features, dan jumlah users
 */
export function RoleListTab({ 
  onRoleSelect, 
  onRoleEdit, 
  onRoleCreate, 
  onRoleUserMapping 
}: RoleListTabProps) {
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [deletingRoleId, setDeletingRoleId] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(false)
  const { accessToken } = useAuth()

  /**
   * Fetch roles dari API
   */
  const fetchRoles = async () => {
    try {
      setLoading(true)
      setError(null)
      
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
      console.log('API Response:', data)
      
      // Pastikan data yang diterima adalah array
      const rolesData = Array.isArray(data.data?.roles) ? data.data.roles : []
      console.log('Roles data:', rolesData)
      setRoles(rolesData)
       setLastFetch(new Date())
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roles'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
     if (accessToken) {
       fetchRoles()
     }
   }, [accessToken])

   /**
    * Auto refresh setiap 30 detik jika diaktifkan
    */
   useEffect(() => {
     if (!autoRefresh || !accessToken) return

     const interval = setInterval(() => {
       fetchRoles()
     }, 30000) // 30 seconds

     return () => clearInterval(interval)
   }, [autoRefresh, accessToken])

  /**
   * Hapus role dengan konfirmasi
   */
  const handleDeleteRole = async (roleId: string, roleName: string) => {
    try {
      setDeletingRoleId(roleId)
      
      const response = await fetch(`/api/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete role')
      }

      // Refresh data setelah delete
      await fetchRoles()
      toast.success(`Role "${roleName}" berhasil dihapus`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role'
      toast.error(errorMessage)
    } finally {
      setDeletingRoleId(null)
    }
  }

  /**
   * Filter roles berdasarkan search term
   * Pastikan roles adalah array sebelum menggunakan filter
   */
  const filteredRoles = Array.isArray(roles) ? roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : []

  /**
   * Pagination logic
   */
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedRoles = filteredRoles.slice(startIndex, endIndex)

  /**
   * Reset pagination when search changes
   */
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  /**
   * Render badge untuk grantsAll status
   */
  const renderGrantsAllBadge = (grantsAll: boolean) => {
    return (
      <Badge variant={grantsAll ? "default" : "secondary"}>
        {grantsAll ? "All Access" : "Limited"}
      </Badge>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
          <CardDescription>
            Kelola role dan permissions dalam sistem RBAC/ABAC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            Loading roles...
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role Management</CardTitle>
          <CardDescription>
            Kelola role dan permissions dalam sistem RBAC/ABAC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            Error: {error}
            <div className="mt-2">
              <Button onClick={fetchRoles} variant="outline" size="sm">
                Retry
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Role Management</CardTitle>
            <CardDescription>
              Kelola role dan permissions dalam sistem RBAC/ABAC
              {lastFetch && (
                <span className="block text-xs mt-1">
                  Last updated: {lastFetch.toLocaleTimeString('id-ID')}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-50 border-green-200" : ""}
            >
              <IconRefresh className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'Auto' : 'Manual'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRoles}
              disabled={loading}
            >
              <IconRefresh className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={onRoleCreate} className="flex items-center gap-2">
              <IconPlus className="h-4 w-4" />
              Add Role
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="flex items-center gap-2 mb-6">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles by name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Access Type</TableHead>

                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRoles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    {searchTerm ? 'No roles found matching your search.' : 'No roles available.'}
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRoles.map((role) => (
                <TableRow 
                  key={role.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => onRoleSelect(role.id.toString())}
                >
                  <TableCell className="font-medium">
                    {role.name}
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {role.description}
                  </TableCell>
                  <TableCell>
                    {renderGrantsAllBadge(role.grantsAll)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(role.createdAt).toLocaleDateString()}
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
                          onRoleSelect(role.id.toString())
                        }}>
                          <IconEye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onRoleEdit(role.id.toString())
                        }}>
                          <IconEdit className="mr-2 h-4 w-4" />
                          Edit Role
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onRoleUserMapping(role.id.toString())
                        }}>
                          <IconUsers className="mr-2 h-4 w-4" />
                          Manage Users
                        </DropdownMenuItem>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem 
                              onSelect={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                              }}
                              className="text-red-600 focus:text-red-600"
                              disabled={deletingRoleId === role.id.toString()}
                            >
                              <IconTrash className="mr-2 h-4 w-4" />
                              Delete Role
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Role</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus role "{role.name}"? 
                                Tindakan ini tidak dapat dibatalkan dan akan menghapus semua permissions yang terkait dengan role ini.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteRole(role.id.toString(), role.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Hapus
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, filteredRoles.length)} of {filteredRoles.length} roles
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mt-2 text-sm text-muted-foreground">
          Total: {roles.length} roles
        </div>
      </CardContent>
    </Card>
  )
}