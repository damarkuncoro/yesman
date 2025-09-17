import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card"
import { IconShield } from "@tabler/icons-react"
import { UserDetail } from '../LOGIC/useUserDetail'

interface UserRolesCardProps {
  userDetail: UserDetail
}

/**
 * Komponen untuk menampilkan daftar roles yang dimiliki user
 * Menampilkan nama role, deskripsi, dan ID role
 * Menggunakan unique key dengan kombinasi role.id dan index untuk mencegah duplicate keys
 */
export function UserRolesCard({ userDetail }: UserRolesCardProps) {
  const roles = userDetail.user?.roles || []

  // Log untuk debugging duplicate keys
  console.log('UserRolesCard - roles count:', roles.length)
  console.log('UserRolesCard - role IDs:', roles.map(r => r.id))

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <IconShield className="h-5 w-5" />
          <CardTitle>User Roles</CardTitle>
        </div>
        <CardDescription>
          Role yang dimiliki user dan tanggal assignment
        </CardDescription>
      </CardHeader>
      <CardContent>
        {roles.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>User belum memiliki role yang diberikan</p>
          </div>
        ) : (
          <div className="space-y-3">
            {roles.map((role, index) => (
              <div key={`user-role-${role.id}-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">{role.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {role.description || 'No description available'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">
                    Role ID: {role.id}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}