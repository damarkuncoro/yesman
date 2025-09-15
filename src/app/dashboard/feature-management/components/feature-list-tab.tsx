"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
import { IconPlus, IconSearch, IconEdit, IconEye, IconTrash } from "@tabler/icons-react";

interface Feature {
  id: number;
  name: string;
  description: string;
  category?: string | null;
  roleCount: number;
  createdAt: Date;
}

interface FeatureListTabProps {
  onFeatureSelect: (featureId: number) => void;
  onFeatureEdit: (featureId: number) => void;
  onFeatureCreate: () => void;
  onFeatureDelete: (featureId: number) => Promise<void>;
}

/**
 * Komponen untuk menampilkan daftar feature dalam bentuk tabel
 * Menyediakan fitur pencarian, filter, dan aksi CRUD
 */
export function FeatureListTab({
  onFeatureSelect,
  onFeatureEdit,
  onFeatureCreate,
  onFeatureDelete,
}: FeatureListTabProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Mengambil data features dari API dengan error handling yang lebih baik
   * @returns Promise<Feature[]> - Array features atau array kosong jika gagal
   */
  const fetchFeatures = async (): Promise<Feature[]> => {
    try {
      const response = await fetch('/api/rbac/features', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch features'}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'API returned unsuccessful response');
      }
      
      return Array.isArray(result.data) ? result.data : [];
    } catch (error) {
      console.error('Error fetching features:', error);
      // Re-throw dengan pesan yang lebih informatif
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to server');
      }
      throw error;
    }
  };

  /**
   * Load data features saat komponen dimount dengan retry mechanism
   */
  useEffect(() => {
    let isMounted = true;
    let retryCount = 0;
    const maxRetries = 3;
    
    const loadFeatures = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      try {
        const featuresData = await fetchFeatures();
        if (isMounted) {
          setFeatures(featuresData);
        }
      } catch (error) {
        console.error('Failed to load features:', error);
        
        if (isMounted) {
          // Retry logic untuk network errors
          if (retryCount < maxRetries && error instanceof Error && 
              (error.message.includes('Network error') || error.message.includes('fetch'))) {
            retryCount++;
            console.log(`Retrying... Attempt ${retryCount}/${maxRetries}`);
            setTimeout(() => loadFeatures(), 1000 * retryCount); // Exponential backoff
            return;
          }
          
          setFeatures([]); // Set empty array on error
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadFeatures();
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);

  /**
   * Filter features berdasarkan search term dengan memoization untuk performance
   */
  const filteredFeatures = useMemo(() => {
    if (!searchTerm.trim()) {
      return features;
    }
    
    const searchLower = searchTerm.toLowerCase().trim();
    return features.filter((feature) =>
      feature.name.toLowerCase().includes(searchLower) ||
      feature.description.toLowerCase().includes(searchLower) ||
      (feature.category && feature.category.toLowerCase().includes(searchLower))
    );
  }, [features, searchTerm]);

  /**
   * Handler untuk view detail feature dengan memoization
   */
  const handleViewDetail = useCallback((featureId: number) => {
    onFeatureSelect(featureId);
  }, [onFeatureSelect]);

  /**
   * Handler untuk edit feature dengan memoization
   */
  const handleEdit = useCallback((featureId: number) => {
    onFeatureEdit(featureId);
  }, [onFeatureEdit]);

  /**
   * Handler untuk delete feature dengan optimistic updates dan rollback
   */
  const handleDelete = useCallback(async (featureId: number) => {
    const featureToDelete = features.find(f => f.id === featureId);
    if (!featureToDelete) {
      console.error('Feature not found');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${featureToDelete.name}"? This action cannot be undone.`)) {
      return;
    }

    // Optimistic update - remove from UI immediately
    const originalFeatures = [...features];
    setFeatures(prev => prev.filter(f => f.id !== featureId));
    
    try {
      await onFeatureDelete(featureId);
    } catch (error) {
      console.error('Error deleting feature:', error);
      
      // Rollback optimistic update
      setFeatures(originalFeatures);
    }
  }, [features, onFeatureDelete]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading features...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Feature List</CardTitle>
          <Button onClick={onFeatureCreate} className="flex items-center gap-2">
            <IconPlus size={16} />
            Create Feature
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
            <Input
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Feature Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Role Count</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFeatures.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No features found
                  </TableCell>
                </TableRow>
              ) : (
                filteredFeatures.map((feature) => (
                  <TableRow 
                    key={feature.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleViewDetail(feature.id)}
                  >
                    <TableCell className="font-medium">
                      {feature.name}
                    </TableCell>
                    <TableCell>{feature.description}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {feature.roleCount} roles
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="default">
                        Active
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(feature.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewDetail(feature.id);
                          }}
                        >
                          <IconEye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(feature.id);
                          }}
                        >
                          <IconEdit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(feature.id);
                          }}
                        >
                          <IconTrash size={16} />
                        </Button>
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
  );
}