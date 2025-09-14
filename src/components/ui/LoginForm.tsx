"use client";

import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "./Button";
import { Input } from "./Input";
import { Card, CardHeader, CardContent } from "./Card";
import { RateLimitNotification, isRateLimitError } from "./RateLimitNotification";
import { InvalidLoginNotification, isInvalidLoginError } from "./InvalidLoginNotification";

/**
 * Props untuk LoginForm component
 */
interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
}

/**
 * Pure UI component untuk form login
 * Mengikuti prinsip Single Responsibility - hanya menangani UI dan input handling
 */
export function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const { login, isLoading } = useAuth();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string>("");

  /**
   * Handler untuk perubahan input form
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear error saat user mulai mengetik
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: "",
      }));
    }
    
    // Clear submit error
    if (submitError) {
      setSubmitError("");
    }
  };

  /**
   * Validasi form di client side
   */
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email wajib diisi";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Format email tidak valid";
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "Password wajib diisi";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password minimal 6 karakter";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handler untuk submit form
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      await login(formData.email, formData.password);
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login gagal";
      setSubmitError(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card variant="elevated" padding="xl" className="backdrop-blur-sm bg-white/95">
          <CardHeader 
            title="Masuk ke Akun Anda"
            subtitle="Silakan masukkan kredensial Anda untuk melanjutkan"
            className="text-center border-none pb-6"
          />
          
          <CardContent className="space-y-6">
            {/* Error Message */}
            {submitError && (
              <>
                {isRateLimitError(submitError) ? (
                  <RateLimitNotification message={submitError} />
                ) : isInvalidLoginError(submitError) ? (
                  <InvalidLoginNotification message={submitError} />
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
                    <svg className="h-5 w-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{submitError}</span>
                  </div>
                )}
              </>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Input */}
              <Input
                type="email"
                name="email"
                label="Email"
                value={formData.email}
                onChange={handleInputChange}
                error={errors.email}
                placeholder="Masukkan email Anda"
                disabled={isLoading}
                leftIcon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                }
                fullWidth
              />
              
              {/* Password Input */}
              <Input
                type="password"
                name="password"
                label="Password"
                value={formData.password}
                onChange={handleInputChange}
                error={errors.password}
                placeholder="Masukkan password Anda"
                disabled={isLoading}
                leftIcon={
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                }
                fullWidth
              />
              
              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isLoading}
                loading={isLoading}
                size="lg"
                fullWidth
                className="mt-6"
              >
                Masuk
              </Button>
            </form>
            
            {/* Switch to Register */}
            {onSwitchToRegister && (
              <div className="text-center pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  Belum punya akun?{" "}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSwitchToRegister}
                    disabled={isLoading}
                    className="p-0 h-auto font-medium text-blue-600 hover:text-blue-800"
                  >
                    Daftar di sini
                  </Button>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}