"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/ui/tabs'
import { RouteListTab } from "./route-list-tab";
import { RouteDetailTab } from "./route-detail-tab";
import { RouteCreateEditTab } from "./route-create-edit-tab";

/**
 * Komponen utama untuk mengelola tab-tab dalam Route Management
 * Mengatur state untuk tab aktif dan route yang dipilih
 */
export function RouteManagementTabs() {
  const [activeTab, setActiveTab] = useState("list");
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  /**
   * Handler untuk memilih route dan beralih ke tab detail
   */
  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
    setActiveTab("detail");
  };

  /**
   * Handler untuk edit route dan beralih ke tab create/edit
   */
  const handleRouteEdit = (routeId: string) => {
    setSelectedRouteId(routeId);
    setIsEditMode(true);
    setActiveTab("create-edit");
  };

  /**
   * Handler untuk membuat route baru
   */
  const handleRouteCreate = () => {
    setSelectedRouteId(null);
    setIsEditMode(false);
    setActiveTab("create-edit");
  };

  /**
   * Handler untuk kembali ke tab list setelah operasi berhasil
   */
  const handleSuccess = () => {
    setActiveTab("list");
    setSelectedRouteId(null);
    setIsEditMode(false);
  };

  /**
   * Handler untuk membatalkan operasi dan kembali ke tab list
   */
  const handleCancel = () => {
    setActiveTab("list");
    setSelectedRouteId(null);
    setIsEditMode(false);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="list">Route List</TabsTrigger>
        <TabsTrigger value="detail" disabled={!selectedRouteId}>
          Route Detail
        </TabsTrigger>
        <TabsTrigger value="create-edit">
          {isEditMode ? "Edit Route" : "Create Route"}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="list" className="mt-6">
        <RouteListTab
          onRouteSelect={handleRouteSelect}
          onRouteEdit={handleRouteEdit}
          onRouteCreate={handleRouteCreate}
        />
      </TabsContent>

      <TabsContent value="detail" className="mt-6">
        <RouteDetailTab
          routeId={selectedRouteId}
          onEdit={() => handleRouteEdit(selectedRouteId!)}
          onBack={() => setActiveTab("list")}
        />
      </TabsContent>

      <TabsContent value="create-edit" className="mt-6">
        <RouteCreateEditTab
          routeId={selectedRouteId}
          isEditMode={isEditMode}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </TabsContent>
    </Tabs>
  );
}