import { Badge } from "@/components/shadcn/ui/badge"

/**
 * Render status badge dengan warna yang sesuai berdasarkan status user
 * @param status - Status user ('active' atau 'inactive')
 * @returns JSX element Badge dengan styling yang sesuai
 */
export const renderStatusBadge = (status: 'active' | 'inactive') => {
  return (
    <Badge variant={status === 'active' ? 'default' : 'secondary'}>
      {status === 'active' ? 'Active' : 'Inactive'}
    </Badge>
  )
}

/**
 * Format tanggal ke format Indonesia (dd/mm/yyyy)
 * @param dateString - String tanggal dalam format ISO atau Date object
 * @returns String tanggal yang diformat atau 'N/A' jika tidak valid
 */
export const formatDateToIndonesian = (dateString: string | Date | null | undefined): string => {
  if (!dateString) return 'N/A'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID')
  } catch (error) {
    return 'N/A'
  }
}

/**
 * Format nilai dengan fallback 'N/A' jika kosong
 * @param value - Nilai yang akan diformat (string atau number)
 * @returns String value atau 'N/A' jika kosong
 */
export const formatValueWithFallback = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined || value === '') return 'N/A'
  return String(value)
}