'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/ui/tabs';
import { Card, CardContent, CardHeader } from '@/components/shadcn/ui/card';
import PolicyListTab from './policy-list-tab';
import PolicyCreateEditTab from './policy-create-edit-tab';
import PolicyDetailTab from './policy-detail-tab';

/**
 * Komponen utama untuk mengelola tab-tab dalam Policy Management
 * Menggunakan state untuk mengontrol tab aktif dan data yang dipilih
 */
export default function PolicyManagementTabs() {
  const [activeTab, setActiveTab] = useState('list');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  /**
   * Handler untuk membuka tab create policy
   */
  const handleCreatePolicy = () => {
    setSelectedPolicyId(null);
    setIsEditMode(false);
    setActiveTab('create-edit');
  };

  /**
   * Handler untuk membuka tab edit policy
   * @param policyId - ID policy yang akan diedit
   */
  const handleEditPolicy = (policyId: string) => {
    setSelectedPolicyId(policyId);
    setIsEditMode(true);
    setActiveTab('create-edit');
  };

  /**
   * Handler untuk membuka tab detail policy
   * @param policyId - ID policy yang akan dilihat detailnya
   */
  const handleViewDetail = (policyId: string) => {
    setSelectedPolicyId(policyId);
    setActiveTab('detail');
  };

  /**
   * Handler untuk kembali ke tab list setelah operasi berhasil
   */
  const handleSuccess = () => {
    setActiveTab('list');
    setSelectedPolicyId(null);
    setIsEditMode(false);
  };

  /**
   * Handler untuk cancel operasi dan kembali ke tab list
   */
  const handleCancel = () => {
    setActiveTab('list');
    setSelectedPolicyId(null);
    setIsEditMode(false);
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">Policy Management (ABAC)</h2>
          <p className="text-gray-600 mt-2">
            Kelola aturan Attribute-Based Access Control (ABAC) untuk mengontrol akses berdasarkan atribut pengguna
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="list">Policy List</TabsTrigger>
              <TabsTrigger value="create-edit">
                {isEditMode ? 'Edit Policy' : 'Create Policy'}
              </TabsTrigger>
              <TabsTrigger value="detail">Policy Detail</TabsTrigger>
            </TabsList>

            <TabsContent value="list" className="mt-6">
              <PolicyListTab
                onCreatePolicy={handleCreatePolicy}
                onEditPolicy={handleEditPolicy}
                onViewDetail={handleViewDetail}
              />
            </TabsContent>

            <TabsContent value="create-edit" className="mt-6">
              <PolicyCreateEditTab
                policyId={selectedPolicyId}
                isEditMode={isEditMode}
                onSuccess={handleSuccess}
                onCancel={handleCancel}
              />
            </TabsContent>

            <TabsContent value="detail" className="mt-6">
              <PolicyDetailTab
                policyId={selectedPolicyId}
                onBack={handleCancel}
                onEdit={handleEditPolicy}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}