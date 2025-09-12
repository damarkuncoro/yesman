'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

/**
 * Interface untuk role
 */
interface Role {
  id: number;
  name: string;
  grantsAll: boolean;
  createdAt: string;
}

/**
 * Interface untuk user role
 */
interface UserRole {
  id: number;
  userId: number;
  roleId: number;
  role: Role;
}

/**
 * Props untuk komponen RoleManager
 */
interface RoleManagerProps {
  userId: number;
  onRoleChange?: () => void;
}

/**
 * Komponen untuk mengelola role user
 * Memungkinkan admin untuk assign/unassign role ke user
 */
export function RoleManager({ userId, onRoleChange }: RoleManagerProps) {
  const { accessToken, user } = useAuth();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<{ [key: number]: boolean }>({});

  // Cek apakah user adalah admin (akan dicek dari API response)
  const [isAdmin, setIsAdmin] = useState(false);

  /**
   * Fetch user roles
   */
  const fetchUserRoles = async () => {
    if (!accessToken) return;
    
    try {
      setIsLoadingRoles(true);
      const response = await fetch(`/api/rbac/users/${userId}/roles`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data role user');
      }
      
      const data = await response.json();
      setUserRoles(data.data || []);
    } catch (error) {
      console.error('Error fetching user roles:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setIsLoadingRoles(false);
    }
  };

  /**
   * Fetch current user roles untuk cek admin
   */
  const fetchCurrentUserRoles = async () => {
    if (!user || !accessToken) return;
    
    try {
      const response = await fetch(`/api/rbac/users/${user.id}/roles`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const currentUserRoles = data.data || [];
        const hasAdminRole = currentUserRoles.some((ur: UserRole) => 
          ur.role && (ur.role.name === 'admin' || ur.role.grantsAll)
        );
        setIsAdmin(hasAdminRole);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  /**
   * Fetch available roles
   */
  const fetchAvailableRoles = async () => {
    if (!accessToken || !isAdmin) return;
    
    try {
      setIsLoading(true);
      const response = await fetch('/api/rbac/roles', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Gagal mengambil data role');
      }
      
      const data = await response.json();
      setAvailableRoles(data.data || []);
    } catch (error) {
      console.error('Error fetching available roles:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Assign role ke user
   */
  const handleAssignRole = async (roleId: number) => {
    if (!accessToken || !isAdmin) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [roleId]: true }));
      const response = await fetch(`/api/rbac/users/${userId}/roles/assign`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roleId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal assign role');
      }
      
      // Refresh data
      await fetchUserRoles();
      onRoleChange?.();
    } catch (error) {
      console.error('Error assigning role:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setActionLoading(prev => ({ ...prev, [roleId]: false }));
    }
  };

  /**
   * Unassign role dari user
   */
  const handleUnassignRole = async (roleId: number) => {
    if (!accessToken || !isAdmin) return;
    
    try {
      setActionLoading(prev => ({ ...prev, [roleId]: true }));
      const response = await fetch(`/api/rbac/users/${userId}/roles/unassign`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ roleId })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Gagal unassign role');
      }
      
      // Refresh data
      await fetchUserRoles();
      onRoleChange?.();
    } catch (error) {
      console.error('Error unassigning role:', error);
      setError(error instanceof Error ? error.message : 'Terjadi kesalahan');
    } finally {
      setActionLoading(prev => ({ ...prev, [roleId]: false }));
    }
  };

  /**
   * Cek apakah user sudah memiliki role tertentu
   */
  const hasRole = (roleId: number): boolean => {
    return userRoles.some(userRole => userRole.roleId === roleId);
  };

  // Load data saat komponen mount
  useEffect(() => {
    fetchUserRoles();
    fetchCurrentUserRoles();
  }, [userId, accessToken, user]);

  // Load available roles ketika sudah jadi admin
  useEffect(() => {
    if (isAdmin) {
      fetchAvailableRoles();
    }
  }, [isAdmin]);

  // Jika bukan admin, hanya tampilkan role yang dimiliki user
  if (!isAdmin) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Role & Hak Akses</h3>
        
        {isLoadingRoles ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat role...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {userRoles.length > 0 ? (
              userRoles.map((userRole) => (
                <Badge 
                      key={userRole.id}
                      variant={userRole.role?.grantsAll ? 'error' : 'default'}
                      className="mr-2"
                    >
                      {userRole.role?.name || 'Unknown Role'}
                      {userRole.role?.grantsAll && ' (Super Admin)'}
                    </Badge>
              ))
            ) : (
              <p className="text-gray-500">Tidak ada role yang ditemukan</p>
            )}
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Kelola Role & Hak Akses</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button 
            onClick={() => setError(null)}
            className="float-right text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Role yang dimiliki user */}
      <div className="mb-6">
        <h4 className="font-medium mb-2">Role Saat Ini:</h4>
        {isLoadingRoles ? (
          <div className="text-center py-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : (
          <div className="space-y-2">
            {userRoles.length > 0 ? (
              userRoles.map((userRole) => (
                <div key={userRole.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={userRole.role?.grantsAll ? 'error' : 'default'}
                    >
                      {userRole.role?.name || 'Unknown Role'}
                      {userRole.role?.grantsAll && ' (Super Admin)'}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnassignRole(userRole.roleId)}
                    disabled={actionLoading[userRole.roleId]}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {actionLoading[userRole.roleId] ? 'Menghapus...' : 'Hapus'}
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-gray-500">Tidak ada role yang ditemukan</p>
            )}
          </div>
        )}
      </div>
      
      {/* Role yang tersedia untuk di-assign */}
      <div>
        <h4 className="font-medium mb-2">Tambah Role:</h4>
        {isLoading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Memuat role...</p>
          </div>
        ) : (
          <div className="space-y-2">
            {availableRoles
              .filter(role => !hasRole(role.id))
              .map((role) => (
                <div key={role.id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                  <div className="flex items-center space-x-2">
                    <Badge 
                      variant={role.grantsAll ? 'error' : 'secondary'}
                    >
                      {role.name}
                      {role.grantsAll && ' (Super Admin)'}
                    </Badge>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAssignRole(role.id)}
                    disabled={actionLoading[role.id]}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    {actionLoading[role.id] ? 'Menambah...' : 'Tambah'}
                  </Button>
                </div>
              ))
            }
            {availableRoles.filter(role => !hasRole(role.id)).length === 0 && (
              <p className="text-gray-500">Semua role sudah di-assign ke user ini</p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}