"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/shadcn/ui/card"
import { Badge } from "@/components/shadcn/ui/badge"
import { Button } from "@/components/shadcn/ui/button"
import { Input } from "@/components/shadcn/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/shadcn/ui/select"
import { ChevronLeft, ChevronRight, Search, Filter } from "lucide-react"

// Interface untuk data change history log
interface ChangeHistoryLog {
  id: string
  timestamp: string
  userId: string
  userEmail: string
  changeType: 'role_assignment' | 'role_removal' | 'policy_update' | 'permission_change'
  targetType: 'user' | 'role' | 'policy' | 'permission'
  targetId: string
  targetName: string
  oldValue: string
  newValue: string
  reason?: string
  ipAddress: string
  userAgent: string
}

// Interface untuk filter
interface ChangeHistoryFilter {
  search: string
  changeType: string
  targetType: string
  dateRange: string
}

/**
 * Komponen tabel untuk menampilkan change history logs
 * Menampilkan semua perubahan role, policy, dan permission dengan detail lengkap
 */
export function ChangeHistoryTable() {
  const [logs, setLogs] = useState<ChangeHistoryLog[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [filter, setFilter] = useState<ChangeHistoryFilter>({
    search: '',
    changeType: '',
    targetType: '',
    dateRange: ''
  })

  const itemsPerPage = 10

  // Fetch data dari API
  useEffect(() => {
    fetchChangeHistoryLogs()
  }, [currentPage, filter])

  /**
   * Mengambil data change history logs dari API
   */
  const fetchChangeHistoryLogs = async () => {
    try {
      setLoading(true)
      const queryParams = new URLSearchParams()
      queryParams.append('limit', itemsPerPage.toString())
      queryParams.append('offset', ((currentPage - 1) * itemsPerPage).toString())
      
      // Note: API uses different parameter names
      if (filter.changeType) {
        queryParams.append('action', filter.changeType)
      }
      // Note: search and targetType not supported by API yet
      // if (filter.search) {
      //   queryParams.append('search', filter.search)
      // }
      // if (filter.targetType) {
      //   queryParams.append('targetType', filter.targetType)
      // }
      
      // Convert dateRange to startDate/endDate
      if (filter.dateRange) {
        const now = new Date()
        let startDate: Date
        
        switch (filter.dateRange) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case 'quarter':
            const quarterStart = Math.floor(now.getMonth() / 3) * 3
            startDate = new Date(now.getFullYear(), quarterStart, 1)
            break
          default:
            startDate = new Date(0)
        }
        
        if (filter.dateRange !== '') {
          queryParams.append('startDate', startDate.toISOString())
        }
      }

      const response = await fetch(`/api/audit/change-history?${queryParams}`)
      if (!response.ok) {
        throw new Error('Failed to fetch change history logs')
      }

      const data = await response.json()
      setLogs(data.logs || [])
      setTotalPages(Math.ceil((data.total || 0) / itemsPerPage))
    } catch (error) {
      console.error('Error fetching change history logs:', error)
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  /**
   * Render badge untuk change type
   */
  const renderChangeTypeBadge = (changeType: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      role_assignment: { variant: 'default', label: 'Role Assignment' },
      role_removal: { variant: 'destructive', label: 'Role Removal' },
      policy_update: { variant: 'secondary', label: 'Policy Update' },
      permission_change: { variant: 'outline', label: 'Permission Change' }
    }

    const config = variants[changeType] || { variant: 'default', label: changeType }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  /**
   * Render badge untuk target type
   */
  const renderTargetTypeBadge = (targetType: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      user: { variant: 'default', label: 'User' },
      role: { variant: 'secondary', label: 'Role' },
      policy: { variant: 'outline', label: 'Policy' },
      permission: { variant: 'destructive', label: 'Permission' }
    }

    const config = variants[targetType] || { variant: 'default', label: targetType }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  /**
   * Handle perubahan filter
   */
  const handleFilterChange = (key: keyof ChangeHistoryFilter, value: string) => {
    setFilter(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  /**
   * Handle pagination
   */
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  /**
   * Format timestamp
   */
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Change History Logs
        </CardTitle>
        <CardDescription>
          Track semua perubahan role, policy, dan permission dalam sistem
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filter Controls */}
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search user, target..."
              value={filter.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Select
            value={filter.changeType}
            onValueChange={(value) => handleFilterChange('changeType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Change Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              <SelectItem value="role_assignment">Role Assignment</SelectItem>
              <SelectItem value="role_removal">Role Removal</SelectItem>
              <SelectItem value="policy_update">Policy Update</SelectItem>
              <SelectItem value="permission_change">Permission Change</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter.targetType}
            onValueChange={(value) => handleFilterChange('targetType', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Target Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Targets</SelectItem>
              <SelectItem value="user">User</SelectItem>
              <SelectItem value="role">Role</SelectItem>
              <SelectItem value="policy">Policy</SelectItem>
              <SelectItem value="permission">Permission</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter.dateRange}
            onValueChange={(value) => handleFilterChange('dateRange', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="quarter">This Quarter</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Change Type</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Old Value</TableHead>
                <TableHead>New Value</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>IP Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading change history logs...
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    No change history logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.userEmail}</div>
                        <div className="text-sm text-muted-foreground">{log.userId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {renderChangeTypeBadge(log.changeType)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {renderTargetTypeBadge(log.targetType)}
                        <div className="text-sm">{log.targetName}</div>
                        <div className="text-xs text-muted-foreground">{log.targetId}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-32 truncate text-sm" title={log.oldValue}>
                        {log.oldValue || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-32 truncate text-sm" title={log.newValue}>
                        {log.newValue || '-'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-32 truncate text-sm" title={log.reason}>
                        {log.reason || '-'}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ipAddress}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {logs.length} of {totalPages * itemsPerPage} entries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}