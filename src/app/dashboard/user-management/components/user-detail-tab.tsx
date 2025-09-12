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

interface UserDetail {
  id: string
  email: string
  name: string
  roles: Array<{
    id: string
    name: string
    description: string
    assignedAt: string
  }>
  department: string
  region: string
  level: string
  status: 'active' | 'inactive'
  createdAt: string
  lastLogin: string
  policies: Array<{
    id: string
    name: string
    description: string
    effect: 'allow' | 'deny'
  }>
  loginHistory: Array<{
    id: string
    timestamp: string
    ipAddress: string
    userAgent: string
    success: boolean
  }>
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

  // Mock data - nanti akan diganti dengan API call
  useEffect(() => {
    if (!userId) {
      setUserDetail(null)
      setLoading(false)
      return
    }

    const mockUserDetail: UserDetail = {
      id: userId,
      email: "admin@company.com",
      name: "Admin User",
      roles: [
        {
          id: "1",
          name: "Admin",
          description: "Full system administrator access",
          assignedAt: "2023-01-01T00:00:00Z"
        },
        {
          id: "2",
          name: "Super User",
          description: "Extended user privileges",
          assignedAt: "2023-06-01T00:00:00Z"
        }
      ],
      department: "IT",
      region: "Jakarta",
      level: "Senior",
      status: "active",
      createdAt: "2023-01-01T00:00:00Z",
      lastLogin: "2024-01-15T10:30:00Z",
      policies: [
        {
          id: "1",
          name: "User Management",
          description: "Can create, read, update, and delete users",
          effect: "allow"
        },
        {
          id: "2",
          name: "System Settings",
          description: "Can modify system configuration",
          effect: "allow"
        },
        {
          id: "3",
          name: "Financial Data",
          description: "Cannot access financial reports",
          effect: "deny"
        }
      ],
      loginHistory: [
        {
          id: "1",
          timestamp: "2024-01-15T10:30:00Z",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          success: true
        },
        {
          id: "2",
          timestamp: "2024-01-14T15:45:00Z",
          ipAddress: "192.168.1.100",
          userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          success: true
        },
        {
          id: "3",
          timestamp: "2024-01-13T08:20:00Z",
          ipAddress: "192.168.1.105",
          userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          success: false
        }
      ]
    }

    setTimeout(() => {
      setUserDetail(mockUserDetail)
      setLoading(false)
    }, 500)
  }, [userId])

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

  /**
   * Render policy effect badge
   */
  const renderPolicyEffect = (effect: 'allow' | 'deny') => {
    return (
      <Badge variant={effect === 'allow' ? 'default' : 'destructive'}>
        {effect === 'allow' ? 'Allow' : 'Deny'}
      </Badge>
    )
  }

  /**
   * Render login success badge
   */
  const renderLoginSuccess = (success: boolean) => {
    return (
      <Badge variant={success ? 'default' : 'destructive'}>
        {success ? 'Success' : 'Failed'}
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

  return (
    <div className="space-y-6">
      {/* User Profile Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <IconUser className="h-8 w-8" />
              <div>
                <CardTitle>{userDetail.name}</CardTitle>
                <CardDescription>{userDetail.email}</CardDescription>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => onUserEdit(userDetail.id)}
                className="flex items-center gap-2"
              >
                <IconEdit className="h-4 w-4" />
                Edit User
              </Button>
              <Button 
                variant="outline" 
                onClick={() => onRoleAssignment(userDetail.id)}
                className="flex items-center gap-2"
              >
                <IconSettings className="h-4 w-4" />
                Manage Roles
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Department</p>
              <p className="text-sm">{userDetail.department}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Region</p>
              <p className="text-sm">{userDetail.region}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Level</p>
              <p className="text-sm">{userDetail.level}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className="mt-1">{renderStatusBadge(userDetail.status)}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-sm">{new Date(userDetail.createdAt).toLocaleDateString('id-ID')}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Last Login</p>
              <p className="text-sm">{new Date(userDetail.lastLogin).toLocaleDateString('id-ID')}</p>
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
            {userDetail.roles.map((role) => (
              <div key={role.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{role.name}</p>
                  <p className="text-sm text-muted-foreground">{role.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Assigned: {new Date(role.assignedAt).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Policies Card */}
      <Card>
        <CardHeader>
          <CardTitle>Applied Policies</CardTitle>
          <CardDescription>
            Policy yang berlaku untuk user berdasarkan role dan atribut ABAC
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Effect</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userDetail.policies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.name}</TableCell>
                    <TableCell>{policy.description}</TableCell>
                    <TableCell>{renderPolicyEffect(policy.effect)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Login History Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconClock className="h-5 w-5" />
            <CardTitle>Login History</CardTitle>
          </div>
          <CardDescription>
            Riwayat login user dalam 30 hari terakhir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User Agent</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userDetail.loginHistory.map((login) => (
                  <TableRow key={login.id}>
                    <TableCell>
                      {new Date(login.timestamp).toLocaleString('id-ID')}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{login.ipAddress}</TableCell>
                    <TableCell className="max-w-xs truncate text-sm">
                      {login.userAgent}
                    </TableCell>
                    <TableCell>{renderLoginSuccess(login.success)}</TableCell>
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