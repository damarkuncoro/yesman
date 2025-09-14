"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/shadcn/ui/button"
import { Badge } from "@/components/shadcn/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card"
import { Separator } from "@/components/shadcn/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/ui/table"
import { IconEdit, IconSettings, IconUser, IconClock, IconShield } from "@tabler/icons-react"
import { useAuth } from '@/contexts/AuthContext'
import { toast } from "sonner"

interface UserDetail {
  user: {
    id: number
    email: string
    name: string
    roles: Array<{
      id: string
      name: string
      description: string
    }>
    department: string | null
    region: string | null
    active: boolean
    level: number
    createdAt: string
    updatedAt: string
    permissions: Array<{
      featureId: string
      featureName: string
      featureDescription: string
    }>
  }
}

interface UserDetailTabProps {
  userId: string | null
  onUserEdit: (userId: string) => void
  onRoleAssignment: (userId: string) => void
}

/**
 * Komponen untuk menampilkan detail lengkap user
 * Menampilkan profil, role, policy, dan history login
 */
export function UserDetailTab({ userId, onUserEdit, onRoleAssignment }: UserDetailTabProps) {
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { accessToken } = useAuth()

  /**
   * Fetch user detail dari API
   */
  const fetchUserDetail = async (id: string) => {
    if (!accessToken) return

    try {
      setLoading(true)
      const response = await fetch(`/api/users/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil detail user')
      }

      if (result.success && result.data) {
        setUserDetail(result.data)
      }
    } catch (error) {
      console.error('Error fetching user detail:', error)
      toast.error('Gagal mengambil detail user')
      setUserDetail(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!userId) {
      setUserDetail(null)
      setLoading(false)
      return
    }

    fetchUserDetail(userId)
  }, [userId, accessToken])

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



  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Detail</CardTitle>
          <CardDescription>Select a user from the list to view details</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Memuat detail user...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!userDetail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Not Found</CardTitle>
          <CardDescription>User dengan ID {userId} tidak ditemukan</CardDescription>
        </CardHeader>
      </Card>
    )
  }
  console.log("User Details",  userDetail);
  console.log("User Details? Region",  userDetail);
  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconUser className="h-8 w-8" />
              <div>
                <CardTitle>{userDetail?.user?.name}</CardTitle>
                <CardDescription>{userDetail?.user?.email}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onUserEdit(userDetail?.user?.id.toString() || '')}
                className="flex items-center gap-2"
              >
                <IconEdit className="h-4 w-4" />
                Edit User
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onRoleAssignment(userDetail?.user?.id.toString() || '')}
                className="flex items-center gap-2"
              >
                <IconSettings className="h-4 w-4" />
                Manage Roles
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Department</p>
              <p className="text-sm">{userDetail?.user?.department || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Region</p>
              <p className="text-sm">{userDetail?.user?.region || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Level</p>
              <p className="text-sm">{userDetail?.user?.level || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="mt-1">{renderStatusBadge(userDetail?.user?.active ? 'active' : 'inactive')}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-sm">{userDetail?.user?.createdAt ? new Date(userDetail.user.createdAt).toLocaleDateString('id-ID') : 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Updated At</p>
              <p className="text-sm">{userDetail?.user?.updatedAt ? new Date(userDetail.user.updatedAt).toLocaleDateString('id-ID') : 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Roles Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconShield className="h-5 w-5" />
            <CardTitle>User Roles</CardTitle>
          </div>
          <CardDescription>
            Role yang dimiliki user dan tanggal assignment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userDetail?.user?.roles?.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{role.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {role.description || 'No description available'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Role ID: {role.id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Permissions Card */}
      <Card>
        <CardHeader>
          <CardTitle>User Permissions</CardTitle>
          <CardDescription>
            Permission yang dimiliki user berdasarkan role yang diberikan
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature ID</TableHead>
                  <TableHead>Feature Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userDetail?.user?.permissions?.map((permission) => (
                  <TableRow key={permission.featureId}>
                    <TableCell className="font-mono text-sm">{permission.featureId}</TableCell>
                    <TableCell className="font-medium">{permission.featureName}</TableCell>
                    <TableCell>{permission.featureDescription}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>


    </div>
  )
}