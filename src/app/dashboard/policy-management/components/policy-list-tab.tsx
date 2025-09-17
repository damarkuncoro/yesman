'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/shadcn/ui/button';
import { Badge } from '@/components/shadcn/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/ui/table';
import { Card, CardContent, CardHeader } from '@/components/shadcn/ui/card';
import { IconPlus, IconEdit, IconEye, IconTrash } from '@tabler/icons-react';

// Interface untuk Policy ABAC
interface Policy {
  id: number;
  name: string;
  feature: string;
  attribute: string;
  operator: string;
  value: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PolicyListTabProps {
  onCreatePolicy: () => void;
  onEditPolicy: (policyId: number) => void;
  onViewDetail: (policyId: number) => void;
}

/**
 * Komponen untuk menampilkan daftar policy ABAC
 * Menampilkan tabel dengan semua aturan ABAC yang ada
 */
export default function PolicyListTab({
  onCreatePolicy,
  onEditPolicy,
  onViewDetail,
}: PolicyListTabProps) {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [isLoading, setIsLoading] = useState(true);



  /**
   * Fetch data policies dari database
   */
  useEffect(() => {
    const fetchPoliciesFromAllFeatures = async () => {
      setIsLoading(true);
      try {
        // Step 1: Ambil daftar semua features
        const featuresResponse = await fetch('/api/v1/rbac/features');
        
        if (!featuresResponse.ok) {
          throw new Error(`HTTP ${featuresResponse.status}: Failed to fetch features`);
        }
        
        const featuresResult = await featuresResponse.json();
        
        if (!featuresResult.success || !featuresResult.data?.features) {
          throw new Error('Invalid features response format');
        }
        
        const features = featuresResult.data.features;
        let allPolicies: Policy[] = [];
        
        // Step 2: Ambil policies untuk setiap feature
        for (const feature of features) {
          try {
            const policiesResponse = await fetch(`/api/v1/abac/policies?featureId=${feature.id}`);
            
            if (policiesResponse.ok) {
              const policiesResult = await policiesResponse.json();
              
              if (policiesResult.policies && Array.isArray(policiesResult.policies)) {
                // Transform data untuk match dengan interface Policy
                const transformedPolicies: Policy[] = policiesResult.policies.map((policy: any) => ({
                  id: policy.id,
                  name: `Policy for ${feature.name}`,
                  feature: feature.name,
                  attribute: policy.attribute,
                  operator: policy.operator,
                  value: policy.value,
                  isActive: true, // Default karena API belum mengembalikan isActive
                  createdAt: policy.createdAt || new Date().toISOString(),
                  updatedAt: policy.updatedAt || new Date().toISOString(),
                }));
                
                allPolicies = [...allPolicies, ...transformedPolicies];
              }
            }
          } catch (featureError) {
            console.warn(`Error fetching policies for feature ${feature.name}:`, featureError);
            // Continue dengan feature lainnya
          }
        }
        
        setPolicies(allPolicies);
        
      } catch (error) {
        console.error('Error fetching policies from all features:', error);
        setPolicies([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPoliciesFromAllFeatures();
  }, []);

  /**
   * Handler untuk delete policy
   * @param policyId - ID policy yang akan dihapus
   */
  const handleDeletePolicy = async (policyId: number) => {
    // Konfirmasi dengan toast
    toast('Konfirmasi Hapus', {
      description: 'Apakah Anda yakin ingin menghapus policy ini?',
      action: {
        label: 'Hapus',
        onClick: async () => {
          try {
            const response = await fetch(`/api/v1/abac/policies/${policyId}`, {
              method: 'DELETE',
            });
            
            if (response.ok) {
              // Remove dari state jika berhasil dihapus
              setPolicies(prev => prev.filter(policy => policy.id !== policyId));
              toast.success('Policy berhasil dihapus');
            } else {
              console.error('Failed to delete policy');
              toast.error('Gagal menghapus policy. Silakan coba lagi.');
            }
          } catch (error) {
            console.error('Error deleting policy:', error);
            toast.error('Terjadi error saat menghapus policy.');
          }
        }
      },
      cancel: {
        label: 'Batal',
        onClick: () => {
          toast.dismiss();
        }
      }
    });
  };

  /**
   * Render operator badge dengan warna yang sesuai
   */
  const renderOperatorBadge = (operator: string) => {
    const operatorColors: Record<string, string> = {
      '==': 'bg-blue-100 text-blue-800',
      '!=': 'bg-red-100 text-red-800',
      '>': 'bg-green-100 text-green-800',
      '<': 'bg-yellow-100 text-yellow-800',
      '>=': 'bg-green-100 text-green-800',
      '<=': 'bg-yellow-100 text-yellow-800',
      'in': 'bg-purple-100 text-purple-800',
      'not_in': 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={operatorColors[operator] || 'bg-gray-100 text-gray-800'}>
        {operator}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Memuat data policies...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header dengan tombol Create */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Daftar Policy ABAC</h3>
          <p className="text-gray-600 text-sm mt-1">
            Kelola aturan akses berdasarkan atribut pengguna
          </p>
        </div>
        <Button onClick={onCreatePolicy} className="flex items-center gap-2">
          <IconPlus size={16} />
          Buat Policy Baru
        </Button>
      </div>

      {/* Tabel Policy */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Policy</TableHead>
                <TableHead>Feature</TableHead>
                <TableHead>Attribute</TableHead>
                <TableHead>Operator</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {policies.map((policy) => (
                <TableRow key={policy.id}>
                  <TableCell className="font-medium">{policy.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{policy.feature}</Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {policy.attribute}
                    </span>
                  </TableCell>
                  <TableCell>{renderOperatorBadge(policy.operator)}</TableCell>
                  <TableCell>
                    <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                      {policy.value}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={policy.isActive ? "default" : "secondary"}
                      className={policy.isActive ? "bg-green-100 text-green-800" : ""}
                    >
                      {policy.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {new Date(policy.createdAt).toLocaleDateString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail(policy.id)}
                        className="h-8 w-8 p-0"
                      >
                        <IconEye size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditPolicy(policy.id)}
                        className="h-8 w-8 p-0"
                      >
                        <IconEdit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePolicy(policy.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <IconTrash size={16} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {policies.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">Belum ada policy yang dibuat.</p>
              <Button 
                onClick={onCreatePolicy} 
                className="mt-4"
                variant="outline"
              >
                Buat Policy Pertama
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}