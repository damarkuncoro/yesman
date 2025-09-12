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
import { IconPlus, IconSearch, IconEdit, IconEye } from "@tabler/icons-react";

interface Feature {
  id: string;
  name: string;
  description: string;
  roleCount: number;
  isActive: boolean;
  createdAt: string;
}

interface FeatureListTabProps {
  onFeatureSelect: (featureId: string) => void;
  onFeatureEdit: (featureId: string) => void;
  onFeatureCreate: () => void;
}

/**
 * Komponen untuk menampilkan daftar feature dalam bentuk tabel
 * Menyediakan fitur pencarian, filter, dan aksi CRUD
 */
export function FeatureListTab({
  onFeatureSelect,
  onFeatureEdit,
  onFeatureCreate,
}: FeatureListTabProps) {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // Mock data untuk development
  const mockFeatures: Feature[] = [
    {
      id: "1",
      name: "user_management",
      description: "Mengelola pengguna sistem",
      roleCount: 3,
      isActive: true,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "article_management",
      description: "Mengelola artikel dan konten",
      roleCount: 2,
      isActive: true,
      createdAt: "2024-01-16",
    },
    {
      id: "3",
      name: "role_management",
      description: "Mengelola role dan permission",
      roleCount: 1,
      isActive: true,
      createdAt: "2024-01-17",
    },
    {
      id: "4",
      name: "report_management",
      description: "Mengelola laporan dan analytics",
      roleCount: 2,
      isActive: false,
      createdAt: "2024-01-18",
    },
    {
      id: "5",
      name: "system_settings",
      description: "Pengaturan sistem aplikasi",
      roleCount: 1,
      isActive: true,
      createdAt: "2024-01-19",
    },
  ];

  /**
   * Load data features saat komponen dimount
   */
  useEffect(() => {
    const loadFeatures = async () => {
      setIsLoading(true);
      try {
        // Simulasi API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        setFeatures(mockFeatures);
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
  const handleViewDetail = (featureId: string) => {
    onFeatureSelect(featureId);
  };

  /**
   * Handler untuk edit feature
   */
  const handleEdit = (featureId: string) => {
    onFeatureEdit(featureId);
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
                  <TableRow key={feature.id}>
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
                      <Badge
                        variant={feature.isActive ? "default" : "secondary"}
                      >
                        {feature.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>{feature.createdAt}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetail(feature.id)}
                        >
                          <IconEye size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(feature.id)}
                        >
                          <IconEdit size={16} />
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