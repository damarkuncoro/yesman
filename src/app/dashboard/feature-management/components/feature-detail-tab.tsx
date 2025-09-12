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
  id: string;
  name: string;
  description: string;
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  assignedAt: string;
}

interface Policy {
  id: string;
  name: string;
  description: string;
  type: "allow" | "deny";
  conditions: string[];
}

interface FeatureDetail {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
  policies: Policy[];
}

interface FeatureDetailTabProps {
  featureId: string | null;
  onEdit: (featureId: string) => void;
  onBackToList: () => void;
}

/**
 * Komponen untuk menampilkan detail feature
 * Menampilkan role yang memiliki akses dan policy yang berlaku
 */
export function FeatureDetailTab({
  featureId,
  onEdit,
  onBackToList,
}: FeatureDetailTabProps) {
  const [featureDetail, setFeatureDetail] = useState<FeatureDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data untuk feature detail
  const mockFeatureDetails: Record<string, FeatureDetail> = {
    "1": {
      id: "1",
      name: "user_management",
      description: "Mengelola pengguna sistem",
      isActive: true,
      createdAt: "2024-01-15",
      updatedAt: "2024-01-20",
      roles: [
        {
          id: "1",
          name: "Admin",
          description: "Full system administrator access",
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          assignedAt: "2024-01-15",
        },
        {
          id: "2",
          name: "Manager",
          description: "Department management access",
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: false,
          assignedAt: "2024-01-16",
        },
        {
          id: "3",
          name: "Editor",
          description: "Content editing access",
          canCreate: false,
          canRead: true,
          canUpdate: true,
          canDelete: false,
          assignedAt: "2024-01-17",
        },
      ],
      policies: [
        {
          id: "1",
          name: "Admin Full Access",
          description: "Administrators have full access to user management",
          type: "allow",
          conditions: ["role:admin", "feature:user_management"],
        },
        {
          id: "2",
          name: "Department Restriction",
          description: "Managers can only manage users in their department",
          type: "allow",
          conditions: ["role:manager", "department:same"],
        },
        {
          id: "3",
          name: "Guest Restriction",
          description: "Guest users cannot access user management",
          type: "deny",
          conditions: ["role:guest", "feature:user_management"],
        },
      ],
    },
    "2": {
      id: "2",
      name: "article_management",
      description: "Mengelola artikel dan konten",
      isActive: true,
      createdAt: "2024-01-16",
      updatedAt: "2024-01-18",
      roles: [
        {
          id: "1",
          name: "Admin",
          description: "Full system administrator access",
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: true,
          assignedAt: "2024-01-16",
        },
        {
          id: "2",
          name: "Editor",
          description: "Content editing access",
          canCreate: true,
          canRead: true,
          canUpdate: true,
          canDelete: false,
          assignedAt: "2024-01-16",
        },
      ],
      policies: [
        {
          id: "1",
          name: "Editor Content Access",
          description: "Editors can manage articles but not delete",
          type: "allow",
          conditions: ["role:editor", "action:create,read,update"],
        },
        {
          id: "2",
          name: "Published Article Protection",
          description: "Published articles require admin approval to modify",
          type: "deny",
          conditions: ["status:published", "role:!admin"],
        },
      ],
    },
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
        // Simulasi API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        const detail = mockFeatureDetails[featureId];
        setFeatureDetail(detail || null);
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
  const renderCRUDPermissions = (role: Role) => {
    const permissions = [
      { key: "canCreate" as keyof Role, label: "C", title: "Create" },
      { key: "canRead" as keyof Role, label: "R", title: "Read" },
      { key: "canUpdate" as keyof Role, label: "U", title: "Update" },
      { key: "canDelete" as keyof Role, label: "D", title: "Delete" },
    ];

    return (
      <div className="flex gap-1">
        {permissions.map(({ key, label, title }) => (
          <Badge
            key={key}
            variant={role[key] ? "default" : "secondary"}
            className="w-6 h-6 p-0 flex items-center justify-center text-xs"
            title={`${title}: ${role[key] ? "Allowed" : "Denied"}`}
          >
            {role[key] ? (
              <IconCheck className="h-3 w-3" />
            ) : (
              <IconX className="h-3 w-3" />
            )}
          </Badge>
        ))}
      </div>
    );
  };

  /**
   * Render policy type badge
   */
  const renderPolicyType = (type: "allow" | "deny") => {
    return (
      <Badge variant={type === "allow" ? "default" : "destructive"}>
        {type === "allow" ? "Allow" : "Deny"}
      </Badge>
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
            <Button onClick={onBackToList} variant="outline">
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
              <Badge variant={featureDetail.isActive ? "default" : "secondary"}>
                {featureDetail.isActive ? "Active" : "Inactive"}
              </Badge>
              <Button onClick={() => onEdit(featureDetail.id)}>
                <IconEdit className="mr-2 h-4 w-4" />
                Edit Feature
              </Button>
              <Button onClick={onBackToList} variant="outline">
                <IconArrowLeft className="mr-2 h-4 w-4" />
                Back to List
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Created:</span> {featureDetail.createdAt}
            </div>
            <div>
              <span className="font-medium">Updated:</span> {featureDetail.updatedAt}
            </div>
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
                      <TableCell>{role.description}</TableCell>
                      <TableCell>{renderCRUDPermissions(role)}</TableCell>
                      <TableCell>{role.assignedAt}</TableCell>
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
                  <TableHead>Policy Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Conditions</TableHead>
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
                      <TableCell className="font-medium">{policy.name}</TableCell>
                      <TableCell>{policy.description}</TableCell>
                      <TableCell>{renderPolicyType(policy.type)}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {policy.conditions.map((condition, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {condition}
                            </Badge>
                          ))}
                        </div>
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