'use client';

import { useState, useEffect } from 'react';
import { IconActivity, IconEye, IconClock } from '@tabler/icons-react';
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


/**
 * Interface untuk data akses fitur
 */
interface FeatureAccess {
  featureName: string;
  accessCount: number;
  percentage: number;
  lastAccessed: string;
}

/**
 * Interface untuk props komponen FeatureAccessChart
 */
interface FeatureAccessChartProps {
  className?: string;
}

/**
 * Komponen untuk menampilkan chart fitur yang paling sering diakses
 * Menampilkan data dalam bentuk tabel dengan progress bar dan trend
 */
export function FeatureAccessChart({ className = '' }: FeatureAccessChartProps) {
  const [featureAccessData, setFeatureAccessData] = useState<FeatureAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);



  /**
   * Fetch data akses fitur dari API
   */
  const fetchFeatureAccessData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/dashboard/feature-access-stats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setFeatureAccessData(result.data);
      } else {
        throw new Error(result.message || 'Gagal mengambil data statistik akses feature');
      }
    } catch (err) {
      console.error('Error fetching feature access data:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data statistik');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatureAccessData();
  }, []);

  /**
   * Format tanggal untuk display
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Render progress bar berdasarkan persentase
   */
  const renderProgressBar = (percentage: number) => {
    return (
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    );
  };

  /**
   * Render badge untuk access count
   */
  const renderAccessBadge = (accessCount: number) => {
    let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
    
    if (accessCount > 500) {
      variant = 'default'; // High access
    } else if (accessCount > 200) {
      variant = 'secondary'; // Medium access
    } else {
      variant = 'outline'; // Low access
    }

    return (
      <Badge variant={variant} className="text-xs">
        {accessCount.toLocaleString()}
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
            {[...Array(6)].map((_, index) => (
              <div key={`feature-loading-${index}`} className="flex items-center space-x-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-2 bg-gray-200 rounded flex-1"></div>
                <div className="h-4 bg-gray-200 rounded w-16"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IconActivity className="size-5" />
          Fitur Paling Sering Diakses
        </CardTitle>
        <CardDescription>
          Statistik penggunaan fitur dalam 30 hari terakhir
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Top 3 Features - Highlighted */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {featureAccessData.slice(0, 3).map((feature, index) => (
              <div key={feature.featureName} className="p-4 border rounded-lg bg-gradient-to-br from-primary/5 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-white' : 
                      index === 1 ? 'bg-gray-400 text-white' : 
                      'bg-orange-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-sm">{feature.featureName}</span>
                  </div>
                  <IconClock className="size-4 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Akses</span>
                    <span className="font-semibold">{feature.accessCount.toLocaleString()}</span>
                  </div>
                  {renderProgressBar(feature.percentage)}
                  <div className="flex justify-between items-center">
                    {renderAccessBadge(feature.accessCount)}
                    <span className="text-xs text-muted-foreground">
                      {formatDate(feature.lastAccessed)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* All Features Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">Rank</TableHead>
                  <TableHead>Fitur</TableHead>
                  <TableHead className="text-right">Akses</TableHead>
                  <TableHead className="text-right">Persentase</TableHead>
                  <TableHead className="text-right">Terakhir Diakses</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {featureAccessData.map((feature, index) => (
                  <TableRow key={feature.featureName}>
                    <TableCell className="font-medium">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-yellow-500 text-white' : 
                        index === 1 ? 'bg-gray-400 text-white' : 
                        index === 2 ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <IconEye className="size-4 text-muted-foreground" />
                        <span className="font-medium">{feature.featureName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {renderAccessBadge(feature.accessCount)}
                    </TableCell>
                    <TableCell className="text-right">
                       <div className="flex items-center justify-end gap-2">
                         <div className="w-16 bg-gray-200 rounded-full h-2">
                           <div 
                             className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                             style={{ width: `${feature.percentage}%` }}
                           ></div>
                         </div>
                         <span className="text-sm font-medium">{feature.percentage}%</span>
                       </div>
                     </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <IconClock className="size-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(feature.lastAccessed)}
                        </span>
                      </div>
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

export default FeatureAccessChart;