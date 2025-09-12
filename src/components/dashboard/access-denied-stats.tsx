'use client';

import { useState, useEffect } from 'react';
import { IconShieldX, IconAlertTriangle, IconClock, IconUser } from '@tabler/icons-react';
import { Badge } from '@/components/shadcn/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/shadcn/ui/table';
import { Progress } from '@/components/shadcn/ui/progress';

/**
 * Interface untuk data akses yang ditolak
 */
interface AccessDeniedData {
  id: string;
  userId: string;
  userName: string;
  resource: string;
  action: string;
  reason: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  department: string;
}

/**
 * Interface untuk statistik ringkasan akses ditolak
 */
interface AccessDeniedSummary {
  totalDenied: number;
  todayDenied: number;
  topReason: string;
  topResource: string;
  severityBreakdown: Record<string, number>;
  trendPercentage: number;
}

/**
 * Interface untuk props komponen AccessDeniedStats
 */
interface AccessDeniedStatsProps {
  className?: string;
}

/**
 * Komponen untuk menampilkan statistik akses yang gagal (denied request)
 * Menampilkan ringkasan dan detail akses yang ditolak
 */
export function AccessDeniedStats({ className = '' }: AccessDeniedStatsProps) {
  const [accessDeniedData, setAccessDeniedData] = useState<AccessDeniedData[]>([]);
  const [summary, setSummary] = useState<AccessDeniedSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  /**
   * Fetch data akses yang ditolak dari API
   */
  const fetchAccessDeniedData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/dashboard/access-denied-stats');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAccessDeniedData(data.accessDeniedData || []);
      setSummary(data.summary || null);
    } catch (error) {
      console.error('Error fetching access denied data:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAccessDeniedData();
  }, []);

  /**
   * Render badge severity dengan warna yang sesuai
   */
  const renderSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: { color: 'bg-blue-100 text-blue-800', icon: IconClock },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: IconAlertTriangle },
      high: { color: 'bg-orange-100 text-orange-800', icon: IconShieldX },
      critical: { color: 'bg-red-100 text-red-800', icon: IconShieldX },
    };
    
    const config = severityConfig[severity as keyof typeof severityConfig];
    const Icon = config?.icon || IconAlertTriangle;
    
    return (
      <Badge variant="secondary" className={config?.color || 'bg-gray-100 text-gray-800'}>
        <Icon className="size-3 mr-1" />
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  /**
   * Format timestamp menjadi format yang mudah dibaca
   */
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconShieldX className="size-5" />
            Akses yang Ditolak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconShieldX className="size-5" />
            Akses yang Ditolak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-32 space-y-2">
            <IconAlertTriangle className="size-8 text-destructive" />
            <p className="text-sm text-muted-foreground text-center">{error}</p>
            <button 
              onClick={fetchAccessDeniedData}
              className="text-sm text-primary hover:underline"
            >
              Coba Lagi
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconShieldX className="size-5 text-red-600" />
          Akses yang Ditolak (Denied Requests)
        </CardTitle>
        <CardDescription>
          Monitoring dan analisis akses yang gagal dalam sistem RBAC/ABAC
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="p-4 border rounded-lg bg-gradient-to-br from-red-50 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <IconShieldX className="size-5 text-red-600" />
              <Badge variant="destructive">Total</Badge>
            </div>
            <div className="text-2xl font-bold text-red-600">{summary?.totalDenied || 0}</div>
            <div className="text-sm text-muted-foreground">Total ditolak (30 hari)</div>
          </div>

          <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <IconClock className="size-5 text-orange-600" />
              <Badge variant="secondary" className="bg-orange-100 text-orange-800">Hari Ini</Badge>
            </div>
            <div className="text-2xl font-bold text-orange-600">{summary?.todayDenied || 0}</div>
            <div className="text-sm text-muted-foreground">Ditolak hari ini</div>
          </div>

          <div className="p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <IconAlertTriangle className="size-5 text-yellow-600" />
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Top</Badge>
            </div>
            <div className="text-sm font-semibold text-yellow-600 truncate">{summary?.topReason || 'N/A'}</div>
            <div className="text-sm text-muted-foreground">Alasan utama</div>
          </div>

          <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-transparent">
            <div className="flex items-center justify-between mb-2">
              <IconUser className="size-5 text-blue-600" />
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">Trend</Badge>
            </div>
            <div className="text-2xl font-bold text-blue-600">+{summary?.trendPercentage || 0}%</div>
            <div className="text-sm text-muted-foreground">Vs bulan lalu</div>
          </div>
        </div>

        {/* Severity Breakdown */}
        <div className="mb-6">
          <h4 className="text-sm font-medium mb-3">Breakdown Berdasarkan Tingkat Keparahan</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {summary?.severityBreakdown && Object.entries(summary.severityBreakdown).map(([severity, count]) => {
              const percentage = (summary?.totalDenied || 0) > 0 ? (count / (summary?.totalDenied || 1)) * 100 : 0;
              return (
                <div key={severity} className="p-3 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    {renderSeverityBadge(severity)}
                    <span className="text-sm font-semibold">{count}</span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                  <div className="text-xs text-muted-foreground mt-1">{percentage.toFixed(1)}%</div>
                </div>
              );
            })}
            {(!summary?.severityBreakdown || Object.keys(summary.severityBreakdown).length === 0) && (
              <div className="col-span-full text-center text-muted-foreground py-4">
                Tidak ada data breakdown severity
              </div>
            )}
          </div>
        </div>

        {/* Recent Denied Requests Table */}
        <div>
          <h4 className="text-sm font-medium mb-3">Akses Ditolak Terbaru</h4>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accessDeniedData.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconUser className="size-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{item.userName}</div>
                          <div className="text-xs text-muted-foreground">{item.userId}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.resource}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate" title={item.reason}>
                      {item.reason}
                    </TableCell>
                    <TableCell>
                      {renderSeverityBadge(item.severity)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{item.department}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">
                      {formatTimestamp(item.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default AccessDeniedStats;