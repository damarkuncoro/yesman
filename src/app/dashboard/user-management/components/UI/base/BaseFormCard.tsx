import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/ui/card"

/**
 * Props untuk BaseFormCard component
 */
interface BaseFormCardProps {
  /** Icon yang ditampilkan di header */
  icon?: React.ReactNode
  /** Judul card */
  title: string
  /** Deskripsi card */
  description?: string
  /** Konten card */
  children: React.ReactNode
  /** Class tambahan untuk styling */
  className?: string
}

/**
 * BaseFormCard Component
 * 
 * Base component untuk semua form card yang mengikuti prinsip DRY.
 * Menyediakan struktur konsisten untuk semua form dengan header, icon, dan content.
 * 
 * Prinsip SOLID yang diterapkan:
 * - SRP: Hanya bertanggung jawab untuk layout card
 * - OCP: Terbuka untuk extension melalui props dan children
 * - LSP: Dapat digunakan sebagai pengganti Card biasa
 * - ISP: Interface yang focused dan tidak memaksa dependency yang tidak perlu
 * - DIP: Bergantung pada abstraksi (React.ReactNode) bukan implementasi konkret
 */
export function BaseFormCard({
  icon,
  title,
  description,
  children,
  className = ""
}: BaseFormCardProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          {icon && <span className="h-5 w-5">{icon}</span>}
          <CardTitle>{title}</CardTitle>
        </div>
        {description && (
          <CardDescription>{description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {children}
      </CardContent>
    </Card>
  )
}