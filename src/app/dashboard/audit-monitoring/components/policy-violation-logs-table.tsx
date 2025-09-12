"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/ui/table";
import { Badge } from "@/components/shadcn/ui/badge";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/ui/select";
import { AlertTriangleIcon, FilterIcon, RefreshCwIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface PolicyViolation {
  id: number;
  userId: number | null;
  featureId: number | null;
  policyId: number | null;
  attribute: string;
  expectedValue: string;
  actualValue: string | null;
  createdAt: Date;
  user?: {
    id: number;
    name: string;
    email: string;
    department?: string;
    region?: string;
    level?: number;
  };
  feature?: {
    id: number;
    name: string;
    description?: string;
  };
  policy?: {
    id: number;
    attribute: string;
    operator: string;
    value: string;
  };
}

interface PolicyViolationStats {
  total: number;
  byAttribute: Record<string, number>;
  uniqueUsers: number;
  uniqueFeatures: number;
}

/**
 * Komponen untuk menampilkan tabel policy violation logs
 * Menampilkan request yang ditolak karena gagal ABAC (Attribute-Based Access Control)
 */
export function PolicyViolationLogsTable() {
  const [violations, setViolations] = useState<PolicyViolation[]>([]);
  const [stats, setStats] = useState<PolicyViolationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    attribute: '',
    userId: '',
    featureId: '',
    policyId: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  /**
   * Mengambil data policy violations dari API
   */
  const fetchPolicyViolations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.attribute) params.append('attribute', filters.attribute);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.featureId) params.append('featureId', filters.featureId);
      if (filters.policyId) params.append('policyId', filters.policyId);
      
      const queryString = params.toString();
      const url = `/api/audit/policy-violations${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setViolations(data.violations || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Error fetching policy violations:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effect untuk mengambil data saat komponen dimount atau filter berubah
   */
  useEffect(() => {
    fetchPolicyViolations();
  }, [filters]);

  /**
   * Handler untuk mengubah filter
   */
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset ke halaman pertama saat filter berubah
  };

  /**
   * Handler untuk reset filter
   */
  const handleResetFilters = () => {
    setFilters({
      attribute: '',
      userId: '',
      featureId: '',
      policyId: ''
    });
    setCurrentPage(1);
  };

  /**
   * Mendapatkan badge variant berdasarkan attribute
   */
  const getAttributeBadgeVariant = (attribute: string) => {
    switch (attribute) {
      case 'department':
        return 'default';
      case 'region':
        return 'secondary';
      case 'level':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  /**
   * Format tanggal untuk tampilan
   */
  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd MMM yyyy HH:mm:ss', { locale: id });
  };

  /**
   * Format nilai untuk tampilan yang lebih baik
   */
  const formatValue = (value: string | null) => {
    if (!value) return '-';
    try {
      // Coba parse sebagai JSON array
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        return parsed.join(', ');
      }
      return value;
    } catch {
      return value;
    }
  };

  // Pagination logic
  const totalPages = Math.ceil(violations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentViolations = violations.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5" />
            Policy Violation Logs
          </CardTitle>
          <CardDescription>Memuat data policy violations...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <RefreshCwIcon className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5" />
            Policy Violation Logs
          </CardTitle>
          <CardDescription>Terjadi kesalahan saat memuat data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchPolicyViolations} variant="outline">
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Coba Lagi
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Violations</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">Affected Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.uniqueFeatures}</div>
              <p className="text-xs text-muted-foreground">Affected Features</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm space-y-1">
                {Object.entries(stats.byAttribute).map(([attr, count]) => (
                  <div key={attr} className="flex justify-between">
                    <span className="capitalize">{attr}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">By Attribute</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangleIcon className="h-5 w-5" />
                Policy Violation Logs
              </CardTitle>
              <CardDescription>
                Request yang ditolak karena gagal ABAC (Attribute-Based Access Control)
              </CardDescription>
            </div>
            <Button onClick={fetchPolicyViolations} variant="outline" size="sm">
              <RefreshCwIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <FilterIcon className="h-4 w-4" />
              <span className="text-sm font-medium">Filter:</span>
            </div>
            
            <Select value={filters.attribute} onValueChange={(value) => handleFilterChange('attribute', value)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Attribute" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua</SelectItem>
                <SelectItem value="department">Department</SelectItem>
                <SelectItem value="region">Region</SelectItem>
                <SelectItem value="level">Level</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="User ID..."
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              className="w-24"
              type="number"
            />
            
            <Input
              placeholder="Feature ID..."
              value={filters.featureId}
              onChange={(e) => handleFilterChange('featureId', e.target.value)}
              className="w-28"
              type="number"
            />
            
            <Input
              placeholder="Policy ID..."
              value={filters.policyId}
              onChange={(e) => handleFilterChange('policyId', e.target.value)}
              className="w-26"
              type="number"
            />
            
            <Button onClick={handleResetFilters} variant="outline" size="sm">
              Reset
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Attribute</TableHead>
                  <TableHead>Expected Value</TableHead>
                  <TableHead>Actual Value</TableHead>
                  <TableHead>Policy</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentViolations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Tidak ada data policy violations
                    </TableCell>
                  </TableRow>
                ) : (
                  currentViolations.map((violation) => (
                    <TableRow key={violation.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(violation.createdAt)}
                      </TableCell>
                      <TableCell>
                        {violation.user ? (
                          <div>
                            <div className="font-medium">{violation.user.name}</div>
                            <div className="text-xs text-muted-foreground">{violation.user.email}</div>
                            <div className="text-xs text-muted-foreground">
                              {violation.user.department && `Dept: ${violation.user.department}`}
                              {violation.user.region && ` | Region: ${violation.user.region}`}
                              {violation.user.level && ` | Level: ${violation.user.level}`}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {violation.feature ? (
                          <div>
                            <div className="font-medium">{violation.feature.name}</div>
                            {violation.feature.description && (
                              <div className="text-xs text-muted-foreground">
                                {violation.feature.description}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getAttributeBadgeVariant(violation.attribute)}>
                          {violation.attribute}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {formatValue(violation.expectedValue)}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                          {formatValue(violation.actualValue)}
                        </code>
                      </TableCell>
                      <TableCell>
                        {violation.policy ? (
                          <div className="text-xs">
                            <div className="font-mono">
                              {violation.policy.attribute} {violation.policy.operator} {formatValue(violation.policy.value)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Menampilkan {startIndex + 1}-{Math.min(endIndex, violations.length)} dari {violations.length} data
              </div>
              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Halaman {currentPage} dari {totalPages}
                </span>
                <Button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}