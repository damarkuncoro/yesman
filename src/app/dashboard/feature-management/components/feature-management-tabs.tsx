"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/ui/tabs'
import { FeatureListTab } from "./feature-list-tab";
import { FeatureDetailTab } from "./feature-detail-tab";
import { FeatureCreateEditTab } from "./feature-create-edit-tab";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * Komponen utama untuk mengelola tab-tab Feature Management
 * Mengatur state dan navigasi antar tab
 */
export function FeatureManagementTabs() {
  const [activeTab, setActiveTab] = useState("list");
  const [selectedFeatureId, setSelectedFeatureId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const { accessToken } = useAuth();

  /**
   * Handler untuk memilih feature dari list
   */
  const handleFeatureSelect = (featureId: number) => {
    setSelectedFeatureId(featureId);
    setActiveTab("detail");
  };

  /**
   * Handler untuk edit feature
   */
  const handleFeatureEdit = (featureId: number) => {
    setSelectedFeatureId(featureId);
    setIsEditMode(true);
    setActiveTab("create-edit");
  };

  /**
   * Handler untuk create feature baru
   */
  const handleFeatureCreate = () => {
    setSelectedFeatureId(null);
    setIsEditMode(false);
    setActiveTab("create-edit");
  };

  /**
   * Handler untuk kembali ke list setelah operasi berhasil
   */
  const handleSuccess = () => {
    setActiveTab("list");
    setSelectedFeatureId(null);
    setIsEditMode(false);
  };

  /**
   * Handler untuk membatalkan operasi dan kembali ke tab list
   */
  const handleCancel = () => {
    setActiveTab("list");
    setSelectedFeatureId(null);
    setIsEditMode(false);
  };

  /**
   * Handler untuk menghapus feature
   */
  const handleFeatureDelete = async (featureId: number) => {
    if (!accessToken) {
      toast.error("Authentication required");
      return;
    }

    try {
      const response = await fetch(`/api/rbac/features/${featureId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete feature');
      }

      toast.success('Feature deleted successfully');
      
      // If we're viewing the deleted feature, go back to list
      if (selectedFeatureId === featureId) {
        setActiveTab("list");
        setSelectedFeatureId(null);
        setIsEditMode(false);
      }
    } catch (error) {
      console.error('Error deleting feature:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete feature');
      throw error; // Re-throw to let FeatureListTab handle the error state
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="list">Feature List</TabsTrigger>
        <TabsTrigger value="detail" disabled={!selectedFeatureId}>
          Feature Detail
        </TabsTrigger>
        <TabsTrigger value="create-edit">
          {isEditMode ? "Edit Feature" : "Create Feature"}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="mt-6">
        <FeatureListTab
          onFeatureSelect={handleFeatureSelect}
          onFeatureEdit={handleFeatureEdit}
          onFeatureCreate={handleFeatureCreate}
          onFeatureDelete={handleFeatureDelete}
        />
      </TabsContent>

      <TabsContent value="detail" className="mt-6">
        <FeatureDetailTab
          featureId={selectedFeatureId}
          onEdit={() => handleFeatureEdit(selectedFeatureId!)}
          onBack={() => setActiveTab("list")}
        />
      </TabsContent>

      <TabsContent value="create-edit" className="mt-6">
        <FeatureCreateEditTab
          featureId={selectedFeatureId}
          isEditMode={isEditMode}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </TabsContent>
    </Tabs>
  );
}