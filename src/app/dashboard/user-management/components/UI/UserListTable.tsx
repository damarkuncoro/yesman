import { Badge } from "@/components/shadcn/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/shadcn/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/shadcn/ui/dropdown-menu"
import { Button } from "@/components/shadcn/ui/button"
import { IconDots } from "@tabler/icons-react"
import { User } from "../LOGIC/useUserList"

interface UserListTableProps {
    users: User[]
    onUserSelect: (id: string) => void
    onUserEdit: (id: string) => void
    onRoleAssignment: (id: string) => void
}

export function UserListTable({ users, onUserSelect, onUserEdit, onRoleAssignment }: UserListTableProps) {

    console.log('UserListTable - users count:', users.length)
    console.log('UserListTable - user IDs:', users.map(u => u.id))
    
    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {users.map((user) => (
                    <TableRow key={user.id} onClick={() => onUserSelect(user.id.toString())} className="cursor-pointer">
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.name}</TableCell>
                        <TableCell>{user.department || "-"}</TableCell>
                        <TableCell>{user.region || "-"}</TableCell>
                        <TableCell>{user.role || "-"}</TableCell>
                        <TableCell>
                            <Badge variant={user.isActive ? "default" : "secondary"}>
                                {user.isActive ? "Active" : "Inactive"}
                            </Badge>
                        </TableCell>
                        <TableCell>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0" onClick={(e) => e.stopPropagation()}>
                                        <IconDots className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation()
                                        onUserEdit(user.id.toString())
                                    }}>Edit</DropdownMenuItem>
                                    <DropdownMenuItem onClick={(e) => {
                                        e.stopPropagation()
                                        onRoleAssignment(user.id.toString())
                                    }}>Roles</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
