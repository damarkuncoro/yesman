"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/ui/table";
import { Badge } from "@/components/shadcn/ui/badge";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/ui/select";
import { HistoryIcon, FilterIcon, RefreshCwIcon, UserIcon, FileTextIcon, ShieldIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface ChangeHistory {
  id: number;
  entityType: string;
  entityId: number;
  action: string;
  oldValues: string | null;
  newValues: string | null;
  changedBy: number;
  createdAt: Date;
  user?: {
    id: number;
    name: string;
    email: string;
    department?: string;
    region?: string;
  };
}

interface ChangeHistoryStats {
  total: number;
  byAction: Record<string, number>;
  byEntityType: Record<string, number>;
  uniqueUsers: number;
}

/**
 * Komponen untuk menampilkan tabel change history
 * Menampilkan siapa mengubah role/policy, kapan, dan perubahan apa
 */
export function ChangeHistoryTable() {
  const [changeHistory, setChangeHistory] = useState<ChangeHistory[]>([]);
  const [stats, setStats] = useState<ChangeHistoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { accessToken } = useAuth();
  
  // Filter states
  const [filters, setFilters] = useState({
    entityType: 'all',
    action: 'all',
    changedBy: '',
    entityId: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  /**
   * Mengambil data change history dari API
   */
  const fetchChangeHistory = async () => {
    if (!accessToken) {
      toast.error('Token akses tidak tersedia');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.entityType && filters.entityType !== 'all') params.append('entityType', filters.entityType);
      if (filters.action && filters.action !== 'all') params.append('action', filters.action);
      if (filters.changedBy) params.append('changedBy', filters.changedBy);
      if (filters.entityId) params.append('entityId', filters.entityId);
      
      const queryString = params.toString();
      const url = `/api/audit/change-history${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data change history');
      }
      
      if (result.success && result.data) {
        setChangeHistory(result.data.changes || []);
        setStats(result.data.stats || null);
      } else {
        throw new Error('Format response tidak valid');
      }
    } catch (err) {
      console.error('Error fetching change history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data';
      setError(errorMessage);
      toast.error(errorMessage);
      setChangeHistory([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effect untuk mengambil data saat komponen dimount atau filter berubah
   */
  useEffect(() => {
    fetchChangeHistory();
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
      entityType: 'all',
      action: 'all',
      changedBy: '',
      entityId: ''
    });
    setCurrentPage(1);
  };

  /**
   * Mendapatkan badge variant berdasarkan action
   */
  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
        return 'default';
      case 'update':
        return 'secondary';
      case 'delete':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  /**
   * Mendapatkan icon berdasarkan entity type
   */
  const getEntityIcon = (entityType: string) => {
    switch (entityType.toLowerCase()) {
      case 'user':
        return <UserIcon className="h-4 w-4" />;
      case 'role':
      case 'policy':
        return <ShieldIcon className="h-4 w-4" />;
      default:
        return <HistoryIcon className="h-4 w-4" />;
    }
  };

  /**
   * Format tanggal untuk tampilan
   */
  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd MMM yyyy HH:mm:ss', { locale: id });
  };

  /**
   * Format JSON untuk tampilan yang lebih baik
   */
  const formatJsonValue = (value: string | null) => {
    if (!value) return '-';
    try {
      const parsed = JSON.parse(value);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return value;
    }
  };

  /**
   * Render perbandingan nilai lama dan baru
   */
  const renderValueComparison = (oldValues: string | null, newValues: string | null) => {
    if (!oldValues && !newValues) return <span className="text-muted-foreground">-</span>;
    
    return (
      <div className="space-y-2">
        {oldValues && (
          <div>
            <div className="text-xs font-medium text-red-600 mb-1">Before:</div>
            <pre className="text-xs bg-red-50 text-red-700 p-2 rounded border max-h-20 overflow-y-auto">
              {formatJsonValue(oldValues)}
            </pre>
          </div>
        )}
        {newValues && (
          <div>
            <div className="text-xs font-medium text-green-600 mb-1">After:</div>
            <pre className="text-xs bg-green-50 text-green-700 p-2 rounded border max-h-20 overflow-y-auto">
              {formatJsonValue(newValues)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  // Pagination logic
  const totalPages = Math.ceil(changeHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentChangeHistory = changeHistory.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HistoryIcon className="h-5 w-5" />
            Change History
          </CardTitle>
          <CardDescription>Memuat data change history...</CardDescription>
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
            <HistoryIcon className="h-5 w-5" />
            Change History
          </CardTitle>
          <CardDescription>Terjadi kesalahan saat memuat data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchChangeHistory} variant="outline">
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
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Changes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">Active Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm space-y-1">
                {Object.entries(stats.byAction || {}).map(([action, count]) => (
                  <div key={action} className="flex justify-between">
                    <span className="capitalize">{action}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">By Action</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm space-y-1">
                {Object.entries(stats.byEntityType || {}).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className="capitalize">{type}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">By Entity</p>
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
                <HistoryIcon className="h-5 w-5" />
                Change History
              </CardTitle>
              <CardDescription>
                Tracking perubahan role, policy, dan entitas lainnya
              </CardDescription>
            </div>
            <Button onClick={fetchChangeHistory} variant="outline" size="sm">
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
            
            <Select value={filters.entityType} onValueChange={(value) => handleFilterChange('entityType', value)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Entity Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="role">Role</SelectItem>
                <SelectItem value="policy">Policy</SelectItem>
                <SelectItem value="feature">Feature</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="delete">Delete</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Changed By ID..."
              value={filters.changedBy}
              onChange={(e) => handleFilterChange('changedBy', e.target.value)}
              className="w-32"
              type="number"
            />
            
            <Input
              placeholder="Entity ID..."
              value={filters.entityId}
              onChange={(e) => handleFilterChange('entityId', e.target.value)}
              className="w-28"
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
                  <TableHead>Entity</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Changed By</TableHead>
                  <TableHead className="w-96">Changes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentChangeHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada data change history
                    </TableCell>
                  </TableRow>
                ) : (
                  currentChangeHistory.map((change) => (
                    <TableRow key={change.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(change.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getEntityIcon(change.entityType)}
                          <div>
                            <div className="font-medium capitalize">{change.entityType}</div>
                            <div className="text-xs text-muted-foreground">ID: {change.entityId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getActionBadgeVariant(change.action)}>
                          {change.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {change.user ? (
                          <div>
                            <div className="font-medium">{change.user.name}</div>
                            <div className="text-xs text-muted-foreground">{change.user.email}</div>
                            {(change.user.department || change.user.region) && (
                              <div className="text-xs text-muted-foreground">
                                {change.user.department && `Dept: ${change.user.department}`}
                                {change.user.region && ` | Region: ${change.user.region}`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">User ID: {change.changedBy}</span>
                        )}
                      </TableCell>
                      <TableCell className="max-w-96">
                        {renderValueComparison(change.oldValues, change.newValues)}
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
                Menampilkan {startIndex + 1}-{Math.min(endIndex, changeHistory.length)} dari {changeHistory.length} data
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