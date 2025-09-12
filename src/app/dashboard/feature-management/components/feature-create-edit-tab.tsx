"use client";

import { useState, useEffect } from "react";
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
  featureId: string | null;
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

  // Mock data untuk available roles
  const mockAvailableRoles: Role[] = [
    {
      id: "1",
      name: "Admin",
      description: "Full system administrator access",
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: true,
    },
    {
      id: "2",
      name: "Manager",
      description: "Department management access",
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: false,
    },
    {
      id: "3",
      name: "Editor",
      description: "Content editing access",
      canCreate: true,
      canRead: true,
      canUpdate: true,
      canDelete: false,
    },
    {
      id: "4",
      name: "Viewer",
      description: "Read-only access",
      canCreate: false,
      canRead: true,
      canUpdate: false,
      canDelete: false,
    },
    {
      id: "5",
      name: "Analyst",
      description: "Data analysis access",
      canCreate: false,
      canRead: true,
      canUpdate: false,
      canDelete: false,
    },
  ];

  // Mock data untuk existing features
  const mockExistingFeatures: Record<string, FeatureFormData> = {
    "1": {
      name: "user_management",
      description: "Mengelola pengguna sistem",
      isActive: true,
      roles: [
        {
          id: "1",
          name: "Admin",
          description: "Full system administrator access",
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
        },
        {
          id: "2",
          name: "Manager",
          description: "Department management access",
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: false,
        },
      ],
    },
    "2": {
      name: "article_management",
      description: "Mengelola artikel dan konten",
      isActive: true,
      roles: [
        {
          id: "1",
          name: "Admin",
          description: "Full system administrator access",
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
        },
        {
          id: "3",
          name: "Editor",
          description: "Content editing access",
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: false,
        },
      ],
    },
  };

  /**
   * Load data saat komponen dimount atau featureId berubah
   */
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load available roles
        await new Promise((resolve) => setTimeout(resolve, 300));
        setAvailableRoles(mockAvailableRoles);

        // Load existing feature data jika edit mode
        if (isEditMode && featureId) {
          const existingData = mockExistingFeatures[featureId];
          if (existingData) {
            setFormData(existingData);
          }
        } else {
          // Reset form untuk create mode
          setFormData({
            name: "",
            description: "",
            isActive: true,
            roles: [],
          });
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [featureId, isEditMode]);

  /**
   * Handle input change
   */
  const handleInputChange = (field: keyof FeatureFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * Handle role selection
   */
  const handleRoleToggle = (role: Role, isSelected: boolean) => {
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
  };

  /**
   * Handle permission change untuk specific role
   */
  const handlePermissionChange = (
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
  };

  /**
   * Validate form data
   */
  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Feature name is required");
      return false;
    }

    if (!formData.description.trim()) {
      toast.error("Feature description is required");
      return false;
    }

    if (formData.roles.length === 0) {
      toast.error("At least one role must be assigned");
      return false;
    }

    return true;
  };

  /**
   * Handle form submit
   */
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // Simulasi API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const action = isEditMode ? "updated" : "created";
      toast.success(`Feature ${action} successfully`);
      onSuccess();
    } catch (error) {
      console.error("Error saving feature:", error);
      toast.error("Failed to save feature");
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
                {availableRoles.map((role) => (
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
                ))}
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