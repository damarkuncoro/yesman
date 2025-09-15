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
   * Mengambil data features dari API
   */
  const fetchFeatures = async (): Promise<Feature[]> => {
    try {
      const response = await fetch('/api/rbac/features');
      if (!response.ok) {
        throw new Error('Failed to fetch features');
      }
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('Error fetching features:', error);
      throw error;
    }
  };

  /**
   * Load data features saat komponen dimount
   */
  useEffect(() => {
    const loadFeatures = async () => {
      setIsLoading(true);
      try {
        const featuresData = await fetchFeatures();
        setFeatures(featuresData);
      } catch (error) {
        console.error("Error loading features:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFeatures();
  }, []);

  /**
   * Filter features berdasarkan search term
   */
  const filteredFeatures = features.filter(
    (feature) =>
      feature.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Handler untuk view detail feature
   */
  const handleViewDetail = (featureId: number) => {
    onFeatureSelect(featureId);
  };

  /**
   * Handler untuk edit feature
   */
  const handleEdit = (featureId: number) => {
    onFeatureEdit(featureId);
  };

  /**
   * Handler untuk delete feature
   */
  const handleDelete = async (featureId: number) => {
    if (window.confirm('Are you sure you want to delete this feature?')) {
      try {
        await onFeatureDelete(featureId);
        // Refresh data setelah delete berhasil
        const featuresData = await fetchFeatures();
        setFeatures(featuresData);
      } catch (error) {
        // Error handling sudah dilakukan di parent component
        console.error('Error deleting feature:', error);
      }
    }
  };

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