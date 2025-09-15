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
import { Checkbox } from "@/components/shadcn/ui/checkbox"
import { Separator } from "@/components/shadcn/ui/separator"
import { Badge } from "@/components/shadcn/ui/badge"
import { IconDeviceFloppy, IconX, IconUser, IconLock, IconShield } from "@tabler/icons-react"
import { toast } from "sonner"
import { useAuth } from '@/contexts/AuthContext';

interface UserFormData {
  id?: string
  name: string
  email: string
  password?: string
  confirmPassword?: string
  department: string
  region: string
  level?: string
  status: 'active' | 'inactive'
  roles: string[]
}

interface Role {
  id: number
  name: string
  grantsAll: boolean
  createdAt: string
  updatedAt?: string
}

interface UserCreateEditTabProps {
  userId: string | null
  mode: 'create' | 'edit'
  onSuccess: () => void
}

/**
 * Komponen untuk create/edit user dengan ABAC attributes
 * Menangani form input untuk user data, password, dan role assignment
 */
export function UserCreateEditTab({ userId, mode, onSuccess }: UserCreateEditTabProps) {
  const { accessToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    name: '',
    password: '',
    confirmPassword: '',
    department: '',
    region: '',
    level: '',
    status: 'active',
    roles: []
  })
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [errors, setErrors] = useState<Partial<UserFormData>>({})

  /**
   * Fetch roles dari API
   */
  const fetchRoles = async () => {
    if (!accessToken) return

    try {
      const response = await fetch('/api/rbac/roles', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data roles')
      }

      if (result.success && result.data) {
        setAvailableRoles(result.data)
      }
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast.error('Gagal mengambil data roles')
    }
  }

  /**
   * Fetch user data untuk edit mode
   */
  const fetchUserData = async (id: string) => {
    if (!accessToken) return

    try {
      setLoadingData(true)
      const response = await fetch(`/api/users/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data user')
      }

      if (result.success && result.data?.user) {
        const user = result.data.user
        setFormData({
          email: user.email,
          name: user.name,
          password: '', // Password tidak di-load untuk security
          confirmPassword: '',
          department: user.department || '',
          region: user.region || '',
          level: user.level || '',
          status: user.active ? 'active' : 'inactive',
          roles: user.roles?.map((role: any) => role.id.toString()) || []
        })
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
      toast.error('Gagal mengambil data user')
    } finally {
      setLoadingData(false)
    }
  }

  // Fetch roles saat komponen mount
  useEffect(() => {
    fetchRoles()
  }, [accessToken])

  // Load user data untuk edit mode
  useEffect(() => {
    if (mode === 'edit' && userId) {
      fetchUserData(userId)
    } else {
      // Reset form untuk create mode
      setFormData({
        email: '',
        name: '',
        password: '',
        confirmPassword: '',
        department: '',
        region: '',
        level: '',
        status: 'active',
        roles: []
      })
    }
  }, [mode, userId, accessToken])

  /**
   * Handle perubahan input form
   */
  const handleInputChange = (field: keyof UserFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error ketika user mulai mengetik
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  /**
   * Handle perubahan role selection
   */
  const handleRoleChange = (roleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      roles: checked 
        ? [...prev.roles, roleId]
        : prev.roles.filter(id => id !== roleId)
    }))
  }

  /**
   * Update user roles via API
   */
  const updateUserRoles = async (userId: string, roleIds: string[]) => {
    if (!accessToken) return

    try {
      const response = await fetch(`/api/users/${userId}/roles`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roleIds: roleIds.map(id => parseInt(id)) })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengupdate roles user')
      }

      toast.success('User roles berhasil diupdate')
    } catch (error) {
      console.error('Error updating user roles:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal mengupdate roles user')
      throw error
    }
  }

  /**
   * Validasi form data
   */
  const validateForm = (): boolean => {
    const newErrors: Partial<UserFormData> = {}

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }

    if (!formData.name) {
      newErrors.name = 'Name is required'
    }

    // Password validation untuk create mode
    if (mode === 'create' && !formData.password) {
      newErrors.password = 'Password is required'
    }

    // Password validation untuk edit mode - optional tapi jika diisi harus valid
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    // Confirm password validation - hanya jika password diisi
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.department) {
      newErrors.department = 'Department is required'
    }

    if (!formData.region) {
      newErrors.region = 'Region is required'
    }

    if (!formData.level) {
      newErrors.level = 'Level is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    if (!accessToken) {
      toast.error('Token akses tidak tersedia')
      return
    }

    setLoading(true)
    
    try {
      if (mode === 'edit' && userId) {
        // Prepare update data
        const updateData: any = {
          name: formData.name,
          email: formData.email,
          department: formData.department,
          region: formData.region,
          level: formData.level,
          active: formData.status === 'active'
        }

        // Include password only if provided
        if (formData.password && formData.password.trim() !== '') {
          updateData.password = formData.password
        }

        // Update existing user
        const response = await fetch(`/api/users/${userId}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData)
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Gagal mengupdate user')
        }

        // Update user roles if any roles are selected
        if (formData.roles.length > 0) {
          await updateUserRoles(userId, formData.roles)
        }

        toast.success(`User ${formData.name} berhasil diupdate`)
      } else {
        // Create new user menggunakan register endpoint
        const response = await fetch('/api/v1/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            password: formData.password,
            department: formData.department,
            region: formData.region,
            level: formData.level
          })
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.message || 'Gagal membuat user')
        }

        // Assign roles to newly created user if any roles are selected
        if (result.success && result.data?.user?.id && formData.roles.length > 0) {
          await updateUserRoles(result.data.user.id.toString(), formData.roles)
        }

        toast.success(`User ${formData.name} berhasil dibuat`)
      }
      
      onSuccess()
    } catch (error) {
      console.error('Error saving user:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal menyimpan user')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get selected role names untuk display
   */
  const getSelectedRoleNames = () => {
    if (!Array.isArray(availableRoles)) {
      return []
    }
    return availableRoles
      .filter(role => formData.roles.includes(role.id.toString()))
      .map(role => role.name)
  }

  // Show loading state saat fetch data
  if (loadingData) {
    return (
      <div className="flex items-center justify-center p-8">
        <IconUser className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading user data...</span>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconUser className="h-5 w-5" />
            <CardTitle>
              {mode === 'create' ? 'Create New User' : 'Edit User'}
            </CardTitle>
          </div>
          <CardDescription>
            {mode === 'create' 
              ? 'Enter user information and set initial password'
              : 'Update user information and optionally change password'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="user@company.com"
                disabled={mode === 'edit'} // Email tidak bisa diubah
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconLock className="h-5 w-5" />
            <CardTitle>Password</CardTitle>
          </div>
          <CardDescription>
            {mode === 'create' 
              ? 'Set initial password for the user'
              : 'Leave blank to keep current password'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">
                Password {mode === 'create' && '*'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Enter password"
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirm Password {mode === 'create' && '*'}
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="Confirm password"
              />
              {errors.confirmPassword && (
                <p className="text-sm text-destructive">{errors.confirmPassword}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ABAC Attributes Card */}
      <Card>
        <CardHeader>
          <CardTitle>ABAC Attributes</CardTitle>
          <CardDescription>
            Set department, region, and level for attribute-based access control
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="department">Department *</Label>
              <Select 
                value={formData.department} 
                onValueChange={(value) => handleInputChange('department', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">IT</SelectItem>
                  <SelectItem value="Sales">Sales</SelectItem>
                  <SelectItem value="Marketing">Marketing</SelectItem>
                  <SelectItem value="Finance">Finance</SelectItem>
                  <SelectItem value="HR">HR</SelectItem>
                  <SelectItem value="Operations">Operations</SelectItem>
                </SelectContent>
              </Select>
              {errors.department && (
                <p className="text-sm text-destructive">{errors.department}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="region">Region *</Label>
              <Select 
                value={formData.region} 
                onValueChange={(value) => handleInputChange('region', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Jakarta">Jakarta</SelectItem>
                  <SelectItem value="Surabaya">Surabaya</SelectItem>
                  <SelectItem value="Bandung">Bandung</SelectItem>
                  <SelectItem value="Medan">Medan</SelectItem>
                  <SelectItem value="Semarang">Semarang</SelectItem>
                  <SelectItem value="Yogyakarta">Yogyakarta</SelectItem>
                </SelectContent>
              </Select>
              {errors.region && (
                <p className="text-sm text-destructive">{errors.region}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="level">Level *</Label>
              <Select 
                value={formData.level} 
                onValueChange={(value) => handleInputChange('level', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Junior">Junior</SelectItem>
                  <SelectItem value="Senior">Senior</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Director">Director</SelectItem>
                  <SelectItem value="C-Level">C-Level</SelectItem>
                </SelectContent>
              </Select>
              {errors.level && (
                <p className="text-sm text-destructive">{errors.level}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value: 'active' | 'inactive') => handleInputChange('status', value)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Role Assignment Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconShield className="h-5 w-5" />
            <CardTitle>Role Assignment</CardTitle>
          </div>
          <CardDescription>
            Select roles to assign to this user
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.isArray(availableRoles) ? availableRoles.map((role) => (
              <div key={role.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={formData.roles.includes(role.id.toString())}
                  onCheckedChange={(checked) => 
                    handleRoleChange(role.id.toString(), checked as boolean)
                  }
                />
                <div className="flex-1">
                  <Label 
                    htmlFor={`role-${role.id}`} 
                    className="text-sm font-medium cursor-pointer"
                  >
                    {role.name}
                  </Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    {role.grantsAll ? 'Full Access' : 'Limited Access'}
                  </p>
                </div>
              </div>
            )) : null}
          </div>
          
          {formData.roles.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Selected Roles:</p>
              <div className="flex flex-wrap gap-2">
                {getSelectedRoleNames().map((roleName) => (
                  <Badge key={roleName} variant="secondary">
                    {roleName}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onSuccess}
          disabled={loading}
        >
          <IconX className="h-4 w-4 mr-2" />
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          <IconDeviceFloppy className="h-4 w-4 mr-2" />
          {loading 
            ? (mode === 'create' ? 'Creating...' : 'Updating...') 
            : (mode === 'create' ? 'Create User' : 'Update User')
          }
        </Button>
      </div>
    </form>
  )
}