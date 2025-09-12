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
import { CalendarIcon, RefreshCw, Search } from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";

/**
 * Interface untuk data access log
 */
interface AccessLog {
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
  decision: "allow" | "deny";
  reason: string | null;
  createdAt: string;
}

/**
 * Interface untuk filter access logs
 */
interface AccessLogFilters {
  decision?: "allow" | "deny" | "all";
  userId?: string;
  path?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  offset?: number;
}

/**
 * Props untuk komponen AccessLogsTable
 */
interface AccessLogsTableProps {
  className?: string;
}

/**
 * Komponen untuk menampilkan tabel access logs dengan fitur filtering dan pagination
 * Menampilkan semua request user dengan role, path, dan hasil keputusan akses
 */
export function AccessLogsTable({ className }: AccessLogsTableProps) {
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<AccessLogFilters>({
    decision: "all",
    limit: 50,
    offset: 0,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [totalCount, setTotalCount] = useState(0);

  /**
   * Mengambil data access logs dari API
   */
  const fetchAccessLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      
      if (filters.decision && filters.decision !== "all") {
        queryParams.append("decision", filters.decision);
      }
      if (filters.userId) {
        queryParams.append("userId", filters.userId);
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

      const response = await fetch(`/api/audit/access-logs?${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data.logs || []);
        setTotalCount(data.data.total || 0);
      } else {
        throw new Error(data.message || "Gagal mengambil data access logs");
      }
    } catch (err) {
      console.error("Error fetching access logs:", err);
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
    fetchAccessLogs();
  }, [filters]);

  /**
   * Handler untuk mengubah filter decision
   */
  const handleDecisionChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      decision: value as "allow" | "deny" | "all",
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
    fetchAccessLogs();
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
   * Render badge untuk decision
   */
  const renderDecisionBadge = (decision: "allow" | "deny") => {
    return (
      <Badge 
        variant={decision === "allow" ? "default" : "destructive"}
        className={decision === "allow" ? "bg-green-100 text-green-800" : ""}
      >
        {decision === "allow" ? "Diizinkan" : "Ditolak"}
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

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 50)) + 1;
  const totalPages = Math.ceil(totalCount / (filters.limit || 50));

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Access Logs
        </CardTitle>
        <CardDescription>
          Riwayat semua request akses user dengan detail role, path, dan keputusan
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Cari berdasarkan path, user, atau feature..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
          </div>
          <Select value={filters.decision || "all"} onValueChange={handleDecisionChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter Decision" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Decision</SelectItem>
              <SelectItem value="allow">Diizinkan</SelectItem>
              <SelectItem value="deny">Ditolak</SelectItem>
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
          <Button variant="outline" onClick={fetchAccessLogs} disabled={loading}>
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
            <span>Memuat data access logs...</span>
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
                    <TableHead>Role</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Feature</TableHead>
                    <TableHead>Decision</TableHead>
                    <TableHead>Alasan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                        Tidak ada data access logs ditemukan
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: id })}
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
                        <TableCell>{renderDecisionBadge(log.decision)}</TableCell>
                        <TableCell className="max-w-xs">
                          {log.reason ? (
                            <span className="text-sm text-gray-600 truncate block">
                              {log.reason}
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
                  Menampilkan {(filters.offset || 0) + 1} - {Math.min((filters.offset || 0) + (filters.limit || 50), totalCount)} dari {totalCount} data
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
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default AccessLogsTable;