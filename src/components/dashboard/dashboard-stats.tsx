'use client';

import { useState, useEffect } from 'react';
import { IconUsers, IconShield, IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import { Badge } from '@/components/shadcn/ui/badge';
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/shadcn/ui/card';

/**
 * Interface untuk data statistik user per role
 */
interface UserRoleStats {
  roleName: string;
  userCount: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
}

/**
 * Interface untuk ringkasan dashboard
 */
interface DashboardSummary {
  totalUsers: number;
  totalRoles: number;
  totalFeatures: number;
  activeUsers: number;
  inactiveUsers: number;
}

/**
 * Interface untuk props komponen DashboardStats
 */
interface DashboardStatsProps {
  className?: string;
}

/**
 * Komponen untuk menampilkan statistik ringkasan jumlah user per role
 * Menampilkan data dalam bentuk card dengan trend dan persentase
 */
export function DashboardStats({ className = '' }: DashboardStatsProps) {
  const [userRoleStats, setUserRoleStats] = useState<UserRoleStats[]>([]);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch data statistik user per role dari API
   */
  const fetchUserRoleStats = async () => {
    try {
      const response = await fetch('/api/dashboard/user-role-stats', {
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
        setUserRoleStats(result.data);
      } else {
        throw new Error(result.message || 'Gagal mengambil data statistik user per role');
      }
    } catch (err) {
      console.error('Error fetching user role stats:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data statistik');
    }
  };

  /**
   * Fetch data ringkasan dashboard dari API
   */
  const fetchDashboardSummary = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
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
        setDashboardSummary(result.data);
      } else {
        throw new Error(result.message || 'Gagal mengambil data ringkasan dashboard');
      }
    } catch (err) {
      console.error('Error fetching dashboard summary:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data ringkasan');
    }
  };

  /**
   * Fetch semua data dashboard
   */
  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchUserRoleStats(),
        fetchDashboardSummary()
      ]);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  /**
   * Render icon trend berdasarkan status
   */
  const renderTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return <IconTrendingUp className="size-4" />;
      case 'down':
        return <IconTrendingDown className="size-4" />;
      default:
        return null;
    }
  };

  /**
   * Render badge trend dengan warna yang sesuai
   */
  const renderTrendBadge = (trend: 'up' | 'down' | 'stable', value: number) => {
    const variant = trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary';
    const sign = trend === 'up' ? '+' : trend === 'down' ? '' : '';
    
    return (
      <Badge variant="outline" className={trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600'}>
        {renderTrendIcon(trend)}
        {sign}{value}%
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className={`grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 ${className}`}>
        {[...Array(4)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={`grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 ${className}`}>
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardFooter>
            <button 
              onClick={fetchAllData}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Coba Lagi
            </button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 ${className}`}>
      {/* Total Users Card */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
            <IconUsers className="size-6" />
            {(dashboardSummary?.totalUsers || 0).toLocaleString()}
          </CardTitle>
          <CardAction>
            <Badge variant="outline" className="text-blue-600">
              <IconTrendingUp className="size-4" />
              Active
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total registered users <IconUsers className="size-4" />
          </div>
          <div className="text-muted-foreground">
            Across all roles and departments
          </div>
        </CardFooter>
      </Card>

      {/* User Role Stats Cards */}
      {userRoleStats.map((stat) => (
        <Card key={stat.roleName} className="@container/card">
          <CardHeader>
            <CardDescription>{stat.roleName} Role</CardDescription>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl flex items-center gap-2">
              <IconShield className="size-6" />
              {stat.userCount}
            </CardTitle>
            <CardAction>
              {renderTrendBadge(stat.trend, stat.trendValue)}
            </CardAction>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              {stat.percentage}% of total users {renderTrendIcon(stat.trend)}
            </div>
            <div className="text-muted-foreground">
              {stat.trend === 'up' ? 'Growing' : stat.trend === 'down' ? 'Declining' : 'Stable'} this month
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

export default DashboardStats;