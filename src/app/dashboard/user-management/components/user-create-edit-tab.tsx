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

interface UserFormData {
  email: string
  name: string
  password: string
  confirmPassword: string
  department: string
  region: string
  level: string
  status: 'active' | 'inactive'
  roles: string[]
}

interface Role {
  id: string
  name: string
  description: string
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
  const [loading, setLoading] = useState(false)
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

  // Mock data untuk roles
  useEffect(() => {
    const mockRoles: Role[] = [
      { id: '1', name: 'Admin', description: 'Full system administrator access' },
      { id: '2', name: 'Manager', description: 'Department manager privileges' },
      { id: '3', name: 'Employee', description: 'Standard employee access' },
      { id: '4', name: 'Super User', description: 'Extended user privileges' },
      { id: '5', name: 'Viewer', description: 'Read-only access' }
    ]
    setAvailableRoles(mockRoles)
  }, [])

  // Load user data untuk edit mode
  useEffect(() => {
    if (mode === 'edit' && userId) {
      // Mock data - nanti akan diganti dengan API call
      const mockUserData: UserFormData = {
        email: 'admin@company.com',
        name: 'Admin User',
        password: '',
        confirmPassword: '',
        department: 'IT',
        region: 'Jakarta',
        level: 'Senior',
        status: 'active',
        roles: ['1', '4'] // Admin dan Super User
      }
      setFormData(mockUserData)
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
  }, [mode, userId])

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

    if (mode === 'create' && !formData.password) {
      newErrors.password = 'Password is required'
    }

    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
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

    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success(`User ${formData.name} has been ${mode === 'create' ? 'created' : 'updated'} successfully.`)
      
      onSuccess()
    } catch (error) {
      toast.error(`Failed to ${mode} user. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get selected role names untuk display
   */
  const getSelectedRoleNames = () => {
    return availableRoles
      .filter(role => formData.roles.includes(role.id))
      .map(role => role.name)
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
            {availableRoles.map((role) => (
              <div key={role.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                <Checkbox
                  id={`role-${role.id}`}
                  checked={formData.roles.includes(role.id)}
                  onCheckedChange={(checked) => 
                    handleRoleChange(role.id, checked as boolean)
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
                    {role.description}
                  </p>
                </div>
              </div>
            ))}
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