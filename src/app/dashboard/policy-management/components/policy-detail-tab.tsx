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
import { IconArrowLeft, IconEdit, IconShield, IconUsers, IconClock } from '@tabler/icons-react';

// Interface untuk Policy Detail
interface PolicyDetail {
  id: number;
  name: string;
  description: string;
  feature: string;
  attribute: string;
  operator: string;
  value: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  affectedUsers: AffectedUser[];
  relatedPolicies: RelatedPolicy[];
}

interface AffectedUser {
  id: number;
  name: string;
  email: string;
  department: string;
  level: number;
  region: string;
  hasAccess: boolean;
}

interface RelatedPolicy {
  id: number;
  name: string;
  feature: string;
  isActive: boolean;
}

interface PolicyDetailTabProps {
  policyId: number | null;
  onBack: () => void;
  onEdit: (policyId: number) => void;
}

/**
 * Komponen untuk menampilkan detail policy ABAC
 * Menampilkan informasi lengkap policy dan pengguna yang terpengaruh
 */
export default function PolicyDetailTab({
  policyId,
  onBack,
  onEdit,
}: PolicyDetailTabProps) {
  const [policyDetail, setPolicyDetail] = useState<PolicyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'related'>('overview');

  // Tidak menggunakan mock data - semua data dari database

  /**
   * Load policy detail data dari database
   */
  useEffect(() => {
    const fetchPolicyDetail = async () => {
      if (!policyId) return;
      
      setIsLoading(true);
      try {
        const response = await fetch(`/api/v1/abac/policies/${policyId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch policy detail`);
        }
        
        const result = await response.json();
        
        if (result.success && result.data) {
          // Transform data untuk match dengan interface PolicyDetail
          const transformedPolicy: PolicyDetail = {
            id: result.data.id,
            name: `Policy for ${result.data.feature}`,
            description: `Policy untuk memberikan akses ${result.data.feature} berdasarkan ${result.data.attribute}`,
            feature: result.data.feature,
            attribute: result.data.attribute,
            operator: result.data.operator,
            value: result.data.value,
            isActive: result.data.isActive,
            createdAt: result.data.createdAt,
            updatedAt: result.data.updatedAt,
            createdBy: 'System',
            updatedBy: 'System',
            // Data kosong untuk affected users dan related policies
            // TODO: Implement real API endpoints untuk data ini
            affectedUsers: [],
            relatedPolicies: [],
          };
          
          setPolicyDetail(transformedPolicy);
        } else {
          console.error('Failed to fetch policy detail:', result.message);
          toast.error('Gagal memuat detail policy');
          setPolicyDetail(null);
        }
      } catch (error) {
        console.error('Error fetching policy detail:', error);
        toast.error('Terjadi error saat memuat detail policy');
        setPolicyDetail(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPolicyDetail();
  }, [policyId]);

  /**
   * Render operator dengan styling yang sesuai
   */
  const renderOperator = (operator: string) => {
    const operatorLabels: Record<string, string> = {
      '==': 'Equals',
      '!=': 'Not Equals',
      '>': 'Greater Than',
      '<': 'Less Than',
      '>=': 'Greater Than or Equal',
      '<=': 'Less Than or Equal',
      'in': 'In',
      'not_in': 'Not In',
    };

    return (
      <Badge variant="outline" className="font-mono">
        {operator} ({operatorLabels[operator]})
      </Badge>
    );
  };

  /**
   * Render policy rule dalam format yang mudah dibaca
   */
  const renderPolicyRule = () => {
    if (!policyDetail) return null;

    return (
      <div className="bg-gray-50 p-4 rounded-lg border">
        <h4 className="font-semibold mb-2">Aturan Policy:</h4>
        <div className="font-mono text-sm bg-white p-3 rounded border">
          <span className="text-blue-600">{policyDetail.attribute}</span>
          <span className="mx-2 text-gray-600">{policyDetail.operator}</span>
          <span className="text-green-600">"{policyDetail.value}"</span>
          <span className="mx-2 text-gray-600">→</span>
          <span className="text-purple-600">access to {policyDetail.feature}</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Pengguna dengan {policyDetail.attribute} {policyDetail.operator} "{policyDetail.value}" 
          akan mendapat akses ke feature {policyDetail.feature}
        </p>
      </div>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Memuat detail policy...</span>
        </CardContent>
      </Card>
    );
  }

  if (!policyDetail) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Policy tidak ditemukan.</p>
          <Button onClick={onBack} className="mt-4" variant="outline">
            Kembali ke List
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <IconArrowLeft size={16} />
            Kembali
          </Button>
          <div>
            <h3 className="text-lg font-semibold">{policyDetail.name}</h3>
            <p className="text-gray-600 text-sm">
              Detail policy untuk feature {policyDetail.feature}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge 
            variant={policyDetail.isActive ? "default" : "secondary"}
            className={policyDetail.isActive ? "bg-green-100 text-green-800" : ""}
          >
            {policyDetail.isActive ? 'Aktif' : 'Nonaktif'}
          </Badge>
          <Button
            onClick={() => onEdit(policyDetail.id)}
            className="flex items-center gap-2"
          >
            <IconEdit size={16} />
            Edit Policy
          </Button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <IconShield size={16} className="inline mr-2" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <IconUsers size={16} className="inline mr-2" />
            Affected Users ({policyDetail.affectedUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('related')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'related'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <IconClock size={16} className="inline mr-2" />
            Related Policies ({policyDetail.relatedPolicies.length})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Policy Information */}
          <Card>
            <CardHeader>
              <h4 className="text-lg font-semibold">Informasi Policy</h4>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Feature</label>
                  <p className="mt-1">
                    <Badge variant="outline">{policyDetail.feature}</Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Status</label>
                  <p className="mt-1">
                    <Badge 
                      variant={policyDetail.isActive ? "default" : "secondary"}
                      className={policyDetail.isActive ? "bg-green-100 text-green-800" : ""}
                    >
                      {policyDetail.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Attribute</label>
                  <p className="mt-1 font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">
                    {policyDetail.attribute}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Operator</label>
                  <p className="mt-1">{renderOperator(policyDetail.operator)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Value</label>
                  <p className="mt-1 font-mono text-sm bg-gray-100 px-2 py-1 rounded inline-block">
                    {policyDetail.value}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Dibuat</label>
                  <p className="mt-1 text-sm">
                    {new Date(policyDetail.createdAt).toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-500">oleh {policyDetail.createdBy}</p>
                </div>
              </div>
              
              {policyDetail.description && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Deskripsi</label>
                  <p className="mt-1 text-sm text-gray-700">{policyDetail.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Policy Rule */}
          <Card>
            <CardHeader>
              <h4 className="text-lg font-semibold">Aturan Policy</h4>
            </CardHeader>
            <CardContent>
              {renderPolicyRule()}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <h4 className="text-lg font-semibold">Pengguna yang Terpengaruh</h4>
            <p className="text-sm text-gray-600">
              Daftar pengguna dan status akses mereka berdasarkan policy ini
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status Akses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policyDetail.affectedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{user.department}</Badge>
                    </TableCell>
                    <TableCell>{user.level}</TableCell>
                    <TableCell>{user.region}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={user.hasAccess ? "default" : "secondary"}
                        className={user.hasAccess ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                      >
                        {user.hasAccess ? 'Memiliki Akses' : 'Tidak Ada Akses'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === 'related' && (
        <Card>
          <CardHeader>
            <h4 className="text-lg font-semibold">Policy Terkait</h4>
            <p className="text-sm text-gray-600">
              Policy lain yang mungkin berkaitan dengan policy ini
            </p>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Policy</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policyDetail.relatedPolicies.map((policy) => (
                  <TableRow key={policy.id}>
                    <TableCell className="font-medium">{policy.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{policy.feature}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={policy.isActive ? "default" : "secondary"}
                        className={policy.isActive ? "bg-green-100 text-green-800" : ""}
                      >
                        {policy.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(policy.id)}
                      >
                        Lihat Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}