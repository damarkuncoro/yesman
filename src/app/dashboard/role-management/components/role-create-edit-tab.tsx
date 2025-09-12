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

// Mock data untuk available features
const mockFeatures = [
  {
    id: "1",
    name: "User Management",
    description: "Manage users and their permissions",
    category: "Administration"
  },
  {
    id: "2",
    name: "Role Management",
    description: "Manage roles and permissions",
    category: "Administration"
  },
  {
    id: "3",
    name: "System Settings",
    description: "Configure system-wide settings",
    category: "Administration"
  },
  {
    id: "4",
    name: "Content Management",
    description: "Create and edit content",
    category: "Content"
  },
  {
    id: "5",
    name: "Media Library",
    description: "Manage media files",
    category: "Content"
  },
  {
    id: "6",
    name: "Reports",
    description: "View and generate reports",
    category: "Analytics"
  },
  {
    id: "7",
    name: "Dashboard",
    description: "View dashboard and analytics",
    category: "Analytics"
  },
  {
    id: "8",
    name: "Audit Logs",
    description: "View system audit logs",
    category: "Security"
  }
]

// Mock data untuk existing role (untuk edit mode)
const mockExistingRole = {
  "1": {
    id: "1",
    name: "Admin",
    description: "Full system administrator access",
    grantsAll: true,
    features: []
  },
  "2": {
    id: "2",
    name: "Editor",
    description: "Content management and editing permissions",
    grantsAll: false,
    features: [
      {
        featureId: "4",
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false
      },
      {
        featureId: "5",
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: true
      },
      {
        featureId: "6",
        canCreate: false,
        canRead: true,
        canUpdate: false,
        canDelete: false
      }
    ]
  }
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

/**
 * Komponen tab untuk membuat atau mengedit role
 * Mengelola role baru, set grantsAll, pilih fitur yang diizinkan, dan set CRUD flags
 */
export function RoleCreateEditTab({ roleId, mode, onSuccess }: RoleCreateEditTabProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    grantsAll: false
  })
  const [selectedFeatures, setSelectedFeatures] = useState<FeaturePermission[]>([])

  /**
   * Load existing role data untuk edit mode
   */
  useEffect(() => {
    if (mode === 'edit' && roleId) {
      setLoading(true)
      // Simulasi API call
      setTimeout(() => {
        const existingRole = mockExistingRole[roleId as keyof typeof mockExistingRole]
        if (existingRole) {
          setFormData({
            name: existingRole.name,
            description: existingRole.description,
            grantsAll: existingRole.grantsAll
          })
          setSelectedFeatures(existingRole.features)
        }
        setLoading(false)
      }, 500)
    } else {
      // Reset form untuk create mode
      setFormData({
        name: "",
        description: "",
        grantsAll: false
      })
      setSelectedFeatures([])
    }
  }, [mode, roleId])

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
      setSelectedFeatures([])
    }
  }

  /**
   * Handle toggle feature selection
   */
  const handleFeatureToggle = (featureId: string, checked: boolean) => {
    if (checked) {
      // Add feature dengan default permissions
      setSelectedFeatures(prev => [
        ...prev,
        {
          featureId,
          canCreate: false,
          canRead: true,
          canUpdate: false,
          canDelete: false
        }
      ])
    } else {
      // Remove feature
      setSelectedFeatures(prev => prev.filter(f => f.featureId !== featureId))
    }
  }

  /**
   * Handle perubahan CRUD permissions
   */
  const handlePermissionChange = (featureId: string, permission: string, checked: boolean) => {
    setSelectedFeatures(prev => prev.map(feature => {
      if (feature.featureId === featureId) {
        return {
          ...feature,
          [permission]: checked
        }
      }
      return feature
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

    if (!formData.grantsAll && selectedFeatures.length === 0) {
      toast.error("Please select at least one feature or enable 'Grants All'")
      return
    }

    setLoading(true)

    try {
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const action = mode === 'create' ? 'created' : 'updated'
      toast.success(`Role ${formData.name} ${action} successfully`)
      onSuccess()
    } catch (error) {
      toast.error(`Failed to ${mode} role`)
    } finally {
      setLoading(false)
    }
  }

  /**
   * Check if feature is selected
   */
  const isFeatureSelected = (featureId: string) => {
    return selectedFeatures.some(f => f.featureId === featureId)
  }

  /**
   * Get feature permissions
   */
  const getFeaturePermissions = (featureId: string) => {
    return selectedFeatures.find(f => f.featureId === featureId)
  }

  if (loading && mode === 'edit') {
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
                  {mockFeatures.map((feature) => {
                    const isSelected = isFeatureSelected(feature.id)
                    const permissions = getFeaturePermissions(feature.id)
                    
                    return (
                      <TableRow key={feature.id}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => 
                              handleFeatureToggle(feature.id, checked as boolean)
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
                              handlePermissionChange(feature.id, 'canCreate', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={permissions?.canRead || false}
                            disabled={!isSelected}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(feature.id, 'canRead', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={permissions?.canUpdate || false}
                            disabled={!isSelected}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(feature.id, 'canUpdate', checked as boolean)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Checkbox
                            checked={permissions?.canDelete || false}
                            disabled={!isSelected}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(feature.id, 'canDelete', checked as boolean)
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