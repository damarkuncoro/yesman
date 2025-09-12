"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/ui/tabs'
import { FeatureListTab } from "./feature-list-tab";
import { FeatureDetailTab } from "./feature-detail-tab";
import { FeatureCreateEditTab } from "./feature-create-edit-tab";

/**
 * Komponen utama untuk mengelola tab-tab Feature Management
 * Mengatur state dan navigasi antar tab
 */
export function FeatureManagementTabs() {
  const [activeTab, setActiveTab] = useState("list");
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  /**
   * Handler untuk memilih feature dari list
   */
  const handleFeatureSelect = (featureId: string) => {
    setSelectedFeatureId(featureId);
    setActiveTab("detail");
  };

  /**
   * Handler untuk edit feature
   */
  const handleFeatureEdit = (featureId: string) => {
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
   * Handler untuk kembali ke list
   */
  const handleBackToList = () => {
    setSelectedFeatureId(null);
    setIsEditMode(false);
    setActiveTab("list");
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
        />
      </TabsContent>

      <TabsContent value="detail" className="mt-6">
        <FeatureDetailTab
          featureId={selectedFeatureId}
          onEdit={handleFeatureEdit}
          onBackToList={handleBackToList}
        />
      </TabsContent>

      <TabsContent value="create-edit" className="mt-6">
        <FeatureCreateEditTab
          featureId={isEditMode ? selectedFeatureId : null}
          isEditMode={isEditMode}
          onSuccess={handleBackToList}
          onCancel={handleBackToList}
        />
      </TabsContent>
    </Tabs>
  );
}