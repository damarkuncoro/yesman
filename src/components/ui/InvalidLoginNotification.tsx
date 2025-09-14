"use client";

import React from "react";
import { Alert, AlertDescription } from "@/components/shadcn/ui/alert";
import { AlertCircle, Eye, EyeOff, Mail, Lock } from "lucide-react";

/**
 * Props untuk InvalidLoginNotification component
 */
interface InvalidLoginNotificationProps {
  message: string;
  className?: string;
}

/**
 * Komponen notifikasi khusus untuk error login invalid
 * Menampilkan pesan dengan tips keamanan dan panduan untuk user
 * Mengikuti prinsip Single Responsibility dan DRY
 */
export function InvalidLoginNotification({ 
  message, 
  className = "" 
}: InvalidLoginNotificationProps) {
  return (
    <div className={`${className} mb-4`}>
      <Alert className="bg-red-50 border-red-200 border-l-4 border-l-red-500">
        <div className="flex items-start gap-3">
          <div className="text-red-600 mt-0.5">
            <AlertCircle className="h-5 w-5" />
          </div>
          
          <div className="flex-1">
            <AlertDescription className="text-red-800">
              <div className="mb-2 font-medium">
                🚫 <strong>Login Gagal</strong>
              </div>
              
              <div className="text-sm mb-3">
                {message}
              </div>
              
              <div className="bg-red-100 p-3 rounded-md mb-3">
                <div className="text-sm font-medium text-red-900 mb-2">
                  💡 <strong>Tips untuk Login Berhasil:</strong>
                </div>
                
                <ul className="text-xs text-red-800 space-y-1 ml-4">
                  <li className="flex items-center gap-2">
                    <Mail className="h-3 w-3" />
                    <span>Pastikan email yang dimasukkan sudah benar</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Lock className="h-3 w-3" />
                    <span>Periksa kembali password Anda (perhatikan huruf besar/kecil)</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Eye className="h-3 w-3" />
                    <span>Gunakan fitur "Lihat Password" untuk memastikan input benar</span>
                  </li>
                </ul>
              </div>
              
              <div className="text-xs text-red-700 bg-red-50 p-2 rounded border border-red-200">
                <strong>⚠️ Peringatan Keamanan:</strong> Setelah 5 kali percobaan gagal, akun akan dikunci sementara untuk melindungi keamanan Anda.
              </div>
            </AlertDescription>
          </div>
        </div>
      </Alert>
    </div>
  );
}

/**
 * Utility function untuk mengecek apakah error adalah invalid login error
 */
export function isInvalidLoginError(errorMessage: string): boolean {
  return errorMessage.includes("Email atau password tidak valid") || 
         errorMessage.includes("invalid credentials") ||
         errorMessage.includes("login failed") ||
         errorMessage.includes("authentication failed");
}

/**
 * Utility function untuk mengecek apakah error adalah akun tidak aktif
 */
export function isInactiveAccountError(errorMessage: string): boolean {
  return errorMessage.includes("Akun tidak aktif") || 
         errorMessage.includes("account inactive") ||
         errorMessage.includes("account disabled");
}

export default InvalidLoginNotification;