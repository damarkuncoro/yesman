"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/shadcn/ui/card";
import { Badge } from "@/components/shadcn/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/ui/select";
import { IconPlus, IconSearch, IconEdit, IconEye, IconRoute, IconTrash } from "@tabler/icons-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/shadcn/ui/alert-dialog";

interface Route {
  id: number;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | null;
  featureId: number;
  featureName?: string;
  description?: string;
  isActive?: boolean;
  roleCount?: number;
  createdAt?: string;
}

interface RouteListTabProps {
  onRouteSelect: (routeId: string) => void;
  onRouteEdit: (routeId: string) => void;
  onRouteCreate: () => void;
  onRouteDelete?: (routeId: string) => void;
}

/**
 * Komponen untuk menampilkan daftar route dengan mapping ke feature
 * Menyediakan fitur pencarian, filter, dan aksi CRUD
 */
export function RouteListTab({
  onRouteSelect,
  onRouteEdit,
  onRouteCreate,
  onRouteDelete,
}: RouteListTabProps) {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [filteredRoutes, setFilteredRoutes] = useState<Route[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [featureFilter, setFeatureFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [deletingRouteId, setDeletingRouteId] = useState<string | null>(null);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);

  const { accessToken } = useAuth();

  /**
   * Handle delete route confirmation
   */
  const handleDeleteConfirm = async () => {
    if (!onRouteDelete || !routeToDelete) return;
    
    setDeletingRouteId(routeToDelete.id.toString());
    try {
      await onRouteDelete(routeToDelete.id.toString());
      // Refresh routes after deletion
      const updatedRoutes = routes.filter(route => route.id !== routeToDelete.id);
      setRoutes(updatedRoutes);
      setFilteredRoutes(updatedRoutes);
    } catch (error) {
      console.error('Error deleting route:', error);
    } finally {
      setDeletingRouteId(null);
      setRouteToDelete(null);
    }
  };

  /**
   * Load data route dari API saat komponen dimount
   */
  useEffect(() => {
    const loadRoutes = async () => {
      if (!accessToken) return;
      
      setIsLoading(true);
      try {
        const response = await fetch('/api/rbac/route-features', {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch route features');
        }
        
        const data = await response.json();
        if (data.success) {
          // Transform data untuk UI dengan feature name yang benar
          const transformedRoutes: Route[] = data.data.routeFeatures.map((item: any) => ({
            id: item.id,
            path: item.path,
            method: item.method,
            featureId: item.featureId,
            featureName: item.feature?.name || 'Unknown Feature', // Gunakan nama feature dari database
            description: `Route ${item.method || 'ALL'} ${item.path}`,
            isActive: true,
            roleCount: 0, // Placeholder
            createdAt: new Date().toISOString().split('T')[0],
          }));
          
          setRoutes(transformedRoutes);
          setFilteredRoutes(transformedRoutes);
        }
      } catch (error) {
        console.error("Error loading routes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRoutes();
  }, [accessToken]);

  /**
   * Filter routes berdasarkan search term, method, dan feature
   */
  useEffect(() => {
    let filtered = routes;

    // Filter berdasarkan search term
    if (searchTerm) {
      filtered = filtered.filter(
        (route) =>
          route.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (route.featureName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
          (route.description || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter berdasarkan method
    if (methodFilter !== "all") {
      filtered = filtered.filter((route) => route.method === methodFilter);
    }

    // Filter berdasarkan feature
    if (featureFilter !== "all") {
      filtered = filtered.filter((route) => route.featureId.toString() === featureFilter);
    }

    setFilteredRoutes(filtered);
  }, [routes, searchTerm, methodFilter, featureFilter]);

  /**
   * Get unique features untuk filter dropdown
   */
  const uniqueFeatures = Array.from(
    new Set(routes.map((route) => route.featureId))
  ).map((featureId) => {
    const route = routes.find((r) => r.featureId === featureId);
    return {
      id: featureId.toString(),
      name: route?.featureName || `Feature ${featureId}`,
    };
  });

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

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <IconRoute className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading routes...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header dengan tombol create */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Route List</h2>
          <p className="text-muted-foreground">
            Kelola mapping endpoint/path ke feature
          </p>
        </div>
        <Button onClick={onRouteCreate} className="flex items-center gap-2">
          <IconPlus className="h-4 w-4" />
          Create Route
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search routes, features, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Method Filter */}
            <div className="w-full sm:w-48">
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                  <SelectItem value="PATCH">PATCH</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Feature Filter */}
            <div className="w-full sm:w-48">
              <Select value={featureFilter} onValueChange={setFeatureFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Features" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Features</SelectItem>
                  {uniqueFeatures.map((feature) => (
                    <SelectItem key={feature.id} value={feature.id}>
                      {feature.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Routes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            Routes ({filteredRoutes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRoutes.length === 0 ? (
            <div className="text-center py-8">
              <IconRoute className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm || methodFilter !== "all" || featureFilter !== "all"
                  ? "No routes found matching your filters."
                  : "No routes available. Create your first route!"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Method</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoutes.map((route) => (
                    <TableRow 
                      key={route.id} 
                      className="hover:bg-muted/50 cursor-pointer" 
                      onClick={() => onRouteSelect(route.id.toString())}
                    >
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={getMethodBadgeColor(route.method || 'GET')}
                        >
                          {route.method || 'ALL'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="bg-muted px-2 py-1 rounded text-sm">
                          {route.path}
                        </code>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{route.featureName || `Feature ${route.featureId}`}</p>
                          <p className="text-sm text-muted-foreground">
                            {route.featureId}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{route.description || 'No description'}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {route.roleCount} role{route.roleCount !== 1 ? "s" : ""}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={route.isActive ? "default" : "secondary"}
                        >
                          {route.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-muted-foreground">
                          {route.createdAt
                            ? new Date(route.createdAt).toLocaleDateString()
                            : "-"}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRouteSelect(route.id.toString());
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <IconEye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              onRouteEdit(route.id.toString());
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <IconEdit className="h-4 w-4" />
                          </Button>
                          {onRouteDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  disabled={deletingRouteId === route.id.toString()}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <IconTrash className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete Route</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this route?
                                    <br />
                                    <strong>{route.method} {route.path}</strong>
                                    <br />
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => {
                                      setRouteToDelete(route);
                                      handleDeleteConfirm();
                                    }}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}