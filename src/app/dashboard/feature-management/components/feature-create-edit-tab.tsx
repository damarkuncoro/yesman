"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Label } from "@/components/shadcn/ui/label";
import { Textarea } from "@/components/shadcn/ui/textarea";
import { Switch } from "@/components/shadcn/ui/switch";
import { Badge } from "@/components/shadcn/ui/badge";
import { Checkbox } from "@/components/shadcn/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/ui/table";
import { Separator } from "@/components/shadcn/ui/separator";
import { IconDeviceFloppy, IconX, IconShield, IconCheck } from "@tabler/icons-react";
import { toast } from "sonner";

interface Role {
  id: string;
  name: string;
  description: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

interface FeatureFormData {
  name: string;
  description: string;
  isActive: boolean;
  roles: Role[];
}

interface FeatureCreateEditTabProps {
  featureId: number | null;
  isEditMode: boolean;
  onSuccess: () => void;
  onCancel: () => void;
}

/**
 * Komponen untuk membuat atau mengedit feature
 * Mengelola form data, validasi, dan relasi dengan role
 */
export function FeatureCreateEditTab({
  featureId,
  isEditMode,
  onSuccess,
  onCancel,
}: FeatureCreateEditTabProps) {
  const [formData, setFormData] = useState<FeatureFormData>({
    name: "",
    description: "",
    isActive: true,
    roles: [],
  });
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  /**
   * Mengambil data roles dari API dengan error handling yang lebih baik
   * @returns Promise<Role[]> - Array roles atau array kosong jika gagal
   */
  const fetchRoles = async (): Promise<Role[]> => {
    try {
      // Ambil token dari localStorage
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/rbac/roles', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch roles'}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API returned unsuccessful response');
      }
      
      // Perbaiki akses data roles sesuai format response API
      const roles = result.data?.roles || result.data || [];
      return Array.isArray(roles) ? roles.map((role: any) => ({
        id: role.id.toString(),
        name: role.name,
        description: role.description || `Role ${role.name}`,
        canCreate: true,
        canRead: true,
        canUpdate: true,
        canDelete: false,
      })) : [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      
      // Re-throw dengan pesan yang lebih informatif
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  };

  /**
   * Mengambil detail feature dari API untuk mode edit dengan error handling yang lebih baik
   * @param id - ID feature yang akan diambil
   * @returns Promise<any> - Detail feature atau null jika tidak ditemukan
   */
  const fetchFeatureDetail = async (id: number): Promise<any> => {
    try {
      // Ambil token dari localStorage
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/rbac/features/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Feature dengan ID ${id} tidak ditemukan`);
          return null;
        }
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch feature detail'}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API returned unsuccessful response');
      }
      
      return result.data;
    } catch (error) {
      console.error('Error fetching feature detail:', error);
      
      // Re-throw dengan pesan yang lebih informatif
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  };



  // Load roles data saat komponen dimount dengan retry mechanism
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadRoles = async () => {
      if (!isMounted) return;
      
      setIsLoadingRoles(true);
      try {
        const roles = await fetchRoles();
        if (isMounted) {
          setAvailableRoles(roles);
        }
      } catch (error) {
        console.error('Failed to load roles:', error);
        
        if (isMounted) {
          // Retry logic untuk network errors
          if (retryCount < maxRetries && error instanceof Error && 
              (error.message.includes('Network error') || error.message.includes('fetch'))) {
            retryCount++;
            console.log(`Retrying roles fetch... Attempt ${retryCount}/${maxRetries}`);
            setTimeout(() => loadRoles(), 1000 * retryCount);
            return;
          }
          
          const errorMessage = error instanceof Error ? error.message : 'Failed to load roles';
          toast.error(errorMessage);
          setAvailableRoles([]);
        }
      } finally {
        if (isMounted) {
          setIsLoadingRoles(false);
        }
      }
    };

    loadRoles();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Load data saat komponen dimount atau featureId berubah dengan cleanup
   */
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      try {
        // Load existing feature data jika edit mode
        if (isEditMode && featureId) {
          try {
            const existingData = await fetchFeatureDetail(featureId);
            if (isMounted && existingData) {
              // Mapping dari backend response (snake_case) ke frontend state (camelCase)
              setFormData({
                name: existingData.name || '',
                description: existingData.description || '',
                isActive: existingData.is_active ?? true, // Handle snake_case dari backend
                // Perbaiki akses data roles sesuai format response API
                roles: Array.isArray(existingData.roles) ? existingData.roles.map((roleData: any) => ({
                   id: roleData.role_id?.toString() || roleData.roleId?.toString() || roleData.id?.toString() || '',
                   name: roleData.role_name || roleData.roleName || roleData.name || `Role ${roleData.role_id || roleData.roleId || roleData.id}`,
                   description: roleData.role_description || roleData.roleDescription || roleData.description || '',
                   canCreate: roleData.can_create ?? roleData.canCreate ?? true,
                   canRead: roleData.can_read ?? roleData.canRead ?? true,
                   canUpdate: roleData.can_update ?? roleData.canUpdate ?? true,
                   canDelete: roleData.can_delete ?? roleData.canDelete ?? false,
                })) : []
              });
            } else if (isMounted && !existingData) {
              toast.error('Feature not found');
            }
          } catch (error) {
            console.error('Failed to load feature detail:', error);
            if (isMounted) {
              const errorMessage = error instanceof Error ? error.message : 'Failed to load feature detail';
              toast.error(errorMessage);
            }
          }
        } else {
          // Reset form untuk create mode
          if (isMounted) {
            setFormData({
              name: "",
              description: "",
              isActive: true,
              roles: [],
            });
          }
        }
      } catch (error) {
        console.error("Error loading data:", error);
        if (isMounted) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
          toast.error(errorMessage);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [featureId, isEditMode]);

  /**
   * Handle input change dengan memoization
   */
  const handleInputChange = useCallback((field: keyof FeatureFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  /**
   * Handle role selection dengan memoization
   */
  const handleRoleToggle = useCallback((role: Role, isSelected: boolean) => {
    if (isSelected) {
      // Add role dengan default permissions
      setFormData((prev) => ({
        ...prev,
        roles: [...prev.roles, { ...role }],
      }));
    } else {
      // Remove role
      setFormData((prev) => ({
        ...prev,
        roles: prev.roles.filter((r) => r.id !== role.id),
      }));
    }
  }, []);

  /**
   * Handle permission change untuk specific role dengan memoization
   */
  const handlePermissionChange = useCallback((
    roleId: string,
    permission: keyof Pick<Role, "canCreate" | "canRead" | "canUpdate" | "canDelete">,
    value: boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      roles: prev.roles.map((role) =>
        role.id === roleId ? { ...role, [permission]: value } : role
      ),
    }));
  }, []);

  /**
   * Validate form data dengan validasi yang lebih komprehensif
   */
  const validateForm = useCallback((): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Validasi nama feature
    if (!formData.name.trim()) {
      errors.push('Feature name is required');
    } else if (formData.name.trim().length < 3) {
      errors.push('Feature name must be at least 3 characters long');
    } else if (formData.name.trim().length > 50) {
      errors.push('Feature name must not exceed 50 characters');
    }

    // Validasi deskripsi
    if (!formData.description.trim()) {
      errors.push('Feature description is required');
    } else if (formData.description.trim().length < 10) {
      errors.push('Feature description must be at least 10 characters long');
    } else if (formData.description.trim().length > 500) {
      errors.push('Feature description must not exceed 500 characters');
    }

    // Validasi roles
    if (formData.roles.length === 0) {
      errors.push('At least one role must be assigned');
    }
    
    // Validasi permissions untuk setiap role
    const rolesWithoutPermissions = formData.roles.filter(role => 
      !role.canCreate && !role.canRead && !role.canUpdate && !role.canDelete
    );
    
    if (rolesWithoutPermissions.length > 0) {
      errors.push(`Role(s) ${rolesWithoutPermissions.map(r => r.name).join(', ')} must have at least one permission`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [formData]);

  /**
   * Handle form submit dengan validasi yang lebih baik dan mapping data yang konsisten
   */
  const handleSubmit = async () => {
    const validation = validateForm();
    
    if (!validation.isValid) {
      // Tampilkan semua error
      validation.errors.forEach(error => toast.error(error));
      return;
    }

    setIsSaving(true);
    try {
      // Mapping data dengan snake_case untuk konsistensi dengan backend
      const featureData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        is_active: formData.isActive, // snake_case untuk backend
        features: formData.roles.map(role => ({
          role_id: parseInt(role.id), // Pastikan role_id adalah number
          can_create: role.canCreate,
          can_read: role.canRead,
          can_update: role.canUpdate,
          can_delete: role.canDelete,
        }))
      };
      
      console.log('Sending feature data:', featureData);
      
      let response;
      const url = isEditMode && featureId 
        ? `/api/rbac/features/${featureId}` 
        : '/api/rbac/features';
      const method = isEditMode ? 'PUT' : 'POST';
      
      // Ambil token dari localStorage untuk authorization
      const token = localStorage.getItem('accessToken');
      
      response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(featureData),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.message || errorJson.error || `HTTP ${response.status}: Failed to save feature`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${errorText || 'Failed to save feature'}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const action = isEditMode ? "updated" : "created";
        toast.success(`Feature "${formData.name}" ${action} successfully`);
        onSuccess();
      } else {
        throw new Error(result.message || 'Failed to save feature');
      }
    } catch (error) {
      console.error("Error saving feature:", error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to save feature';
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Render CRUD permission checkboxes untuk role
   */
  const renderRolePermissions = (role: Role) => {
    const permissions = [
      { key: "canCreate" as const, label: "Create" },
      { key: "canRead" as const, label: "Read" },
      { key: "canUpdate" as const, label: "Update" },
      { key: "canDelete" as const, label: "Delete" },
    ];

    return (
      <div className="flex gap-4">
        {permissions.map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              id={`${role.id}-${key}`}
              checked={role[key]}
              onCheckedChange={(checked) =>
                handlePermissionChange(role.id, key, checked as boolean)
              }
            />
            <Label htmlFor={`${role.id}-${key}`} className="text-sm">
              {label}
            </Label>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Check if role is selected
   */
  const isRoleSelected = (roleId: string): boolean => {
    return formData.roles.some((role) => role.id === roleId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconShield className="h-5 w-5" />
            {isEditMode ? "Edit Feature" : "Create New Feature"}
          </CardTitle>
          <CardDescription>
            {isEditMode
              ? "Update feature information and role assignments"
              : "Create a new feature and assign roles with permissions"}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="name">Feature Name</Label>
              <Input
                id="name"
                placeholder="e.g., user_management"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe what this feature does..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role Assignment */}
      <Card>
        <CardHeader>
          <CardTitle>Role Assignment</CardTitle>
          <CardDescription>
            Select roles that should have access to this feature and configure their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Available Roles */}
            <div>
              <Label className="text-base font-medium">Available Roles</Label>
              <div className="mt-2 space-y-2">
                {isLoadingRoles ? (
                  <div className="text-sm text-gray-500">Loading roles...</div>
                ) : (
                  availableRoles.map((role) => (
                  <div key={role.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={isRoleSelected(role.id)}
                      onCheckedChange={(checked) =>
                        handleRoleToggle(role, checked as boolean)
                      }
                    />
                    <Label htmlFor={`role-${role.id}`} className="flex-1">
                      <div>
                        <div className="font-medium">{role.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {role.description}
                        </div>
                      </div>
                    </Label>
                  </div>
                  ))
                )}
              </div>
            </div>

            {/* Selected Roles with Permissions */}
            {formData.roles.length > 0 && (
              <>
                <Separator />
                <div>
                  <Label className="text-base font-medium">Role Permissions</Label>
                  <div className="mt-2 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Role</TableHead>
                          <TableHead>Permissions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.roles.map((role) => (
                          <TableRow key={role.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{role.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {role.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{renderRolePermissions(role)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-end gap-2">
            <Button onClick={onCancel} variant="outline">
              <IconX className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSaving}>
              <IconDeviceFloppy className="mr-2 h-4 w-4" />
              {isSaving
                ? "Saving..."
                : isEditMode
                ? "Update Feature"
                : "Create Feature"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}