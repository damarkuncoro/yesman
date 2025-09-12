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
import { ShieldX, RefreshCw, Search, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Interface untuk data policy violation log
 */
interface PolicyViolationLog {
  id: number;
  userId: number | null;
  userName: string | null;
  userEmail: string | null;
  roleId: number | null;
  roleName: string | null;
  featureId: number | null;
  featureName: string | null;
  path: string;
  method: string | null;
  violationType: "missing_role" | "insufficient_permission" | "feature_disabled" | "policy_denied";
  reason: string;
  requestData: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
}

/**
 * Interface untuk filter policy violation logs
 */
interface PolicyViolationFilters {
  violationType?: string;
  userId?: string;
  featureId?: string;
  path?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/**
 * Props untuk komponen PolicyViolationLogsTable
 */
interface PolicyViolationLogsTableProps {
  className?: string;
}

/**
 * Komponen untuk menampilkan tabel policy violation logs
 * Menampilkan request yang ditolak karena gagal ABAC dengan detail pelanggaran
 */
export function PolicyViolationLogsTable({ className }: PolicyViolationLogsTableProps) {
  const [logs, setLogs] = useState<PolicyViolationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<PolicyViolationFilters>({
    violationType: "all",
    limit: 50,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  /**
   * Mengambil data policy violation logs dari API
   */
  const fetchPolicyViolationLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      
      if (filters.violationType && filters.violationType !== "all") {
        queryParams.append("violationType", filters.violationType);
      }
      if (filters.userId) {
        queryParams.append("userId", filters.userId);
      }
      if (filters.featureId) {
        queryParams.append("featureId", filters.featureId);
      }
      if (filters.path) {
        queryParams.append("path", filters.path);
      }
      if (filters.dateFrom) {
        queryParams.append("startDate", filters.dateFrom);
      }
      if (filters.dateTo) {
        queryParams.append("endDate", filters.dateTo);
      }
      if (filters.limit) {
        queryParams.append("limit", filters.limit.toString());
      }
      if (filters.offset) {
        queryParams.append("offset", filters.offset.toString());
      }
      // Note: API doesn't support search parameter yet
      // if (searchTerm) {
      //   queryParams.append("search", searchTerm);
      // }

      const response = await fetch(`/api/audit/policy-violations?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data.logs || []);
        setTotalCount(data.data.total || 0);
      } else {
        throw new Error(data.message || "Gagal mengambil data policy violation logs");
      }
    } catch (err) {
      console.error("Error fetching policy violation logs:", err);
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
    fetchPolicyViolationLogs();
  }, [filters]);

  /**
   * Handler untuk mengubah filter violation type
   */
  const handleViolationTypeChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      violationType: value,
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
    fetchPolicyViolationLogs();
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
   * Render badge untuk violation type
   */
  const renderViolationTypeBadge = (violationType: string) => {
    const typeMap: Record<string, { label: string; className: string }> = {
      missing_role: {
        label: "Role Tidak Ada",
        className: "bg-red-100 text-red-800"
      },
      insufficient_permission: {
        label: "Izin Tidak Cukup",
        className: "bg-orange-100 text-orange-800"
      },
      feature_disabled: {
        label: "Fitur Dinonaktifkan",
        className: "bg-yellow-100 text-yellow-800"
      },
      policy_denied: {
        label: "Ditolak Policy",
        className: "bg-purple-100 text-purple-800"
      }
    };

    const typeInfo = typeMap[violationType] || {
      label: violationType,
      className: "bg-gray-100 text-gray-800"
    };

    return (
      <Badge variant="outline" className={typeInfo.className}>
        {typeInfo.label}
      </Badge>
    );
  };

  /**
   * Render method badge
   */
  const renderMethodBadge = (method: string | null) => {
    if (!method) return <span className="text-gray-400">-</span>;
    
    const colorMap: Record<string, string> = {
      GET: "bg-blue-100 text-blue-800",
      POST: "bg-green-100 text-green-800",
      PUT: "bg-yellow-100 text-yellow-800",
      DELETE: "bg-red-100 text-red-800",
      PATCH: "bg-purple-100 text-purple-800",
    };

    return (
      <Badge variant="outline" className={colorMap[method] || "bg-gray-100 text-gray-800"}>
        {method}
      </Badge>
    );
  };

  /**
   * Render severity indicator berdasarkan violation type
   */
  const renderSeverityIndicator = (violationType: string) => {
    const severityMap: Record<string, { color: string; level: string }> = {
      missing_role: { color: "text-red-500", level: "High" },
      insufficient_permission: { color: "text-orange-500", level: "Medium" },
      feature_disabled: { color: "text-yellow-500", level: "Low" },
      policy_denied: { color: "text-purple-500", level: "Medium" }
    };

    const severity = severityMap[violationType] || { color: "text-gray-500", level: "Unknown" };

    return (
      <div className="flex items-center gap-1">
        <AlertTriangle className={`h-4 w-4 ${severity.color}`} />
        <span className={`text-sm font-medium ${severity.color}`}>
          {severity.level}
        </span>
      </div>
    );
  };

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1;
  const totalPages = Math.ceil(totalCount / (filters.limit || 50));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldX className="h-5 w-5 text-red-500" />
          Policy Violation Logs
        </CardTitle>
        <CardDescription>
          Riwayat request yang ditolak karena gagal validasi ABAC (Attribute-Based Access Control)
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Cari berdasarkan path, user, feature, atau alasan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Select value={filters.violationType || "all"} onValueChange={handleViolationTypeChange}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter Violation Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Pelanggaran</SelectItem>
              <SelectItem value="missing_role">Role Tidak Ada</SelectItem>
              <SelectItem value="insufficient_permission">Izin Tidak Cukup</SelectItem>
              <SelectItem value="feature_disabled">Fitur Dinonaktifkan</SelectItem>
              <SelectItem value="policy_denied">Ditolak Policy</SelectItem>
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
          <Button variant="outline" onClick={fetchPolicyViolationLogs} disabled={loading}>
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
            <span>Memuat data policy violation logs...</span>
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
                    <TableHead>Severity</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Violation Type</TableHead>
                    <TableHead>Alasan</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                        Tidak ada data policy violation logs ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id} className="hover:bg-red-50">
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: id })}
                        </TableCell>
                        <TableCell>
                          {renderSeverityIndicator(log.violationType)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {log.userName || "Unknown User"}
                            </span>
                            <span className="text-sm text-gray-500">
                              {log.userEmail || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {log.roleName ? (
                            <Badge variant="secondary">{log.roleName}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>{renderMethodBadge(log.method)}</TableCell>
                        <TableCell className="font-mono text-sm max-w-xs truncate">
                          {log.path}
                        </TableCell>
                        <TableCell>
                          {log.featureName ? (
                            <Badge variant="outline">{log.featureName}</Badge>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {renderViolationTypeBadge(log.violationType)}
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <span className="text-sm text-gray-600 truncate block" title={log.reason}>
                            {log.reason}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ipAddress || "-"}
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
                  Menampilkan {(filters.offset || 0) + 1} - {Math.min((filters.offset || 0) + (filters.limit || 50), totalCount)} dari {totalCount} pelanggaran
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
              <div className="mt-6 p-4 bg-red-50 rounded-lg border border-red-200">
                <h4 className="font-medium text-red-800 mb-2">Ringkasan Pelanggaran</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-red-600 font-medium">Total Pelanggaran:</span>
                    <div className="text-lg font-bold text-red-800">{totalCount}</div>
                  </div>
                  <div>
                    <span className="text-red-600 font-medium">Halaman Ini:</span>
                    <div className="text-lg font-bold text-red-800">{logs.length}</div>
                  </div>
                  <div>
                    <span className="text-red-600 font-medium">Unique Users:</span>
                    <div className="text-lg font-bold text-red-800">
                      {new Set(logs.map(log => log.userId).filter(Boolean)).size}
                    </div>
                  </div>
                  <div>
                    <span className="text-red-600 font-medium">Unique Features:</span>
                    <div className="text-lg font-bold text-red-800">
                      {new Set(logs.map(log => log.featureId).filter(Boolean)).size}
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

export default PolicyViolationLogsTable;