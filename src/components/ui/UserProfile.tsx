"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardContent } from "./Card";
import { Input } from "./Input";
import { Button } from "./Button";
import { Badge } from "./Badge";

/**
 * Interface untuk role data
 */
interface Role {
  id: number;
  name: string;
  grantsAll: boolean;
  createdAt: string;
}

/**
 * Interface untuk user role data
 */
interface UserRole {
  id: number;
  userId: number;
  roleId: number;
  role: Role;
}

/**
 * Interface untuk feature permissions
 */
interface UserPermission {
  featureId: string;
  featureName: string;
  featureDescription: string;
}

/**
 * Props untuk UserProfile component
 */
interface UserProfileProps {
  onProfileUpdate?: () => void;
  className?: string;
}

/**
 * Pure UI component untuk menampilkan dan edit profile user
 * Mengikuti prinsip Single Responsibility - hanya menangani UI dan form handling
 */
export function UserProfile({ onProfileUpdate, className = "" }: UserProfileProps) {
  const { user, updateProfile, logout, isLoading, accessToken } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  /**
   * Load user roles dan permissions
   */
  const loadUserRolesAndPermissions = async () => {
    if (!user?.id || !accessToken) return;
    
    try {
      setIsLoadingRoles(true);
      const [rolesResponse, permissionsResponse] = await Promise.all([
        fetch(`/api/rbac/user-roles/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }),
        fetch(`/api/rbac/user-permissions/${user.id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
      ]);
      
      if (!rolesResponse.ok || !permissionsResponse.ok) {
        const rolesError = rolesResponse.ok ? null : await rolesResponse.text();
        const permissionsError = permissionsResponse.ok ? null : await permissionsResponse.text();
        console.error('API Error - Roles:', rolesError, 'Permissions:', permissionsError);
        throw new Error('Failed to fetch user roles or permissions');
      }
      
      const rolesData = await rolesResponse.json();
      const permissionsData = await permissionsResponse.json();
      
      setUserRoles(rolesData.roles || []);
      setUserPermissions(permissionsData.permissions || []);
    } catch (error) {
      console.error('Error loading user roles and permissions:', error);
    } finally {
      setIsLoadingRoles(false);
    }
  };

  /**
   * Effect untuk load roles saat component mount atau user berubah
   */
  useEffect(() => {
    loadUserRolesAndPermissions();
  }, [user?.id]);

  /**
   * Handler untuk toggle edit mode
   */
  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form data saat cancel
      setFormData({
        name: user?.name || "",
        email: user?.email || "",
      });
      setErrors({});
      setSubmitError("");
    }
    setIsEditing(!isEditing);
  };

  /**
   * Handler untuk perubahan input form
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: typeof formData) => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error saat user mulai mengetik
    if (errors[name]) {
      setErrors((prev: Record<string, string>) => ({
        ...prev,
        [name]: "",
      }));
    }
    
    // Clear submit error
    if (submitError) {
      setSubmitError("");
    }
  };

  /**
   * Validasi form di client side
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = "Nama wajib diisi";
    } else if (formData.name.trim().length < 3) {
      newErrors.name = "Nama minimal 3 karakter";
    } else if (formData.name.trim().length > 100) {
      newErrors.name = "Nama maksimal 100 karakter";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handler untuk submit form update profile
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      setIsUpdating(true);
      
      // Hanya kirim data yang berubah
      const updateData: { name?: string; email?: string } = {};
      if (formData.name !== user?.name) {
        updateData.name = formData.name;
      }
      if (formData.email !== user?.email) {
        updateData.email = formData.email;
      }
      
      // Jika tidak ada perubahan
      if (Object.keys(updateData).length === 0) {
        setIsEditing(false);
        return;
      }
      
      await updateProfile(updateData);
      setIsEditing(false);
      onProfileUpdate?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Update profile gagal";
      setSubmitError(errorMessage);
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Handler untuk logout
   */
  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  /**
   * Format tanggal untuk display
   */
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <Card variant="elevated" padding="xl" className={`text-center ${className}`}>
        <CardContent>
          <div className="text-gray-600">
            Tidak ada data user
          </div>
        </CardContent>
      </Card>
    );
  }



  return (
    <div className={`space-y-6 ${className}`}>
      {/* Profile Header Card */}
      <Card variant="elevated" padding="none" className="overflow-hidden">
        <CardHeader 
          title="Profile Saya"
          subtitle="Kelola informasi pribadi dan pengaturan akun Anda"
          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none"
          action={
            <div className="flex items-center space-x-2">
              {!isEditing ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditToggle}
                  disabled={isLoading}
                  className="text-white hover:bg-white/20 border-white/30"
                  leftIcon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  }
                >
                  Edit
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditToggle}
                  disabled={isUpdating}
                  className="text-white hover:bg-white/20 border-white/30"
                  leftIcon={
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  }
                >
                  Batal
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                disabled={isLoading || isUpdating}
                className="text-white hover:bg-red-500/20 border-red-300/30"
                leftIcon={
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                }
              >
                Logout
              </Button>
            </div>
          }
        />
        
        <CardContent className="p-6">
        {submitError && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {submitError}
          </div>
        )}

          {!isEditing ? (
            <div className="space-y-6">
              {/* Avatar Section */}
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  <Badge variant="success" size="sm" className="mt-1">
                    Aktif
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Nama
                  </label>
                  <Input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    variant={errors.name ? "error" : "default"}
                    placeholder="Masukkan nama"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <Input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    variant={errors.email ? "error" : "default"}
                    placeholder="Masukkan email"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                  )}
                </div>
              </div>
              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEditToggle}
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
          )}
        </CardContent>
      </Card>

      {/* Basic Info Card */}
      <Card variant="elevated" padding="lg">
        <CardHeader title="Informasi Dasar" />
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
              <p className="text-gray-900 font-medium">{user.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <p className="text-gray-900 font-medium">{user.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ID User</label>
              <p className="text-gray-900 font-mono text-sm bg-gray-100 px-2 py-1 rounded">{user.id}</p>
            </div>
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Bergabung</label>
               <p className="text-gray-900">{formatDate(user.createdAt)}</p>
             </div>
             <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">Terakhir Diperbarui</label>
               <p className="text-gray-900">{formatDate(user.updatedAt)}</p>
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Roles and Permissions Card */}
      <Card variant="elevated" padding="lg">
        <CardHeader title="Role & Hak Akses" subtitle="Daftar role dan permission yang dimiliki" />
        <CardContent>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Role</label>
              <div className="flex flex-wrap gap-2">
                {userRoles.length > 0 ? (
                  userRoles.map((userRole) => (
                    <Badge
                      key={userRole.id}
                      variant="primary"
                      size="md"
                    >
                      {userRole.role.id} - {userRole.role.name}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm italic">Tidak ada role</span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Hak Akses</label>
              <div className="flex flex-wrap gap-2">
                {userPermissions.length > 0 ? (
                  userPermissions.map((permission) => (
                    <Badge
                      key={permission.featureId}
                      variant="success"
                      size="sm"
                    >
                      {permission.featureName}
                    </Badge>
                  ))
                ) : (
                  <span className="text-gray-500 text-sm italic">Tidak ada hak akses</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}