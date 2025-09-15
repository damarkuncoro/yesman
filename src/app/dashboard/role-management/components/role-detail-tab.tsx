"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
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

// Interface untuk role detail
interface RoleFeature {
  id: string
  featureId: number
  name: string
  description: string
  category: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

interface RoleDetail {
  id: number
  name: string
  description: string | null
  grants_all: boolean
  created_at: string
  updated_at: string
  userCount?: number
  features: RoleFeature[]
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
  const { accessToken, isAuthenticated } = useAuth()
  const [roleDetail, setRoleDetail] = useState<RoleDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetch role detail dari API
   */
  const fetchRoleDetail = async (id: string) => {
    if (!isAuthenticated || !accessToken) return

    try {
      setLoading(true)
      setError(null)

      // Fetch role basic info
      const roleResponse = await fetch(`/api/roles/${id}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!roleResponse.ok) {
        throw new Error('Failed to fetch role details')
      }

      const roleData = await roleResponse.json()
      console.log('Role data:', roleData)

      // Fetch role features
      const featuresResponse = await fetch(`/api/roles/${id}/features`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      let features: RoleFeature[] = []
      if (featuresResponse.ok) {
        const featuresData = await featuresResponse.json()
        console.log('Features data:', featuresData)
        features = featuresData.data?.features || []
      }

      // Combine data
      const combinedData: RoleDetail = {
        ...roleData.data.role,
        features,
        userCount: 0 // TODO: Implement user count API
      }

      setRoleDetail(combinedData)
    } catch (err) {
      console.error('Error fetching role detail:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch role details')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Load role detail berdasarkan roleId
   */
  useEffect(() => {
    if (!roleId || !isAuthenticated || !accessToken) return
    fetchRoleDetail(roleId)
  }, [roleId, isAuthenticated, accessToken])

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

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-red-500">{error}</p>
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
                {renderGrantsAllBadge(roleDetail.grants_all)}
              </CardTitle>
              <CardDescription>{roleDetail.description || 'No description available'}</CardDescription>
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
                {new Date(roleDetail.created_at).toLocaleDateString()}
              </span>
            </div>
            <div>
              <span className="font-medium">Last Updated:</span>
              <span className="ml-2 text-muted-foreground">
                {new Date(roleDetail.updated_at).toLocaleDateString()}
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
          {roleDetail.grants_all ? (
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

          {!roleDetail.grants_all && roleDetail.features.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No features assigned to this role.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}