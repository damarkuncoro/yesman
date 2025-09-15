"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/shadcn/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/ui/card";
import { Badge } from "@/components/shadcn/ui/badge";
import { Separator } from "@/components/shadcn/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/ui/table";
import {
  IconRoute,
  IconEdit,
  IconArrowLeft,
  IconUsers,
  IconShield,
  IconClock,
  IconCheck,
  IconX,
} from "@tabler/icons-react";

interface RouteDetail {
  id: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  featureName: string;
  featureId: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  policies: Policy[];
  roles: RoleAccess[];
}

interface Policy {
  id: string;
  name: string;
  description: string;
  type: "allow" | "deny";
  conditions: string[];
}

interface RoleAccess {
  roleId: string;
  roleName: string;
  hasAccess: boolean;
  permissions: string[];
  userCount: number;
  lastAccessed?: string;
}

interface RouteDetailTabProps {
  routeId: string | null;
  onBack: () => void;
  onEdit: (routeId: string) => void;
}

/**
 * Komponen untuk menampilkan detail route dan role yang memiliki akses
 * Menampilkan informasi lengkap tentang route, policies, dan role access
 */
export function RouteDetailTab({
  routeId,
  onBack,
  onEdit,
}: RouteDetailTabProps) {
  const [route, setRoute] = useState<RouteDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Load detail route berdasarkan routeId
   */
  useEffect(() => {
    const loadRouteDetail = async () => {
      if (!routeId) return;
      
      setIsLoading(true);
      try {
        // Ambil detail route dari API
        const token = localStorage.getItem('accessToken');
        const response = await fetch(`/api/rbac/route-features/${routeId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
        });
        const data = await response.json();
        
        if (data.success && data.data) {
          const routeData = data.data;
          
          // Transform data dari API ke format yang dibutuhkan UI
          const transformedRoute: RouteDetail = {
            id: routeData.id.toString(),
            path: routeData.path,
            method: routeData.method,
            featureName: routeData.feature?.name || 'Unknown Feature',
            featureId: routeData.featureId?.toString() || '',
            description: `Route ${routeData.method || 'ALL'} ${routeData.path}`,
            isActive: routeData.isActive ?? true,
            createdAt: routeData.createdAt || new Date().toISOString(),
            updatedAt: routeData.updatedAt || new Date().toISOString(),
            createdBy: 'System', // TODO: Ambil dari data user yang membuat
            policies: [], // TODO: Implementasi policies jika diperlukan
            roles: [], // TODO: Implementasi role access jika diperlukan
          };
          
          setRoute(transformedRoute);
        } else {
          console.error('Failed to load route detail:', data.message);
        }
      } catch (error) {
        console.error("Error loading route detail:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRouteDetail();
  }, [routeId]);

  /**
   * Get badge color berdasarkan HTTP method
   */
  const getMethodBadgeColor = (method: string) => {
    switch (method) {
      case "GET":
        return "bg-green-100 text-green-800 hover:bg-green-200";
      case "POST":
        return "bg-blue-100 text-blue-800 hover:bg-blue-200";
      case "PUT":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
      case "DELETE":
        return "bg-red-100 text-red-800 hover:bg-red-200";
      case "PATCH":
        return "bg-purple-100 text-purple-800 hover:bg-purple-200";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-200";
    }
  };

  /**
   * Format tanggal untuk display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (!routeId) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <IconRoute className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Select a route from the list to view details
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <IconRoute className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading route details...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!route) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <IconX className="mx-auto h-12 w-12 text-red-500 mb-4" />
            <p className="text-muted-foreground">Route not found</p>
            <Button variant="outline" onClick={onBack} className="mt-4">
              <IconArrowLeft className="h-4 w-4 mr-2" />
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
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <IconArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Route Detail</h2>
            <p className="text-muted-foreground">
              Detailed information about route and access control
            </p>
          </div>
        </div>
        <Button onClick={() => onEdit(route.id)} className="flex items-center gap-2">
          <IconEdit className="h-4 w-4" />
          Edit Route
        </Button>
      </div>

      {/* Route Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconRoute className="h-5 w-5" />
            Route Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Method & Path
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <Badge
                    variant="secondary"
                    className={getMethodBadgeColor(route.method)}
                  >
                    {route.method}
                  </Badge>
                  <code className="bg-muted px-2 py-1 rounded text-sm">
                    {route.path}
                  </code>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Feature
                </label>
                <div className="mt-1">
                  <p className="font-medium">{route.featureName}</p>
                  <p className="text-sm text-muted-foreground">
                    {route.featureId}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Description
                </label>
                <p className="mt-1">{route.description}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Status
                </label>
                <div className="mt-1">
                  <Badge variant={route.isActive ? "default" : "secondary"}>
                    {route.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Created
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm">{formatDate(route.createdAt)}</p>
                    <p className="text-xs text-muted-foreground">
                      by {route.createdBy}
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Last Updated
                </label>
                <div className="mt-1 flex items-center gap-2">
                  <IconClock className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm">{formatDate(route.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconShield className="h-5 w-5" />
            Policies ({route.policies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {route.policies.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No policies configured for this route
            </p>
          ) : (
            <div className="space-y-4">
              {route.policies.map((policy) => (
                <div
                  key={policy.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{policy.name}</h4>
                    <Badge
                      variant={policy.type === "allow" ? "default" : "destructive"}
                    >
                      {policy.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {policy.description}
                  </p>
                  {policy.conditions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {policy.conditions.map((condition, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {condition}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Role Access */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconUsers className="h-5 w-5" />
            Role Access ({route.roles.filter(r => r.hasAccess).length}/{route.roles.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Role</TableHead>
                  <TableHead>Access</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Last Accessed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {route.roles.map((role) => (
                  <TableRow key={role.roleId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{role.roleName}</p>
                        <p className="text-sm text-muted-foreground">
                          {role.roleId}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {role.hasAccess ? (
                          <IconCheck className="h-4 w-4 text-green-600" />
                        ) : (
                          <IconX className="h-4 w-4 text-red-600" />
                        )}
                        <Badge
                          variant={role.hasAccess ? "default" : "secondary"}
                        >
                          {role.hasAccess ? "Allowed" : "Denied"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      {role.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {role.permissions.map((permission, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {permission}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">None</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {role.userCount} user{role.userCount !== 1 ? "s" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {role.lastAccessed ? (
                        <p className="text-sm text-muted-foreground">
                          {formatDate(role.lastAccessed)}
                        </p>
                      ) : (
                        <span className="text-muted-foreground text-sm">Never</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}