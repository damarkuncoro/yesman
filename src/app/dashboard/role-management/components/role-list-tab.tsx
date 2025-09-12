"use client"

import { useState } from "react"
import { Button } from "@/components/shadcn/ui/button"
import { Input } from "@/components/shadcn/ui/input"
import { Badge } from "@/components/shadcn/ui/badge"
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
import { IconPlus, IconSearch, IconEdit, IconUsers, IconEye } from "@tabler/icons-react"

// Mock data untuk roles
const mockRoles = [
  {
    id: "1",
    name: "Admin",
    description: "Full system administrator access",
    grantsAll: true,
    featureCount: 25,
    userCount: 3,
    createdAt: "2024-01-15",
    updatedAt: "2024-01-20"
  },
  {
    id: "2",
    name: "Editor",
    description: "Content management and editing permissions",
    grantsAll: false,
    featureCount: 12,
    userCount: 8,
    createdAt: "2024-01-16",
    updatedAt: "2024-01-18"
  },
  {
    id: "3",
    name: "Viewer",
    description: "Read-only access to system resources",
    grantsAll: false,
    featureCount: 5,
    userCount: 15,
    createdAt: "2024-01-17",
    updatedAt: "2024-01-17"
  },
  {
    id: "4",
    name: "Manager",
    description: "Department management and reporting access",
    grantsAll: false,
    featureCount: 18,
    userCount: 6,
    createdAt: "2024-01-18",
    updatedAt: "2024-01-22"
  },
  {
    id: "5",
    name: "Analyst",
    description: "Data analysis and reporting permissions",
    grantsAll: false,
    featureCount: 8,
    userCount: 4,
    createdAt: "2024-01-19",
    updatedAt: "2024-01-21"
  }
]

interface RoleListTabProps {
  onRoleSelect: (roleId: string) => void
  onRoleEdit: (roleId: string) => void
  onRoleCreate: () => void
  onRoleUserMapping: (roleId: string) => void
}

/**
 * Komponen tab untuk menampilkan daftar role
 * Menampilkan tabel role dengan informasi grantsAll, jumlah features, dan jumlah users
 */
export function RoleListTab({ 
  onRoleSelect, 
  onRoleEdit, 
  onRoleCreate, 
  onRoleUserMapping 
}: RoleListTabProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [roles] = useState(mockRoles) // Nanti akan diganti dengan API call

  /**
   * Filter roles berdasarkan search term
   */
  const filteredRoles = roles.filter(role =>
    role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    role.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  /**
   * Render badge untuk grantsAll status
   */
  const renderGrantsAllBadge = (grantsAll: boolean) => {
    return (
      <Badge variant={grantsAll ? "default" : "secondary"}>
        {grantsAll ? "All Access" : "Limited"}
      </Badge>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Role Management</CardTitle>
            <CardDescription>
              Kelola role dan permissions dalam sistem RBAC/ABAC
            </CardDescription>
          </div>
          <Button onClick={onRoleCreate}>
            <IconPlus className="mr-2 h-4 w-4" />
            Create Role
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <IconSearch className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Access Type</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRoles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <button
                      onClick={() => onRoleSelect(role.id)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {role.name}
                    </button>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {role.description}
                  </TableCell>
                  <TableCell>
                    {renderGrantsAllBadge(role.grantsAll)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {role.featureCount} features
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {role.userCount} users
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(role.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRoleSelect(role.id)}
                        title="View Details"
                      >
                        <IconEye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRoleEdit(role.id)}
                        title="Edit Role"
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRoleUserMapping(role.id)}
                        title="View Users"
                      >
                        <IconUsers className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredRoles.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No roles found matching your search.
          </div>
        )}
      </CardContent>
    </Card>
  )
}