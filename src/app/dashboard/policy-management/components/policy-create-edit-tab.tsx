'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/shadcn/ui/button';
import { Input } from '@/components/shadcn/ui/input';
import { Label } from '@/components/shadcn/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/shadcn/ui/select';
import { Card, CardContent, CardHeader } from '@/components/shadcn/ui/card';
import { IconDeviceFloppy, IconX } from '@tabler/icons-react';
import { createPolicySchema } from '@/db/schema';
import type { Feature, Policy } from '@/db/schema';
import { toast } from 'sonner';

// Schema validasi untuk form policy (menggunakan schema dari database)
const policyFormSchema = createPolicySchema;

type PolicyFormData = z.infer<typeof policyFormSchema>;

interface PolicyCreateEditTabProps {
  policyId?: number | null;
  isEditMode?: boolean;
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Komponen untuk membuat dan mengedit policy ABAC
 * Menyediakan form dengan pilihan feature, attribute, operator, dan value
 */
export default function PolicyCreateEditTab({
  policyId,
  isEditMode = false,
  onSuccess,
  onCancel,
}: PolicyCreateEditTabProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [features, setFeatures] = useState<Feature[]>([]);
  const [isLoadingFeatures, setIsLoadingFeatures] = useState(true);
  const [policyData, setPolicyData] = useState<Policy | null>(null);

  // Daftar attributes yang tersedia (sesuai schema database)
  const availableAttributes = [
    { value: 'department', label: 'Department' },
    { value: 'region', label: 'Region' },
    { value: 'level', label: 'Level' },
  ] as const;

  // Daftar operators yang tersedia (sesuai schema database)
  const availableOperators = [
    { value: '==', label: 'Equals (==)' },
    { value: '!=', label: 'Not Equals (!=)' },
    { value: '>', label: 'Greater Than (>)' },
    { value: '>=', label: 'Greater Than or Equal (>=)' },
    { value: '<', label: 'Less Than (<)' },
    { value: '<=', label: 'Less Than or Equal (<=)' },
    { value: 'in', label: 'In (comma separated)' },
  ] as const;

  const form = useForm<PolicyFormData>({
    resolver: zodResolver(policyFormSchema),
    defaultValues: {
      featureId: 0,
      attribute: 'department',
      operator: '==',
      value: '',
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = form;

  const watchedFeatureId = watch('featureId');
  const watchedAttribute = watch('attribute');
  const watchedOperator = watch('operator');

  /**
   * Load features dari API
   */
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const response = await fetch('/api/v1/rbac/features');
        const data = await response.json();
        if (data.success) {
          setFeatures(data.data.features);
        }
      } catch (error) {
        console.error('Error fetching features:', error);
        toast.error('Gagal memuat daftar features');
      } finally {
        setIsLoadingFeatures(false);
      }
    };

    fetchFeatures();
  }, []);

  /**
   * Load data policy jika dalam mode edit
   */
  useEffect(() => {
    if (isEditMode && policyId) {
      setIsLoading(true);
      const fetchPolicy = async () => {
        try {
          const response = await fetch(`/api/v1/abac/policies/${policyId}`);
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const result = await response.json();
          if (result.success && result.data) {
            const policy = result.data;
            setPolicyData(policy);
            reset({
              featureId: policy.featureId,
              attribute: policy.attribute,
              operator: policy.operator,
              value: policy.value,
            });
          } else {
            toast.error('Policy tidak ditemukan');
          }
        } catch (error) {
          console.error('Error fetching policy:', error);
          toast.error('Gagal memuat data policy');
        } finally {
          setIsLoading(false);
        }
      };

      fetchPolicy();
    }
  }, [isEditMode, policyId, reset]);

