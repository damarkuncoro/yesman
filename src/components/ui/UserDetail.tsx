"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardContent } from "./Card";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Input } from "./Input";
import { RoleManager } from "./RoleManager";

/**
 * Interface untuk user data lengkap
 */
interface UserDetailData {
  id: number;
  name: string;
  email: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  roles: {
    id: string;
    name: string;
    description?: string;
  }[];
  permissions: {
    featureId: string;
    featureName: string;
    featureDescription: string;
  }[];
}

/**
 * Props untuk UserDetail component
 */
interface UserDetailProps {
  userId: number;
  onBack: () => void;
  className?: string;
}

/**
 * Utility function untuk format tanggal
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Tanggal tidak valid';
  }
}

/**
 * Pure UI component untuk menampilkan detail user
 * Mengikuti prinsip Single Responsibility - hanya menangani UI dan display logic
 */
export function UserDetail({ userId, onBack, className = "" }: UserDetailProps) {
  const { accessToken } = useAuth();
  const [userData, setUserData] = useState<UserDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    active: true
  });
  const [isUpdating, setIsUpdating] = useState(false);

  /**
   * Fetch detail user dari API
   */
  const fetchUserDetail = async () => {
    try {
      setIsLoading(true);
      setError("");

      const response = await fetch(`/api/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setUserData(result.data.user);
        setFormData({
          name: result.data.user.name,
          email: result.data.user.email,
          active: result.data.user.active
        });
      } else {
        throw new Error(result.message || 'Gagal mengambil data user');
      }
    } catch (err) {
      console.error('Error fetching user detail:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil data user');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handler untuk update user
   */
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsUpdating(true);
      setError("");

      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        await fetchUserDetail(); // Refresh data
        setIsEditing(false);
      } else {
        throw new Error(result.message || 'Gagal mengupdate user');
      }
    } catch (err) {
      console.error('Error updating user:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengupdate user');
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Handler untuk input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  /**
   * Effect untuk fetch data saat component mount
   */
  useEffect(() => {
    fetchUserDetail();
  }, [userId]);

  // Loading state
  if (isLoading) {
    return (
      <Card variant="elevated" padding="xl" className={`text-center ${className}`}>
        <CardContent>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat detail user...</p>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card variant="elevated" padding="xl" className={`text-center ${className}`}>
        <CardContent>
          <div className="text-red-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Terjadi Kesalahan</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="flex justify-center space-x-3">
            <Button onClick={fetchUserDetail} variant="primary">
              Coba Lagi
            </Button>
            <Button onClick={onBack} variant="secondary">
              Kembali
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // No data state
  if (!userData) {
    return (
      <Card variant="elevated" padding="xl" className={`text-center ${className}`}>
        <CardContent>
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">User Tidak Ditemukan</h3>
          <p className="text-gray-600 mb-4">User dengan ID {userId} tidak ditemukan dalam sistem.</p>
          <Button onClick={onBack} variant="primary">
            Kembali
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card variant="elevated" padding="lg">
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={onBack} variant="secondary" size="sm">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                Kembali
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Detail User</h1>
                <p className="text-gray-600">Informasi lengkap user {userData.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge 
                variant={userData.active ? "success" : "error"}
                size="md"
              >
                {userData.active ? "Aktif" : "Tidak Aktif"}
              </Badge>
              {!isEditing && (
                <Button onClick={() => setIsEditing(true)} variant="primary" size="sm">
                  Edit User
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* User Information */}
      <Card variant="elevated" padding="lg">
        <CardHeader title="Informasi User" />
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nama</label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama user"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Masukkan email user"
                    required
                  />
                </div>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  name="active"
                  checked={formData.active}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                  User aktif
                </label>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: userData.name,
                      email: userData.email,
                      active: userData.active
                    });
                  }}
                  variant="secondary"
                  disabled={isUpdating}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isUpdating}
                  loading={isUpdating}
                >
                  Simpan
                </Button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                <p className="text-gray-900 font-medium">{userData.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-gray-900 font-medium">{userData.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID User</label>
                <p className="text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded">{userData.id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Badge variant={userData.active ? "success" : "error"} size="sm">
                  {userData.active ? "Aktif" : "Tidak Aktif"}
                </Badge>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Bergabung</label>
                <p className="text-gray-900">{formatDate(userData.createdAt)}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Terakhir Diperbarui</label>
                <p className="text-gray-900">{formatDate(userData.updatedAt)}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Roles and Permissions */}
      <Card variant="elevated" padding="lg">
        <CardHeader title="Role & Hak Akses" subtitle="Kelola role dan permission user" />
        <CardContent>
          <RoleManager userId={userData.id} />
        </CardContent>
      </Card>
    </div>
  );
}