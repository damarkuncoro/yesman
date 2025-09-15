"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button } from "@/components/shadcn/ui/button";
import { Badge } from "@/components/shadcn/ui/badge";
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
import { IconEdit, IconArrowLeft, IconShield, IconCheck, IconX } from "@tabler/icons-react";

interface Role {
  id: number;
  name: string;
  permissions: {
    canCreate: boolean;
    canRead: boolean;
    canUpdate: boolean;
    canDelete: boolean;
  };
}

interface Policy {
  id: number;
  attribute: string;
  operator: string;
  value: string;
  description?: string;
  createdAt: string;
}

interface FeatureDetail {
  id: number;
  name: string;
  description: string;
  category?: string;
  createdAt: string;
  roles: Role[];
  policies: Policy[];
}

interface FeatureDetailTabProps {
  featureId: number | null;
  onEdit: () => void;
  onBack: () => void;
}

/**
 * Komponen untuk menampilkan detail feature
 * Menampilkan role yang memiliki akses dan policy yang berlaku
 */
export function FeatureDetailTab({
  featureId,
  onEdit,
  onBack,
}: FeatureDetailTabProps) {
  const [featureDetail, setFeatureDetail] = useState<FeatureDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Fetch detail feature dari API dengan error handling yang lebih baik
   * @param id - ID feature yang akan diambil (number)
   * @returns Promise<FeatureDetail | null> - Detail feature atau null jika tidak ditemukan
   */
  const fetchFeatureDetail = useCallback(async (id: number): Promise<FeatureDetail | null> => {
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

      // Mapping data dari backend (snake_case) ke frontend (camelCase)
      const data = result.data;
      
      // Debug log untuk melihat struktur data
      console.log('Feature detail API response:', data);
      
      // Coba berbagai kemungkinan struktur data untuk roles
      let rolesData = [];
      if (Array.isArray(data.roles)) {
        rolesData = data.roles;
      } else if (Array.isArray(data.features)) {
        rolesData = data.features;
      } else if (Array.isArray(data.role_features)) {
        rolesData = data.role_features;
      } else if (Array.isArray(data.roleFeatures)) {
        rolesData = data.roleFeatures;
      }
      
      return {
        id: data.id,
        name: data.name,
        description: data.description,
        category: data.category,
        createdAt: data.created_at || data.createdAt,
        roles: rolesData.map((roleItem: any) => {
          // Handle berbagai format role data
          console.log('Role item xxx:', roleItem);
          
          // Cek apakah ada nested role object
          const roleData = roleItem.role || roleItem;
          
          const roleId = roleData.role_id || roleData.roleId || roleData.id || roleItem.id;
          const roleName = roleData.role_name || roleData.roleName || roleData.name || 
                          roleItem.role_name || roleItem.roleName || roleItem.name || 
                          `Unknown Role`;
          
          return {
            id: roleId,
            name: roleName,
            permissions: {
              canCreate: roleItem.can_create ?? roleItem.canCreate ?? roleItem.permissions?.canCreate ?? roleData.grantsAll ?? false,
              canRead: roleItem.can_read ?? roleItem.canRead ?? roleItem.permissions?.canRead ?? roleData.grantsAll ?? false,
              canUpdate: roleItem.can_update ?? roleItem.canUpdate ?? roleItem.permissions?.canUpdate ?? roleData.grantsAll ?? false,
              canDelete: roleItem.can_delete ?? roleItem.canDelete ?? roleItem.permissions?.canDelete ?? roleData.grantsAll ?? false,
            }
          };
        }),
        policies: Array.isArray(data.policies) ? data.policies.map((policy: any) => ({
          id: policy.id,
          attribute: policy.attribute,
          operator: policy.operator,
          value: policy.value,
          description: policy.description,
          createdAt: policy.created_at || policy.createdAt,
        })) : []
      };
    } catch (error) {
      console.error('Error fetching feature detail:', error);
      
      // Re-throw dengan pesan yang lebih informatif
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  }, []);

  /**
   * Load feature detail saat featureId berubah dengan retry mechanism dan cleanup
   */
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadFeatureDetail = async () => {
      if (!featureId) {
        if (isMounted) {
          setFeatureDetail(null);
          setIsLoading(false);
        }
        return;
      }

      if (!isMounted) return;
      
      setIsLoading(true);
      try {
        const detail = await fetchFeatureDetail(featureId);
        if (isMounted) {
          setFeatureDetail(detail);
        }
      } catch (error) {
        console.error("Error loading feature detail:", error);
        
        if (isMounted) {
          // Retry logic untuk network errors
          if (retryCount < maxRetries && error instanceof Error && 
              (error.message.includes('Network error') || error.message.includes('fetch'))) {
            retryCount++;
            console.log(`Retrying feature detail fetch... Attempt ${retryCount}/${maxRetries}`);
            setTimeout(() => loadFeatureDetail(), 1000 * retryCount);
            return;
          }
          
          setFeatureDetail(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFeatureDetail();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [featureId, fetchFeatureDetail]);

  /**
   * Render CRUD permission badges dengan memoization untuk performance
   */
  const renderCRUDPermissions = useCallback((permissions: Role['permissions']) => {
    const permissionList = [
      { key: "canCreate" as keyof Role['permissions'], label: "C", title: "Create", color: "bg-green-500" },
      { key: "canRead" as keyof Role['permissions'], label: "R", title: "Read", color: "bg-blue-500" },
      { key: "canUpdate" as keyof Role['permissions'], label: "U", title: "Update", color: "bg-yellow-500" },
      { key: "canDelete" as keyof Role['permissions'], label: "D", title: "Delete", color: "bg-red-500" },
    ];

    return (
      <div className="flex gap-1">
        {permissionList.map(({ key, label, title, color }) => (
          <Badge
            key={key}
            variant={permissions[key] ? "default" : "secondary"}
            className={`w-6 h-6 p-0 flex items-center justify-center text-xs ${
              permissions[key] ? color + ' text-white' : 'bg-gray-200 text-gray-500'
            }`}
            title={`${title}: ${permissions[key] ? "Allowed" : "Denied"}`}
          >
            {permissions[key] ? (
              <IconCheck className="h-3 w-3" />
            ) : (
              <IconX className="h-3 w-3" />
            )}
          </Badge>
        ))}
      </div>
    );
  }, []);



  // Memoized loading component
  const LoadingComponent = useMemo(() => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-gray-600">Loading feature detail...</span>
        </div>
      </CardContent>
    </Card>
  ), []);
  
  // Memoized not found component
  const NotFoundComponent = useMemo(() => (
    <Card>
      <CardContent className="p-6">
        <div className="text-center space-y-4">
          <div className="text-gray-500">
            {featureId ? 'Feature not found or failed to load.' : 'No feature selected.'}
          </div>
          <Button onClick={onBack} variant="outline">
            <IconArrowLeft className="w-4 h-4 mr-2" />
            Back to List
          </Button>
        </div>
      </CardContent>
    </Card>
  ), [featureId, onBack]);
  
  if (isLoading) {
    return LoadingComponent;
  }

  if (!featureDetail) {
    return NotFoundComponent;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <IconShield className="h-5 w-5" />
                {featureDetail.name}
              </CardTitle>
              <CardDescription>{featureDetail.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="default">
                Active
              </Badge>
              <Button onClick={onEdit}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit Feature
              </Button>
              <Button onClick={onBack} variant="outline">
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-sm">
            <span className="font-medium">Created:</span> {new Date(featureDetail.createdAt).toLocaleDateString('id-ID')}
          </div>
        </CardContent>
      </Card>

      {/* Roles with Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Roles with Access</span>
            <Badge variant="secondary" className="ml-2">
              {featureDetail.roles.length} {featureDetail.roles.length === 1 ? 'role' : 'roles'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Role yang memiliki akses ke feature ini dan permission yang dimiliki
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Assigned At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureDetail.roles.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      <div className="space-y-2">
                        <div className="text-gray-500">No roles assigned to this feature</div>
                        <div className="text-sm text-gray-400">
                          Assign roles to this feature to grant access permissions
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  featureDetail.roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell className="text-gray-600">
                        {role.id ? `Role ID: ${role.id}` : 'Role dengan akses ke feature ini'}
                      </TableCell>
                      <TableCell>{renderCRUDPermissions(role.permissions)}</TableCell>
                      <TableCell className="text-gray-500">
                        {new Date(featureDetail.createdAt).toLocaleDateString('id-ID')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Access Policies</CardTitle>
          <CardDescription>
            Policy yang berlaku untuk feature ini
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Policy Rule</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureDetail.policies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8">
                      No policies defined for this feature
                    </TableCell>
                  </TableRow>
                ) : (
                  featureDetail.policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell className="font-medium">
                        {policy.attribute} {policy.operator} {policy.value}
                      </TableCell>
                      <TableCell>
                        {policy.description || "Policy ABAC untuk kontrol akses"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="default">ABAC</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">
                          {new Date(policy.createdAt).toLocaleDateString('id-ID')}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}