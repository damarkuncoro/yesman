'use client';

import { useState, useEffect } from 'react';
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
  id: string;
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
  onEditPolicy: (policyId: string) => void;
  onViewDetail: (policyId: string) => void;
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

  // Mock data untuk policy ABAC
  const mockPolicies: Policy[] = [
    {
      id: '1',
      name: 'Finance Payroll Access',
      feature: 'payroll',
      attribute: 'department',
      operator: '==',
      value: 'Finance',
      isActive: true,
      createdAt: '2024-01-15',
      updatedAt: '2024-01-20',
    },
    {
      id: '2',
      name: 'Senior Article Management',
      feature: 'article_management',
      attribute: 'level',
      operator: '>=',
      value: '3',
      isActive: true,
      createdAt: '2024-01-16',
      updatedAt: '2024-01-21',
    },
    {
      id: '3',
      name: 'HR Employee Access',
      feature: 'employee_management',
      attribute: 'department',
      operator: 'in',
      value: 'HR,Management',
      isActive: true,
      createdAt: '2024-01-17',
      updatedAt: '2024-01-22',
    },
    {
      id: '4',
      name: 'Regional Manager Access',
      feature: 'regional_reports',
      attribute: 'region',
      operator: '==',
      value: 'Jakarta',
      isActive: false,
      createdAt: '2024-01-18',
      updatedAt: '2024-01-23',
    },
    {
      id: '5',
      name: 'Executive Dashboard',
      feature: 'executive_dashboard',
      attribute: 'level',
      operator: '>',
      value: '5',
      isActive: true,
      createdAt: '2024-01-19',
      updatedAt: '2024-01-24',
    },
  ];

  /**
   * Simulasi fetch data policies
   */
  useEffect(() => {
    const fetchPolicies = async () => {
      setIsLoading(true);
      // Simulasi API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPolicies(mockPolicies);
      setIsLoading(false);
    };

    fetchPolicies();
  }, []);

  /**
   * Handler untuk delete policy
   * @param policyId - ID policy yang akan dihapus
   */
  const handleDeletePolicy = async (policyId: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus policy ini?')) {
      // Simulasi delete API call
      setPolicies(prev => prev.filter(policy => policy.id !== policyId));
    }
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