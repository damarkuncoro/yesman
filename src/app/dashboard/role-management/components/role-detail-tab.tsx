"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/shadcn/ui/button"
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
import { IconEdit, IconUsers, IconCheck, IconX } from "@tabler/icons-react"

// Mock data untuk role detail
const mockRoleDetails = {
  "1": {
    id: "1",
    name: "Admin",
    description: "Full system administrator access",
    grantsAll: true,
    userCount: 3,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20",
    features: [
      {
        id: "1",
        name: "User Management",
        description: "Manage users and their permissions",
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true
      },
      {
        id: "2",
        name: "Role Management",
        description: "Manage roles and permissions",
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true
      },
      {
        id: "3",
        name: "System Settings",
        description: "Configure system-wide settings",
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false
      }
    ]
  },
  "2": {
    id: "2",
    name: "Editor",
    description: "Content management and editing permissions",
    grantsAll: false,
    userCount: 8,
    createdAt: "2024-01-16",
    updatedAt: "2024-01-18",
    features: [
      {
        id: "4",
        name: "Content Management",
        description: "Create and edit content",
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false
      },
      {
        id: "5",
        name: "Media Library",
        description: "Manage media files",
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true
      },
      {
        id: "6",
        name: "Reports",
        description: "View content reports",
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false
      }
    ]
  },
  "3": {
    id: "3",
    name: "Viewer",
    description: "Read-only access to system resources",
    grantsAll: false,
    userCount: 15,
    createdAt: "2024-01-17",
    updatedAt: "2024-01-17",
    features: [
      {
        id: "7",
        name: "Dashboard",
        description: "View dashboard and analytics",
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false
      },
      {
        id: "8",
        name: "Reports",
        description: "View system reports",
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false
      }
    ]
  }
}

interface RoleDetailTabProps {
  roleId: string | null
  onEdit: () => void
  onUserMapping: () => void
}

/**
 * Komponen tab untuk menampilkan detail role
 * Menampilkan informasi role dan fitur-fitur yang dimilikinya via RoleFeature
 */
export function RoleDetailTab({ roleId, onEdit, onUserMapping }: RoleDetailTabProps) {
  const [roleDetail, setRoleDetail] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  /**
   * Load role detail berdasarkan roleId
   */
  useEffect(() => {
    if (!roleId) return

    setLoading(true)
    // Simulasi API call
    setTimeout(() => {
      const detail = mockRoleDetails[roleId as keyof typeof mockRoleDetails]
      setRoleDetail(detail || null)
      setLoading(false)
    }, 500)
  }, [roleId])

  /**
   * Render CRUD permission badges
   */
  const renderCRUDPermissions = (feature: any) => {
    const permissions = [
      { key: 'canCreate', label: 'C', title: 'Create' },
      { key: 'canRead', label: 'R', title: 'Read' },
      { key: 'canUpdate', label: 'U', title: 'Update' },
      { key: 'canDelete', label: 'D', title: 'Delete' }
    ]

    return (
      <div className="flex gap-1">
        {permissions.map(({ key, label, title }) => (
          <Badge
            key={key}
            variant={feature[key] ? "default" : "secondary"}
            className="w-6 h-6 p-0 flex items-center justify-center text-xs"
            title={`${title}: ${feature[key] ? 'Allowed' : 'Denied'}`}
          >
            {feature[key] ? (
              <IconCheck className="h-3 w-3" />
            ) : (
              <IconX className="h-3 w-3" />
            )}
          </Badge>
        ))}
      </div>
    )
  }

  /**
   * Render grantsAll badge
   */
  const renderGrantsAllBadge = (grantsAll: boolean) => {
    return (
      <Badge variant={grantsAll ? "default" : "secondary"}>
        {grantsAll ? "All Access" : "Limited Access"}
      </Badge>
    )
  }

  if (!roleId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Select a role to view details</p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading role details...</p>
        </CardContent>
      </Card>
    )
  }

  if (!roleDetail) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Role not found</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Role Information */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {roleDetail.name}
                {renderGrantsAllBadge(roleDetail.grantsAll)}
              </CardTitle>
              <CardDescription>{roleDetail.description}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={onEdit}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit Role
              </Button>
              <Button variant="outline" onClick={onUserMapping}>
                <IconUsers className="mr-2 h-4 w-4" />
                View Users ({roleDetail.userCount})
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Created:</span>
              <span className="ml-2 text-muted-foreground">
                {new Date(roleDetail.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>
              <span className="ml-2 text-muted-foreground">
                {new Date(roleDetail.updatedAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Features */}
      <Card>
        <CardHeader>
          <CardTitle>Role Features & Permissions</CardTitle>
          <CardDescription>
            Fitur-fitur yang dapat diakses oleh role ini dengan CRUD permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {roleDetail.grantsAll ? (
            <div className="text-center py-8">
              <Badge variant="default" className="text-lg px-4 py-2">
                All Features Granted
              </Badge>
              <p className="text-muted-foreground mt-2">
                Role ini memiliki akses penuh ke semua fitur sistem
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>CRUD Permissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roleDetail.features.map((feature: any) => (
                    <TableRow key={feature.id}>
                      <TableCell className="font-medium">
                        {feature.name}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {feature.description}
                      </TableCell>
                      <TableCell>
                        {renderCRUDPermissions(feature)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!roleDetail.grantsAll && roleDetail.features.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No features assigned to this role.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}