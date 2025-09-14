"use client";

import React from "react";
import { Alert, AlertDescription } from "@/components/shadcn/ui/alert";
import { Clock, Shield, AlertTriangle } from "lucide-react";

/**
 * Props untuk RateLimitNotification component
 */
interface RateLimitNotificationProps {
  message: string;
  remainingTime?: number;
  className?: string;
}

/**
 * Komponen notifikasi khusus untuk rate limiting
 * Menampilkan pesan dengan visual yang menarik dan informatif
 * Mengikuti prinsip Single Responsibility dan DRY
 */
export function RateLimitNotification({ 
  message, 
  remainingTime, 
  className = "" 
}: RateLimitNotificationProps) {
  /**
   * Ekstrak waktu tunggu dari pesan jika tidak diberikan secara eksplisit
   */
  const extractTimeFromMessage = (msg: string): number | null => {
    const timeMatch = msg.match(/(\d+)\s*menit/);
    return timeMatch ? parseInt(timeMatch[1]) : null;
  };

  const timeToWait = remainingTime || extractTimeFromMessage(message);

  /**
   * Format waktu tunggu menjadi string yang user-friendly
   */
  const formatWaitTime = (minutes: number | null): string => {
    if (!minutes) return "beberapa saat";
    
    if (minutes === 1) return "1 menit";
    if (minutes < 60) return `${minutes} menit`;
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return hours === 1 ? "1 jam" : `${hours} jam`;
    }
    
    return `${hours} jam ${remainingMinutes} menit`;
  };

  /**
   * Menentukan warna dan ikon berdasarkan waktu tunggu
   */
  const getNotificationStyle = (minutes: number | null) => {
    if (!minutes || minutes <= 5) {
      return {
        bgColor: "bg-orange-50",
        borderColor: "border-orange-200",
        textColor: "text-orange-800",
        iconColor: "text-orange-600",
        icon: AlertTriangle
      };
    } else if (minutes <= 15) {
      return {
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-800",
        iconColor: "text-red-600",
        icon: Shield
      };
    } else {
      return {
        bgColor: "bg-red-100",
        borderColor: "border-red-300",
        textColor: "text-red-900",
        iconColor: "text-red-700",
        icon: Shield
      };
    }
  };

  const style = getNotificationStyle(timeToWait);
  const IconComponent = style.icon;

  return (
    <div className={`${className} mb-4`}>
      <Alert className={`${style.bgColor} ${style.borderColor} border-l-4`}>
        <div className="flex items-start gap-3">
          <div className={`${style.iconColor} mt-0.5`}>
            <IconComponent className="h-5 w-5" />
          </div>
          
          <div className="flex-1">
            <AlertDescription className={`${style.textColor} font-medium`}>
              <div className="mb-2">
                🔒 <strong>Akun Sementara Dikunci</strong>
              </div>
              
              <div className="text-sm mb-3">
                {message}
              </div>
              
              {timeToWait && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4" />
                  <span>
                    Waktu tunggu: <strong>{formatWaitTime(timeToWait)}</strong>
                  </span>
                </div>
              )}
              
              <div className="mt-3 text-xs opacity-75">
                💡 <strong>Tips:</strong> Pastikan Anda menggunakan email dan password yang benar untuk menghindari penguncian akun.
              </div>
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
}

/**
 * Utility function untuk mengecek apakah error adalah rate limiting error
 */
export function isRateLimitError(errorMessage: string): boolean {
  return errorMessage.includes("Terlalu banyak percobaan login") || 
         errorMessage.includes("rate limit") ||
         errorMessage.includes("too many attempts");
}

/**
 * Utility function untuk mengekstrak waktu tunggu dari pesan error
 */
export function extractRemainingTime(errorMessage: string): number | null {
  const timeMatch = errorMessage.match(/(\d+)\s*menit/);
  return timeMatch ? parseInt(timeMatch[1]) : null;
}

export default RateLimitNotification;