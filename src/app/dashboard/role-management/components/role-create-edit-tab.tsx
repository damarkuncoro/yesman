"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/shadcn/ui/button"
import { Input } from "@/components/shadcn/ui/input"
import { Label } from "@/components/shadcn/ui/label"
import { Textarea } from "@/components/shadcn/ui/textarea"
import { Switch } from "@/components/shadcn/ui/switch"
import { Checkbox } from "@/components/shadcn/ui/checkbox"
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
import { IconDeviceFloppy, IconArrowLeft } from "@tabler/icons-react"
import { toast } from "sonner"
import { useAuth } from "@/contexts/AuthContext"

interface Feature {
  id: number
  name: string
  description: string
  category: string
}

interface RoleCreateEditTabProps {
  roleId: string | null
  mode: 'create' | 'edit'
  onSuccess: () => void
}

interface FeaturePermission {
  featureId: string
  canCreate: boolean
  canRead: boolean
  canUpdate: boolean
  canDelete: boolean
}

interface RoleFormData {
  name: string
  description: string
  grantsAll: boolean
  features: FeaturePermission[]
}

/**
 * Komponen tab untuk membuat atau mengedit role
 * Mengelola role baru, set grantsAll, pilih fitur yang diizinkan, dan set CRUD flags
 */
export function RoleCreateEditTab({ roleId, mode, onSuccess }: RoleCreateEditTabProps) {
  const { accessToken } = useAuth()
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(false)
  const [formData, setFormData] = useState<RoleFormData>({
    name: '',
    description: '',
    grantsAll: false,
    features: []
  })
  const [availableFeatures, setAvailableFeatures] = useState<Feature[]>([])
  const [errors, setErrors] = useState<{[key: string]: string}>({})

  /**
   * Fetch available features dari API
   */
  const fetchFeatures = async () => {
    if (!accessToken) return

    try {
      const response = await fetch('/api/rbac/features', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data features')
      }

      if (result.success && result.data) {
        setAvailableFeatures(result.data)
      }
    } catch (error) {
      console.error('Error fetching features:', error)
      toast.error('Gagal mengambil data features')
    }
  }

  /**
   * Fetch role data untuk edit mode
   */
  const fetchRoleData = async (id: string) => {
    if (!accessToken) return

    try {
      setLoadingData(true)
      const response = await fetch(`/api/rbac/roles/${id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data role')
      }

      if (result.success && result.data) {
        const roleData = result.data
        setFormData({
           name: roleData.name || '',
           description: roleData.description || '',
           grantsAll: roleData.grants_all || false,
           features: roleData.features || []
         })
      }
    } catch (error) {
      console.error('Error fetching role data:', error)
      toast.error('Gagal mengambil data role')
    } finally {
      setLoadingData(false)
    }
  }

  /**
   * Load data saat komponen dimount atau roleId berubah
   */
  useEffect(() => {
    fetchFeatures()
    
    if (mode === 'edit' && roleId) {
      fetchRoleData(roleId)
    } else {
      // Reset form untuk create mode
      setFormData({
         name: '',
         description: '',
         grantsAll: false,
         features: []
       })
    }
  }, [mode, roleId, accessToken])

  /**
   * Handle perubahan input form
   */
  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Jika grantsAll diaktifkan, clear selected features
    if (field === 'grantsAll' && value === true) {
      // Features akan direset melalui formData
    }
  }

  /**
   * Handle toggle feature selection
   */
  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    if (checked) {
      // Add feature dengan default permissions
      setFormData(prev => ({
        ...prev,
        features: [
          ...prev.features,
          {
            featureId,
            canCreate: false,
            canRead: false,
            canUpdate: false,
            canDelete: false
          }
        ]
      }))
    } else {
      // Remove feature
      setFormData(prev => ({
        ...prev,
        features: prev.features.filter(f => f.featureId !== featureId)
      }))
    }
  }

  /**
   * Handle perubahan CRUD permissions
   */
  const handlePermissionChange = (featureId: string, permission: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map(feature => {
        if (feature.featureId === featureId) {
          return {
            ...feature,
            [permission]: checked
          }
        }
        return feature
      })
    }))
  }

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Role name is required")
      return
    }

    if (!formData.grantsAll && formData.features.length === 0) {
      toast.error("Please select at least one feature or enable 'Grants All'")
      return
    }

    if (!accessToken) {
      toast.error('Authentication required')
      return
    }

    setLoading(true)

    try {
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        grants_all: formData.grantsAll,
        features: formData.grantsAll ? [] : formData.features
      }

      const url = mode === 'create' 
        ? '/api/rbac/roles'
        : `/api/rbac/roles/${roleId}`
      
      const method = mode === 'create' ? 'POST' : 'PUT'

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.message || `Failed to ${mode} role`)
      }

      const action = mode === 'create' ? 'created' : 'updated'
      toast.success(`Role ${formData.name} ${action} successfully`)
      onSuccess()
    } catch (error) {
      console.error(`Error ${mode} role:`, error)
      toast.error(error instanceof Error ? error.message : `Failed to ${mode} role`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Check if feature is selected
   */
  const isFeatureSelected = (featureId: string) => {
    return formData.features.some(f => f.featureId === featureId)
  }

  /**
   * Get feature permissions
   */
  const getFeaturePermissions = (featureId: string) => {
    return formData.features.find(f => f.featureId === featureId)
  }

  if (loadingData && mode === 'edit') {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading role data...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'create' ? 'Create New Role' : `Edit Role: ${formData.name}`}
          </CardTitle>
          <CardDescription>
            {mode === 'create' 
              ? 'Define a new role with specific permissions and features'
              : 'Modify role information and permissions'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter role name"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="grantsAll">Access Type</Label>
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  id="grantsAll"
                  checked={formData.grantsAll}
                  onCheckedChange={(checked) => handleInputChange('grantsAll', checked)}
                />
                <Label htmlFor="grantsAll">
                  {formData.grantsAll ? 'Grants All Features' : 'Limited Access'}
                </Label>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the role and its purpose"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Feature Selection */}
      {!formData.grantsAll && (
        <Card>
          <CardHeader>
            <CardTitle>Feature Permissions</CardTitle>
            <CardDescription>
              Select features and configure CRUD permissions for this role
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Create</TableHead>
                    <TableHead>Read</TableHead>
                    <TableHead>Update</TableHead>
                    <TableHead>Delete</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableFeatures.map((feature) => {
                    const isSelected = isFeatureSelected(feature.id.toString())
                    const permissions = getFeaturePermissions(feature.id.toString())
                    
                    return (
                        <TableRow key={feature.id}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={(checked) => 
                                handleFeatureToggle(feature.id.toString(), checked as boolean)
                              }
                            />
                          </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{feature.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {feature.description}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {feature.category}
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={permissions?.canCreate || false}
                            disabled={!isSelected}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(feature.id.toString(), 'canCreate', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={permissions?.canRead || false}
                            disabled={!isSelected}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(feature.id.toString(), 'canRead', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={permissions?.canUpdate || false}
                            disabled={!isSelected}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(feature.id.toString(), 'canUpdate', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={permissions?.canDelete || false}
                            disabled={!isSelected}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(feature.id.toString(), 'canDelete', checked as boolean)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          <IconArrowLeft className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          <IconDeviceFloppy className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : (mode === 'create' ? 'Create Role' : 'Update Role')}
        </Button>
      </div>
    </form>
  )
}