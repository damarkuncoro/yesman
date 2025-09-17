import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card"

interface UserDetailStatesProps {
  userId: string | null
  loading: boolean
  userNotFound: boolean
}

/**
 * Komponen untuk menangani berbagai state dari UserDetail
 * Menampilkan loading, empty state, dan error state
 */
export function UserDetailStates({ userId, loading, userNotFound }: UserDetailStatesProps) {
  // State ketika belum ada user yang dipilih
  if (!userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Detail</CardTitle>
          <CardDescription>Select a user from the list to view details</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // State ketika sedang loading
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
          <CardDescription>Memuat detail user...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // State ketika user tidak ditemukan
  if (userNotFound) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Not Found</CardTitle>
          <CardDescription>User dengan ID {userId} tidak ditemukan</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  // Jika tidak ada kondisi di atas, return null (komponen tidak render)
  return null
}