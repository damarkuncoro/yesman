"use client";

import React, { useEffect, useState } from "react";
import { useUserList } from "@/contexts/UserListContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardHeader, CardContent } from "./Card";
import { Input } from "./Input";
import { Button } from "./Button";
import { Badge } from "./Badge";

/**
 * Props untuk UserList component
 */
interface UserListProps {
  onUserSelect?: (userId: number) => void;
  className?: string;
}

/**
 * Pure UI component untuk menampilkan daftar user
 * Mengikuti prinsip Single Responsibility - hanya menangani UI dan display logic
 */
export function UserList({ onUserSelect, className = "" }: UserListProps) {
  const { users, isLoading, error, fetchUsers, refreshUsers } = useUserList();
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  /**
   * Effect untuk fetch users saat component mount
   */
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  /**
   * Handler untuk refresh data
   */
  const handleRefresh = async () => {
    await refreshUsers();
  };

  /**
   * Handler untuk select user
   */
  const handleUserClick = (userId: number) => {
    onUserSelect?.(userId);
  };

  /**
   * Filter users berdasarkan search term dan status
   */
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.active) ||
                         (statusFilter === "inactive" && !user.active);
    return matchesSearch && matchesStatus;
  });

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

  /**
   * Render loading state
   */
  if (isLoading && users.length === 0) {
    return (
      <Card variant="elevated" padding="xl" className={`text-center ${className}`}>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Memuat data user...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  /**
   * Render error state
   */
  if (error) {
    return (
      <Card variant="elevated" padding="xl" className={`text-center ${className}`}>
        <CardContent>
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Terjadi Kesalahan</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button
            onClick={handleRefresh}
            variant="primary"
          >
            Coba Lagi
          </Button>
        </CardContent>
      </Card>
    );
  }

  /**
   * Render empty state
   */
  if (users.length === 0) {
    return (
      <Card variant="elevated" padding="xl" className={`text-center ${className}`}>
        <CardContent>
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Belum Ada User</h3>
          <p className="text-gray-600 mb-4">Belum ada user yang terdaftar dalam sistem.</p>
          <Button
            onClick={handleRefresh}
            variant="primary"
          >
            Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  /**
   * Render user list
   */
  return (
    <Card variant="elevated" className={className}>
      {/* Header */}
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Daftar User</h2>
          <div className="flex items-center space-x-2">
            {isLoading && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            <Button
              onClick={handleRefresh}
              disabled={isLoading}
              variant="primary"
              size="sm"
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Filter Controls */}
        <div className="mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Cari berdasarkan nama atau email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setStatusFilter("all")}
                variant={statusFilter === "all" ? "primary" : "secondary"}
                size="sm"
              >
                Semua
              </Button>
              <Button
                onClick={() => setStatusFilter("active")}
                variant={statusFilter === "active" ? "primary" : "secondary"}
                size="sm"
              >
                Aktif
              </Button>
              <Button
                onClick={() => setStatusFilter("inactive")}
                variant={statusFilter === "inactive" ? "primary" : "secondary"}
                size="sm"
              >
                Tidak Aktif
              </Button>
            </div>
          </div>
        </div>

        {/* Results Info */}
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Menampilkan {filteredUsers.length} dari {users.length} user
          </p>
        </div>

        {/* User Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bergabung
                </th>
                <th className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  onClick={() => handleUserClick(user.id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-sm font-medium text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="flex items-center space-x-2">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name}
                          </div>
                          {currentUser?.id === user.id && (
                            <Badge variant="success" size="sm">
                              Anda
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                     <Badge
                       variant={user.active ? "success" : "error"}
                       size="sm"
                     >
                       {user.active ? "Aktif" : "Tidak Aktif"}
                     </Badge>
                   </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="text-gray-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty filtered results */}
        {filteredUsers.length === 0 && users.length > 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak Ada Hasil</h3>
            <p className="text-gray-600 mb-4">Tidak ada user yang sesuai dengan filter yang dipilih.</p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
              }}
              variant="secondary"
            >
              Reset Filter
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}