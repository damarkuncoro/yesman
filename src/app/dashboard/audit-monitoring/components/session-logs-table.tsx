"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/ui/table";
import { Badge } from "@/components/shadcn/ui/badge";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/shadcn/ui/select";
import { UserIcon, FilterIcon, RefreshCwIcon, ClockIcon, LogInIcon, LogOutIcon, ShieldOffIcon, ActivityIcon, ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SessionLog {
  id: number;
  userId: number;
  sessionId: string;
  action: string; // 'login', 'logout', 'token_refresh', 'token_revoke'
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  reason: string | null;
  createdAt: Date;
  user?: {
    id: number;
    name: string;
    email: string;
    department?: string;
    region?: string;
  };
}

interface SessionStats {
  total: number;
  byAction: Record<string, number>;
  successRate: number;
  uniqueUsers: number;
  uniqueIPs: number;
}

/**
 * Komponen untuk menampilkan tabel session logs
 * Menampilkan user login/logout, refresh token revoke
 */
export function SessionLogsTable() {
  const [sessionLogs, setSessionLogs] = useState<SessionLog[]>([]);
  const [stats, setStats] = useState<SessionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { accessToken } = useAuth();
  
  // Filter states
  const [filters, setFilters] = useState({
    action: 'all',
    userId: '',
    success: 'all',
    ipAddress: ''
  });
  
  // Sorting states
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc'); // Default: newest first
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  /**
   * Mengambil data session logs dari API
   */
  const fetchSessionLogs = async () => {
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
      if (filters.action && filters.action !== 'all') params.append('action', filters.action);
      if (filters.userId) params.append('userId', filters.userId);
      if (filters.success && filters.success !== 'all') params.append('success', filters.success);
      if (filters.ipAddress) params.append('ipAddress', filters.ipAddress);
      
      const queryString = params.toString();
      const url = `/api/audit/session-logs${queryString ? `?${queryString}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil data session logs');
      }
      
      // Handle response structure: sessions and stats are directly in response
      if (result.sessions !== undefined && result.stats !== undefined) {
        setSessionLogs(result.sessions || []);
        setStats(result.stats || null);
      } else {
        throw new Error('Format response tidak valid');
      }
    } catch (err) {
      console.error('Error fetching session logs:', err);
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data';
      setError(errorMessage);
      toast.error(errorMessage);
      setSessionLogs([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Effect untuk mengambil data saat komponen dimount atau filter berubah
   */
  useEffect(() => {
    fetchSessionLogs();
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
      action: 'all',
      userId: '',
      success: 'all',
      ipAddress: ''
    });
    setCurrentPage(1);
  };

  /**
   * Handler untuk mengubah urutan sorting berdasarkan tanggal
   */
  const handleSortToggle = () => {
    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    setCurrentPage(1); // Reset ke halaman pertama saat sorting berubah
  };

  /**
   * Mengurutkan session logs berdasarkan tanggal
   */
  const sortedSessionLogs = [...sessionLogs].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  /**
   * Mendapatkan badge variant berdasarkan action
   */
  const getActionBadgeVariant = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return 'default';
      case 'logout':
        return 'secondary';
      case 'token_refresh':
        return 'outline';
      case 'token_revoke':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  /**
   * Mendapatkan icon berdasarkan action
   */
  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return <LogInIcon className="h-4 w-4" />;
      case 'logout':
        return <LogOutIcon className="h-4 w-4" />;
      case 'token_refresh':
        return <RefreshCwIcon className="h-4 w-4" />;
      case 'token_revoke':
        return <ShieldOffIcon className="h-4 w-4" />;
      default:
        return <ActivityIcon className="h-4 w-4" />;
    }
  };

  /**
   * Format tanggal untuk tampilan
   */
  const formatDate = (date: Date) => {
    return format(new Date(date), 'dd MMM yyyy HH:mm:ss', { locale: id });
  };

  /**
   * Format user agent untuk tampilan yang lebih baik
   */
  const formatUserAgent = (userAgent: string | null) => {
    if (!userAgent) return '-';
    
    // Extract browser and OS info
    const browserMatch = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)\/(\d+)/);
    const osMatch = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/);
    
    if (browserMatch && osMatch) {
      return `${browserMatch[1]} ${browserMatch[2]} on ${osMatch[1]}`;
    }
    
    // Fallback to truncated user agent
    return userAgent.length > 50 ? `${userAgent.substring(0, 50)}...` : userAgent;
  };

  /**
   * Format action text untuk tampilan
   */
  const formatActionText = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
        return 'Login';
      case 'logout':
        return 'Logout';
      case 'token_refresh':
        return 'Token Refresh';
      case 'token_revoke':
        return 'Token Revoke';
      default:
        return action;
    }
  };

  // Pagination logic with sorted data
  const totalPages = Math.ceil(sortedSessionLogs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSessionLogs = sortedSessionLogs.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Session Logs
          </CardTitle>
          <CardDescription>Memuat data session logs...</CardDescription>
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
            <ActivityIcon className="h-5 w-5" />
            Session Logs
          </CardTitle>
          <CardDescription>Terjadi kesalahan saat memuat data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchSessionLogs} variant="outline">
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
              <p className="text-xs text-muted-foreground">Total Sessions</p>
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
              <div className="text-2xl font-bold">{stats.uniqueIPs}</div>
              <p className="text-xs text-muted-foreground">Unique IPs</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.successRate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Success Rate</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm space-y-1">
                {Object.entries(stats.byAction).map(([action, count]) => (
                  <div key={action} className="flex justify-between">
                    <span className="capitalize">{formatActionText(action)}:</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">By Action</p>
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
                <ActivityIcon className="h-5 w-5" />
                Session Logs
              </CardTitle>
              <CardDescription>
                User login/logout, refresh token, dan token revoke
              </CardDescription>
            </div>
            <Button onClick={fetchSessionLogs} variant="outline" size="sm">
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
            
            <Select value={filters.action} onValueChange={(value) => handleFilterChange('action', value)}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="login">Login</SelectItem>
                <SelectItem value="logout">Logout</SelectItem>
                <SelectItem value="token_refresh">Token Refresh</SelectItem>
                <SelectItem value="token_revoke">Token Revoke</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filters.success} onValueChange={(value) => handleFilterChange('success', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua</SelectItem>
                <SelectItem value="true">Success</SelectItem>
                <SelectItem value="false">Failed</SelectItem>
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
              placeholder="IP Address..."
              value={filters.ipAddress}
              onChange={(e) => handleFilterChange('ipAddress', e.target.value)}
              className="w-32"
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
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleSortToggle}
                      className="h-auto p-0 font-medium hover:bg-transparent"
                    >
                      <div className="flex items-center gap-1">
                        Waktu
                        {sortOrder === 'desc' ? (
                          <ArrowDownIcon className="h-4 w-4" />
                        ) : (
                          <ArrowUpIcon className="h-4 w-4" />
                        )}
                      </div>
                    </Button>
                  </TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>User Agent</TableHead>
                  <TableHead>Session ID</TableHead>
                  <TableHead>Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentSessionLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Tidak ada data session logs
                    </TableCell>
                  </TableRow>
                ) : (
                  currentSessionLogs.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-mono text-xs">
                        {formatDate(session.createdAt)}
                      </TableCell>
                      <TableCell>
                        {session.user ? (
                          <div>
                            <div className="font-medium">{session.user.name}</div>
                            <div className="text-xs text-muted-foreground">{session.user.email}</div>
                            {(session.user.department || session.user.region) && (
                              <div className="text-xs text-muted-foreground">
                                {session.user.department && `Dept: ${session.user.department}`}
                                {session.user.region && ` | Region: ${session.user.region}`}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">User ID: {session.userId}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getActionIcon(session.action)}
                          <Badge variant={getActionBadgeVariant(session.action)}>
                            {formatActionText(session.action)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={session.success ? 'default' : 'destructive'}>
                          {session.success ? 'Success' : 'Failed'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {session.ipAddress || '-'}
                        </code>
                      </TableCell>
                      <TableCell className="max-w-48">
                        <div className="text-xs text-muted-foreground truncate" title={session.userAgent || ''}>
                          {formatUserAgent(session.userAgent)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-muted px-2 py-1 rounded">
                          {session.sessionId.substring(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        {session.reason ? (
                          <div className="text-xs text-muted-foreground max-w-32 truncate" title={session.reason}>
                            {session.reason}
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
                Menampilkan {startIndex + 1}-{Math.min(endIndex, sortedSessionLogs.length)} dari {sortedSessionLogs.length} data
                <span className="ml-2 text-xs text-muted-foreground/70">
                  (Diurutkan: {sortOrder === 'desc' ? 'Terbaru → Terlama' : 'Terlama → Terbaru'})
                </span>
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