  /**
   * Handler untuk submit form
   */
  const onSubmit = async (data: PolicyFormData) => {
    setIsSaving(true);
    
    try {
      const url = isEditMode && policyId 
        ? `/api/v1/abac/policies/${policyId}`
        : '/api/v1/abac/policies';
      
      const method = isEditMode ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (response.ok) {
        toast.success(isEditMode ? 'Policy berhasil diupdate' : 'Policy berhasil dibuat');
        onSuccess?.();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Gagal menyimpan policy');
      }
    } catch (error) {
      console.error('Error saving policy:', error);
      toast.error('Terjadi kesalahan saat menyimpan policy');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Render helper text berdasarkan attribute dan operator yang dipilih
   */
  const renderValueHelper = () => {
    if (!watchedAttribute || !watchedOperator) return null;

    const helpers: Record<string, Record<string, string>> = {
      department: {
        '==': 'Contoh: Finance, HR, IT, Marketing',
        '!=': 'Contoh: Finance (semua kecuali Finance)',
        'in': 'Contoh: Finance,HR,IT (pisahkan dengan koma)',
        'not_in': 'Contoh: Finance,HR (semua kecuali yang disebutkan)',
      },
      level: {
        '==': 'Contoh: 3 (level tepat 3)',
        '!=': 'Contoh: 1 (semua kecuali level 1)',
        '>': 'Contoh: 2 (level di atas 2)',
        '<': 'Contoh: 5 (level di bawah 5)',
        '>=': 'Contoh: 3 (level 3 ke atas)',
        '<=': 'Contoh: 4 (level 4 ke bawah)',
        'in': 'Contoh: 3,4,5 (level 3, 4, atau 5)',
      },
      region: {
        '==': 'Contoh: Jakarta, Surabaya, Bandung',
        '!=': 'Contoh: Jakarta (semua kecuali Jakarta)',
        'in': 'Contoh: Jakarta,Surabaya,Bandung',
        'not_in': 'Contoh: Jakarta,Surabaya',
      },
    };

    const helper = helpers[watchedAttribute]?.[watchedOperator];
    if (helper) {
      return (
        <p className="text-sm text-gray-600 mt-1">
          {helper}
        </p>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Memuat data policy...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold">
          {isEditMode ? 'Edit Policy ABAC' : 'Buat Policy ABAC Baru'}
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          {isEditMode 
            ? 'Perbarui aturan akses berdasarkan atribut pengguna'
            : 'Buat aturan akses baru berdasarkan atribut pengguna'
          }
        </p>
      </div>

      {/* Form */}
      <Card>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Feature Selection */}
            <div className="space-y-2">
              <Label htmlFor="featureId">Feature *</Label>
              <Select
                value={watchedFeatureId?.toString()}
                onValueChange={(value) => setValue('featureId', parseInt(value))}
                disabled={isLoadingFeatures}
              >
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingFeatures ? "Memuat features..." : "Pilih feature yang akan dikontrol"} />
                </SelectTrigger>
                <SelectContent>
                  {features.map((feature) => (
                    <SelectItem key={feature.id} value={feature.id.toString()}>
                      {feature.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.featureId && (
                <p className="text-sm text-red-600">{errors.featureId.message}</p>
              )}
            </div>

            {/* Attribute Selection */}
            <div className="space-y-2">
              <Label htmlFor="attribute">Attribute *</Label>
              <Select
                value={watchedAttribute}
                onValueChange={(value) => setValue('attribute', value as "department" | "region" | "level")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih attribute pengguna" />
                </SelectTrigger>
                <SelectContent>
                  {availableAttributes.map((attribute) => (
                    <SelectItem key={attribute.value} value={attribute.value}>
                      {attribute.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.attribute && (
                <p className="text-sm text-red-600">{errors.attribute.message}</p>
              )}
            </div>

            {/* Operator Selection */}
            <div className="space-y-2">
              <Label htmlFor="operator">Operator *</Label>
              <Select
                value={watchedOperator}
                onValueChange={(value) => setValue('operator', value as "==" | "!=" | ">" | ">=" | "<" | "<=" | "in")}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih operator perbandingan" />
                </SelectTrigger>
                <SelectContent>
                  {availableOperators.map((operator) => (
                    <SelectItem key={operator.value} value={operator.value}>
                      {operator.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.operator && (
                <p className="text-sm text-red-600">{errors.operator.message}</p>
              )}
            </div>

            {/* Value Input */}
            <div className="space-y-2">
              <Label htmlFor="value">Value *</Label>
              <Input
                id="value"
                {...register('value')}
                placeholder="Masukkan value untuk perbandingan"
              />
              {renderValueHelper()}
              {errors.value && (
                <p className="text-sm text-red-600">{errors.value.message}</p>
              )}
            </div>



            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSaving}
              >
                <IconX size={16} className="mr-2" />
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <IconDeviceFloppy size={16} />
                )}
                {isSaving 
                  ? 'Menyimpan...' 
                  : isEditMode 
                    ? 'Update Policy' 
                    : 'Simpan Policy'
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}