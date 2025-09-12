"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/ui/card";
import { Badge } from "@/components/shadcn/ui/badge";
import { Button } from "@/components/shadcn/ui/button";
import { Input } from "@/components/shadcn/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/ui/select";
import { UserCheck, RefreshCw, Search, LogIn, LogOut, Shield } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Interface untuk data session log
 */
interface SessionLog {
  id: number;
  userId: number;
  userName: string | null;
  userEmail: string;
  sessionId: string;
  action: "login" | "logout" | "token_refresh" | "token_revoke" | "session_expire";
  ipAddress: string | null;
  userAgent: string | null;
  loginMethod: "password" | "token" | "sso" | null;
  success: boolean;
  failureReason: string | null;
  sessionDuration: number | null; // dalam detik
  createdAt: string;
  expiresAt: string | null;
}

/**
 * Interface untuk filter session logs
 */
interface SessionLogFilters {
  action?: string;
  success?: string;
  userId?: string;
  loginMethod?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/**
 * Props untuk komponen SessionLogsTable
 */
interface SessionLogsTableProps {
  className?: string;
}

/**
 * Komponen untuk menampilkan tabel session logs
 * Menampilkan riwayat login/logout, token refresh/revoke, dan session management
 */
export function SessionLogsTable({ className }: SessionLogsTableProps) {
  const [logs, setLogs] = useState<SessionLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SessionLogFilters>({
    action: "all",
    success: "all",
    limit: 50,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  /**
   * Mengambil data session logs dari API
   */
  const fetchSessionLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      
      if (filters.action && filters.action !== "all") {
        queryParams.append("action", filters.action);
      }
      if (filters.success && filters.success !== "all") {
        queryParams.append("success", filters.success);
      }
      if (filters.userId) {
        queryParams.append("userId", filters.userId);
      }
      // Note: API doesn't support loginMethod, dateFrom, dateTo parameters yet
      // if (filters.loginMethod && filters.loginMethod !== "all") {
      //   queryParams.append("loginMethod", filters.loginMethod);
      // }
      // if (filters.dateFrom) {
      //   queryParams.append("dateFrom", filters.dateFrom);
      // }
      // if (filters.dateTo) {
      //   queryParams.append("dateTo", filters.dateTo);
      // }
      if (filters.limit) {
        queryParams.append("limit", filters.limit.toString());
      }
      // API uses page instead of offset
      if (filters.offset) {
        const page = Math.floor(filters.offset / (filters.limit || 50)) + 1;
        queryParams.append("page", page.toString());
      }
      // Note: API doesn't support search parameter yet
      // if (searchTerm) {
      //   queryParams.append("search", searchTerm);
      // }

      const response = await fetch(`/api/audit/session-logs?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data.logs || []);
        setTotalCount(data.data.total || 0);
      } else {
        throw new Error(data.message || "Gagal mengambil data session logs");
      }
    } catch (err) {
      console.error("Error fetching session logs:", err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setLogs([]);
      setTotalCount(0);
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
   * Handler untuk mengubah filter action
   */
  const handleActionChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      action: value,
      offset: 0, // Reset pagination
    }));
  };

  /**
   * Handler untuk mengubah filter success
   */
  const handleSuccessChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      success: value,
      offset: 0, // Reset pagination
    }));
  };

  /**
   * Handler untuk search
   */
  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      offset: 0, // Reset pagination
    }));
    fetchSessionLogs();
  };

  /**
   * Handler untuk pagination
   */
  const handlePageChange = (newOffset: number) => {
    setFilters(prev => ({
      ...prev,
      offset: newOffset,
    }));
  };

  /**
   * Render badge untuk action type
   */
  const renderActionBadge = (action: string) => {
    const actionMap: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
      login: {
        label: "Login",
        className: "bg-green-100 text-green-800",
        icon: <LogIn className="h-3 w-3" />
      },
      logout: {
        label: "Logout",
        className: "bg-blue-100 text-blue-800",
        icon: <LogOut className="h-3 w-3" />
      },
      token_refresh: {
        label: "Token Refresh",
        className: "bg-yellow-100 text-yellow-800",
        icon: <RefreshCw className="h-3 w-3" />
      },
      token_revoke: {
        label: "Token Revoke",
        className: "bg-red-100 text-red-800",
        icon: <Shield className="h-3 w-3" />
      },
      session_expire: {
        label: "Session Expire",
        className: "bg-gray-100 text-gray-800",
        icon: <Shield className="h-3 w-3" />
      }
    };

    const actionInfo = actionMap[action] || {
      label: action,
      className: "bg-gray-100 text-gray-800",
      icon: null
    };

    return (
      <Badge variant="outline" className={`${actionInfo.className} flex items-center gap-1`}>
        {actionInfo.icon}
        {actionInfo.label}
      </Badge>
    );
  };

  /**
   * Render badge untuk success status
   */
  const renderSuccessBadge = (success: boolean) => {
    return (
      <Badge 
        variant={success ? "default" : "destructive"}
        className={success ? "bg-green-100 text-green-800" : ""}
      >
        {success ? "Berhasil" : "Gagal"}
      </Badge>
    );
  };

  /**
   * Render badge untuk login method
   */
  const renderLoginMethodBadge = (method: string | null) => {
    if (!method) return <span className="text-gray-400">-</span>;
    
    const methodMap: Record<string, string> = {
      password: "bg-blue-100 text-blue-800",
      token: "bg-purple-100 text-purple-800",
      sso: "bg-green-100 text-green-800",
    };

    return (
      <Badge variant="outline" className={methodMap[method] || "bg-gray-100 text-gray-800"}>
        {method.toUpperCase()}
      </Badge>
    );
  };

  /**
   * Format durasi session
   */
  const formatSessionDuration = (duration: number | null) => {
    if (!duration) return "-";
    
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    
    if (hours > 0) {
      return `${hours}j ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1;
  const totalPages = Math.ceil(totalCount / (filters.limit || 50));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-blue-500" />
          Session Logs
        </CardTitle>
        <CardDescription>
          Riwayat aktivitas session user: login, logout, token refresh/revoke, dan session management
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Cari berdasarkan user, email, IP address, atau session ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Select value={filters.action || "all"} onValueChange={handleActionChange}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Action</SelectItem>
              <SelectItem value="login">Login</SelectItem>
              <SelectItem value="logout">Logout</SelectItem>
              <SelectItem value="token_refresh">Token Refresh</SelectItem>
              <SelectItem value="token_revoke">Token Revoke</SelectItem>
              <SelectItem value="session_expire">Session Expire</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.success || "all"} onValueChange={handleSuccessChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="true">Berhasil</SelectItem>
              <SelectItem value="false">Gagal</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch} disabled={loading}>
            {loading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Cari
          </Button>
          <Button variant="outline" onClick={fetchSessionLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            <span>Memuat data session logs...</span>
          </div>
        )}

        {/* Table */}
        {!loading && (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Waktu</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Login Method</TableHead>
                    <TableHead>Session ID</TableHead>
                    <TableHead>Durasi</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>User Agent</TableHead>
                    <TableHead>Alasan Gagal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        Tidak ada data session logs ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id} className={`hover:bg-gray-50 ${!log.success ? 'bg-red-50' : ''}`}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: id })}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {log.userName || "Unknown User"}
                            </span>
                            <span className="text-sm text-gray-500">
                              {log.userEmail}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {renderActionBadge(log.action)}
                        </TableCell>
                        <TableCell>
                          {renderSuccessBadge(log.success)}
                        </TableCell>
                        <TableCell>
                          {renderLoginMethodBadge(log.loginMethod)}
                        </TableCell>
                        <TableCell className="font-mono text-xs max-w-xs truncate" title={log.sessionId}>
                          {log.sessionId}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatSessionDuration(log.sessionDuration)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ipAddress || "-"}
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm" title={log.userAgent || "-"}>
                          {log.userAgent ? (
                            <span className="text-gray-600">
                              {log.userAgent.split(' ')[0]} {/* Show first part of user agent */}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          {log.failureReason ? (
                            <span className="text-sm text-red-600 truncate block" title={log.failureReason}>
                              {log.failureReason}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalCount > 0 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-500">
                  Menampilkan {(filters.offset || 0) + 1} - {Math.min((filters.offset || 0) + (filters.limit || 50), totalCount)} dari {totalCount} session logs
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange((filters.offset || 0) - (filters.limit || 50))}
                    disabled={!filters.offset || filters.offset <= 0}
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-sm">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange((filters.offset || 0) + (filters.limit || 50))}
                    disabled={(filters.offset || 0) + (filters.limit || 50) >= totalCount}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            )}

            {/* Summary Stats */}
            {logs.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Ringkasan Session</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                  <div>
                    <span className="text-blue-600 font-medium">Total Sessions:</span>
                    <div className="text-lg font-bold text-blue-800">{totalCount}</div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Berhasil:</span>
                    <div className="text-lg font-bold text-green-800">
                      {logs.filter(log => log.success).length}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Gagal:</span>
                    <div className="text-lg font-bold text-red-800">
                      {logs.filter(log => !log.success).length}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Unique Users:</span>
                    <div className="text-lg font-bold text-blue-800">
                      {new Set(logs.map(log => log.userId)).size}
                    </div>
                  </div>
                  <div>
                    <span className="text-blue-600 font-medium">Unique IPs:</span>
                    <div className="text-lg font-bold text-blue-800">
                      {new Set(logs.map(log => log.ipAddress).filter(Boolean)).size}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default SessionLogsTable;