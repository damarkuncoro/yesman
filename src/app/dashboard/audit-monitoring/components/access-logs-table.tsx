"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/ui/table";
import { Badge } from "@/components/shadcn/ui/badge";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/ui/select";
import { CalendarIcon, FilterIcon, RefreshCwIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

interface AccessLog {
  id: number;
  userId: number | null;
  roleId: number | null;
  featureId: number | null;
  path: string;
  method: string | null;
  decision: 'allow' | 'deny';
  reason: string | null;
  createdAt: Date;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  role?: {
    id: number;
    name: string;
  };
  feature?: {
    id: number;
    name: string;
  };
}

interface AccessLogsStats {
  total: number;
  allowed: number;
  denied: number;
  uniqueUsers: number;
  uniquePaths: number;
}

/**
 * Komponen untuk menampilkan tabel access logs dengan fitur filtering dan statistik
 * Menampilkan semua request user dengan role, path, dan hasil (allow/deny)
 */
export function AccessLogsTable() {
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [stats, setStats] = useState<AccessLogsStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [filters, setFilters] = useState({
    decision: '',
    pathPattern: '',
    userId: '',
    roleId: ''
  });
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  /**
   * Mengambil data access logs dari API
   */
  const fetchAccessLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.decision) params.append('decision', filters.decision);
      if (filters.pathPattern) params.append('pathPattern', filters.pathPattern);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.roleId) params.append('roleId', filters.roleId);
      
      const queryString = params.toString();
      const url = `/api/audit/access-logs${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAccessLogs(data.accessLogs || []);
      setStats(data.stats || null);
    } catch (err) {
      console.error('Error fetching access logs:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effect untuk mengambil data saat komponen dimount atau filter berubah
   */
  useEffect(() => {
    fetchAccessLogs();
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
      decision: '',
      pathPattern: '',
      userId: '',
      roleId: ''
    });
    setCurrentPage(1);
  };

  /**
   * Mendapatkan badge variant berdasarkan decision
   */
  const getDecisionBadgeVariant = (decision: string) => {
    return decision === 'allow' ? 'default' : 'destructive';
  };

  /**
   * Format tanggal untuk tampilan
   */
  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd MMM yyyy HH:mm:ss', { locale: id });
  };

  // Pagination logic
  const totalPages = Math.ceil(accessLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAccessLogs = accessLogs.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Access Logs</CardTitle>
          <CardDescription>Memuat data access logs...</CardDescription>
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
          <CardTitle>Access Logs</CardTitle>
          <CardDescription>Terjadi kesalahan saat memuat data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchAccessLogs} variant="outline">
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
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">Total Requests</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.allowed}</div>
              <p className="text-xs text-muted-foreground">Allowed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.denied}</div>
              <p className="text-xs text-muted-foreground">Denied</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.uniqueUsers}</div>
              <p className="text-xs text-muted-foreground">Unique Users</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{stats.uniquePaths}</div>
              <p className="text-xs text-muted-foreground">Unique Paths</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Access Logs</CardTitle>
              <CardDescription>
                Semua request user dengan role, path, dan hasil (allow/deny)
              </CardDescription>
            </div>
            <Button onClick={fetchAccessLogs} variant="outline" size="sm">
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
            
            <Select value={filters.decision} onValueChange={(value) => handleFilterChange('decision', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Decision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua</SelectItem>
                <SelectItem value="allow">Allow</SelectItem>
                <SelectItem value="deny">Deny</SelectItem>
              </SelectContent>
            </Select>
            
            <Input
              placeholder="Path pattern..."
              value={filters.pathPattern}
              onChange={(e) => handleFilterChange('pathPattern', e.target.value)}
              className="w-40"
            />
            
            <Input
              placeholder="User ID..."
              value={filters.userId}
              onChange={(e) => handleFilterChange('userId', e.target.value)}
              className="w-24"
              type="number"
            />
            
            <Input
              placeholder="Role ID..."
              value={filters.roleId}
              onChange={(e) => handleFilterChange('roleId', e.target.value)}
              className="w-24"
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
                  <TableHead>Role</TableHead>
                  <TableHead>Path</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Feature</TableHead>
                  <TableHead>Decision</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentAccessLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
                      Tidak ada data access logs
                    </TableCell>
                  </TableRow>
                ) : (
                  currentAccessLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        {log.user ? (
                          <div>
                            <div className="font-medium">{log.user.name}</div>
                            <div className="text-xs text-muted-foreground">{log.user.email}</div>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.role ? (
                          <Badge variant="outline">{log.role.name}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {log.path}
                      </TableCell>
                      <TableCell>
                        {log.method ? (
                          <Badge variant="secondary">{log.method}</Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.feature ? (
                          <span className="text-sm">{log.feature.name}</span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getDecisionBadgeVariant(log.decision)}>
                          {log.decision.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {log.reason ? (
                          <span className="text-xs">{log.reason}</span>
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
                Menampilkan {startIndex + 1}-{Math.min(endIndex, accessLogs.length)} dari {accessLogs.length} data
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