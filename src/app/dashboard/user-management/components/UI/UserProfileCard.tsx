import { Button } from "@/components/shadcn/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card"
import { IconEdit, IconSettings, IconUser } from "@tabler/icons-react"
import { UserDetail } from '../LOGIC/useUserDetail'
import { renderStatusBadge, formatDateToIndonesian, formatValueWithFallback } from './utils/userDetailUtils'

interface UserProfileCardProps {
  userDetail: UserDetail
  onUserEdit: (userId: string) => void
  onRoleAssignment: (userId: string) => void
}

/**
 * Komponen untuk menampilkan informasi profil dasar user
 * Termasuk nama, email, department, region, level, status, dan tanggal
 */
export function UserProfileCard({ userDetail, onUserEdit, onRoleAssignment }: UserProfileCardProps) {
  const user = userDetail.user
  
  if (!user) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <IconUser className="h-8 w-8" />
            <div>
              <CardTitle>{user.name}</CardTitle>
              <CardDescription>{user.email}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => onUserEdit(user.id.toString())}
              className="flex items-center gap-2"
            >
              <IconEdit className="h-4 w-4" />
              Edit User
            </Button>
            <Button 
              variant="outline" 
              onClick={() => onRoleAssignment(user.id.toString())}
              className="flex items-center gap-2"
            >
              <IconSettings className="h-4 w-4" />
              Manage Roles
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Department</p>
            <p className="text-sm">{formatValueWithFallback(user.department)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Region</p>
            <p className="text-sm">{formatValueWithFallback(user.region)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Level</p>
            <p className="text-sm">{formatValueWithFallback(user.level)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Status</p>
            <div className="mt-1">{renderStatusBadge(user.active ? 'active' : 'inactive')}</div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Created At</p>
            <p className="text-sm">{formatDateToIndonesian(user.createdAt)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Updated At</p>
            <p className="text-sm">{formatDateToIndonesian(user.updatedAt)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}