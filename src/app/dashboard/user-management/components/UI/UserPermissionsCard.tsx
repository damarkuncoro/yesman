import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shadcn/ui/table"
import { UserDetail } from '../LOGIC/useUserDetail'

interface UserPermissionsCardProps {
  userDetail: UserDetail
}

/**
 * Komponen untuk menampilkan tabel permissions yang dimiliki user
 * Menampilkan feature ID, nama feature, dan deskripsi dalam format tabel
 */
export function UserPermissionsCard({ userDetail }: UserPermissionsCardProps) {
  const permissions = userDetail.user?.permissions || []

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Permissions</CardTitle>
        <CardDescription>
          Permission yang dimiliki user berdasarkan role yang diberikan
        </CardDescription>
      </CardHeader>
      <CardContent>
        {permissions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <p>User belum memiliki permissions yang diberikan</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Feature ID</TableHead>
                  <TableHead>Feature Name</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={`user-permission.feature-${permission.featureId}-${permission.featureName}`}>
                    <TableCell className="font-mono text-sm">{permission.featureId}</TableCell>
                    <TableCell className="font-medium">{permission.featureName}</TableCell>
                    <TableCell>{permission.featureDescription}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}