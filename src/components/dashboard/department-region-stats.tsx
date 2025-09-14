'use client';

import { useState, useEffect } from 'react';
import { IconBuilding, IconMapPin, IconUsers, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/shadcn/ui/tabs';

/**
 * Interface untuk data statistik department
 */
interface DepartmentStats {
  department: string;
  userCount: number;
  accessCount: number;
  deniedCount: number;
  successRate: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

/**
 * Interface untuk data statistik region
 */
interface RegionStats {
  regionName: string;
  userCount: number;
  departmentCount: number;
  accessCount: number;
  deniedCount: number;
  successRate: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

/**
 * Interface untuk props komponen DepartmentRegionStats
 */
interface DepartmentRegionStatsProps {
  className?: string;
}

/**
 * Komponen untuk menampilkan statistik per department dan region
 * Menampilkan data dalam bentuk tabs dengan tabel dan chart
 */
export function DepartmentRegionStats({ className = '' }: DepartmentRegionStatsProps) {
  const [departmentStats, setDepartmentStats] = useState<DepartmentStats[]>([]);
  const [regionStats, setRegionStats] = useState<RegionStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  /**
   * Fetch data statistik department dan region
   */
  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [departmentResponse, regionResponse] = await Promise.all([
        fetch('/api/dashboard/department-stats'),
        fetch('/api/dashboard/region-stats')
      ]);
      
      if (!departmentResponse.ok || !regionResponse.ok) {
        throw new Error('Gagal mengambil data statistik');
      }
      
      const departmentData = await departmentResponse.json();
      const regionData = await regionResponse.json();
      
      // API mengembalikan array langsung, bukan objek dengan property departmentStats
      setDepartmentStats(Array.isArray(departmentData) ? departmentData : []);
      setRegionStats(Array.isArray(regionData) ? regionData : []);
    } catch (error) {
      console.error('Error fetching department/region stats:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan saat mengambil data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  /**
   * Render icon trend berdasarkan status
   */
  const renderTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <IconTrendingUp className="size-4 text-green-600" />;
      case 'down':
        return <IconTrendingDown className="size-4 text-red-600" />;
      default:
        return <div className="size-4 rounded-full bg-gray-400" />;
    }
  };

  /**
   * Render badge success rate dengan warna berdasarkan nilai
   */
  const renderSuccessRateBadge = (rate: number) => {
    let colorClass = 'bg-green-100 text-green-800';
    if (rate < 95) colorClass = 'bg-red-100 text-red-800';
    else if (rate < 98) colorClass = 'bg-yellow-100 text-yellow-800';
    
    return (
      <Badge variant="secondary" className={colorClass}>
        {rate.toFixed(1)}%
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="flex items-center space-x-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <IconBuilding className="size-5" />
            Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <button
            onClick={fetchStats}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Coba Lagi
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconBuilding className="size-5" />
          Statistik Department & Region
        </CardTitle>
        <CardDescription>
          Analisis penggunaan sistem berdasarkan department dan wilayah geografis
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="departments" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="departments" className="flex items-center gap-2">
              <IconBuilding className="size-4" />
              Department
            </TabsTrigger>
            <TabsTrigger value="regions" className="flex items-center gap-2">
              <IconMapPin className="size-4" />
              Region
            </TabsTrigger>
          </TabsList>

          {/* Department Stats */}
          <TabsContent value="departments" className="space-y-4">
            {/* Department Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <IconBuilding className="size-5 text-blue-600" />
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">Total</Badge>
                </div>
                <div className="text-2xl font-bold text-blue-600">{departmentStats.length}</div>
                <div className="text-sm text-muted-foreground">Total Department</div>
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-br from-green-50 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <IconUsers className="size-5 text-green-600" />
                  <Badge variant="secondary" className="bg-green-100 text-green-800">Users</Badge>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {departmentStats.reduce((sum, dept) => sum + dept.userCount, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-br from-purple-50 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <IconTrendingUp className="size-5 text-purple-600" />
                  <Badge variant="secondary" className="bg-purple-100 text-purple-800">Avg</Badge>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  {(departmentStats.reduce((sum, dept) => sum + dept.successRate, 0) / departmentStats.length).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Success Rate</div>
              </div>
            </div>

            {/* Department Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                      <TableHead>Department</TableHead>
                      <TableHead className="text-right">Total Users</TableHead>
                      <TableHead className="text-right">Total Akses</TableHead>
                      <TableHead className="text-right">Ditolak</TableHead>
                      <TableHead className="text-right">Success Rate</TableHead>
                      <TableHead className="text-right">Trend</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                  {departmentStats.map((dept) => (
                    <TableRow key={dept.department}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <IconBuilding className="size-4 text-blue-600" />
                      <span className="font-medium">{dept.department}</span>
                    </div>
                  </TableCell>
                      <TableCell className="text-right font-semibold">
                        {dept.userCount}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {dept.accessCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive" className="text-xs">
                          {dept.deniedCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {renderSuccessRateBadge(dept.successRate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {renderTrendIcon(dept.trend)}
                          <span className={`text-sm font-medium ${
                            dept.trend === 'up' ? 'text-green-600' : 
                            dept.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {dept.trend === 'up' ? '+' : dept.trend === 'down' ? '' : ''}{dept.trendValue}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Region Stats */}
          <TabsContent value="regions" className="space-y-4">
            {/* Region Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-gradient-to-br from-orange-50 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <IconMapPin className="size-5 text-orange-600" />
                  <Badge variant="secondary" className="bg-orange-100 text-orange-800">Total</Badge>
                </div>
                <div className="text-2xl font-bold text-orange-600">{regionStats.length}</div>
                <div className="text-sm text-muted-foreground">Total Region</div>
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-br from-teal-50 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <IconUsers className="size-5 text-teal-600" />
                  <Badge variant="secondary" className="bg-teal-100 text-teal-800">Users</Badge>
                </div>
                <div className="text-2xl font-bold text-teal-600">
                  {regionStats.reduce((sum, region) => sum + region.userCount, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Users</div>
              </div>

              <div className="p-4 border rounded-lg bg-gradient-to-br from-indigo-50 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <IconTrendingUp className="size-5 text-indigo-600" />
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-800">Avg</Badge>
                </div>
                <div className="text-2xl font-bold text-indigo-600">
                  {(regionStats.reduce((sum, region) => sum + region.successRate, 0) / regionStats.length).toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Avg Success Rate</div>
              </div>
            </div>

            {/* Region Table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead className="text-right">Users</TableHead>
                    <TableHead className="text-right">Departments</TableHead>
                    <TableHead className="text-right">Total Akses</TableHead>
                    <TableHead className="text-right">Ditolak</TableHead>
                    <TableHead className="text-right">Success Rate</TableHead>
                    <TableHead className="text-right">Trend</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {regionStats.map((region) => (
                    <TableRow key={region.regionName}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <IconMapPin className="size-4 text-muted-foreground" />
                          <span className="font-medium">{region.regionName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {region.userCount}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{region.departmentCount}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {region.accessCount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="destructive" className="text-xs">
                          {region.deniedCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {renderSuccessRateBadge(region.successRate)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {renderTrendIcon(region.trend)}
                          <span className={`text-sm font-medium ${
                            region.trend === 'up' ? 'text-green-600' : 
                            region.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {region.trend === 'up' ? '+' : region.trend === 'down' ? '' : ''}{region.trendValue}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default DepartmentRegionStats;