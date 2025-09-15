"use client";

import { useState, useEffect } from "react";
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
   * Fetch detail feature dari API
   * @param id - ID feature yang akan diambil (number)
   * @returns Promise<FeatureDetail | null> - Detail feature atau null jika tidak ditemukan
   */
  const fetchFeatureDetail = async (id: number): Promise<FeatureDetail | null> => {
    try {
      const response = await fetch(`/api/rbac/features/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Feature dengan ID ${id} tidak ditemukan`);
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Gagal mengambil detail feature');
      }

      return result.data;
    } catch (error) {
      console.error('Error fetching feature detail:', error);
      throw error;
    }
  };

  /**
   * Load feature detail saat featureId berubah
   */
  useEffect(() => {
    const loadFeatureDetail = async () => {
      if (!featureId) {
        setFeatureDetail(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const detail = await fetchFeatureDetail(featureId);
        setFeatureDetail(detail);
      } catch (error) {
        console.error("Error loading feature detail:", error);
        setFeatureDetail(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeatureDetail();
  }, [featureId]);

  /**
   * Render CRUD permission badges
   */
  const renderCRUDPermissions = (permissions: Role['permissions']) => {
    const permissionList = [
      { key: "canCreate" as keyof Role['permissions'], label: "C", title: "Create" },
      { key: "canRead" as keyof Role['permissions'], label: "R", title: "Read" },
      { key: "canUpdate" as keyof Role['permissions'], label: "U", title: "Update" },
      { key: "canDelete" as keyof Role['permissions'], label: "D", title: "Delete" },
    ];

    return (
      <div className="flex gap-1">
        {permissionList.map(({ key, label, title }) => (
          <Badge
            key={key}
            variant={permissions[key] ? "default" : "secondary"}
            className="w-6 h-6 p-0 flex items-center justify-center text-xs"
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
  };



  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading feature detail...</div>
        </CardContent>
      </Card>
    );
  }

  if (!featureDetail) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">Feature not found</p>
            <Button onClick={onBack} variant="outline">
              <IconArrowLeft className="mr-2 h-4 w-4" />
              Back to List
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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
          <CardTitle>Roles with Access</CardTitle>
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
                      No roles assigned to this feature
                    </TableCell>
                  </TableRow>
                ) : (
                  featureDetail.roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>Role dengan akses ke feature ini</TableCell>
                      <TableCell>{renderCRUDPermissions(role.permissions)}</TableCell>
                      <TableCell>{new Date(featureDetail.createdAt).toLocaleDateString('id-ID')}</TableCell>
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