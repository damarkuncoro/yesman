"use client"

import { useState, useEffect, useMemo } from "react"
import { useApiCall } from "./hooks"

/**
 * Interface untuk konfigurasi useDataList
 */
interface UseDataListOptions<T> {
  endpoint: string
  searchKeys?: (keyof T)[]
  transform?: (raw: any) => T[]   // agar fleksibel format response
  errorMessage?: string
}

/**
 * Custom hook untuk mengelola data list dengan search functionality
 * Menggunakan base hooks untuk menghilangkan duplikasi kode
 */
export function useDataList<T>({ 
  endpoint, 
  searchKeys = [], 
  transform, 
  errorMessage = "Gagal mengambil data" 
}: UseDataListOptions<T>) {
  // Local state untuk search dan filtered data
  const [filteredData, setFilteredData] = useState<T[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  // Memoize searchKeys untuk mencegah infinite re-render
  const memoizedSearchKeys = useMemo(() => searchKeys, [JSON.stringify(searchKeys)])

  // Memoize transform function untuk mencegah infinite re-render
  const memoizedTransform = useMemo(() => transform, [transform])

  // API call menggunakan base hook
  const {
    data: rawData,
    loading,
    execute: loadData
  } = useApiCall<any>({
    endpoint,
    errorMessage
  })

  // Transform data jika diperlukan
  const data = useMemo(() => {
    if (!rawData) return []
    return memoizedTransform ? memoizedTransform(rawData) : rawData
  }, [rawData, memoizedTransform])

  // Load data saat komponen mount atau endpoint berubah
  useEffect(() => {
    loadData()
  }, [endpoint, loadData])

  // Filter data berdasarkan search term
  useEffect(() => {
    if (!data) {
      setFilteredData([])
      return
    }

    if (!memoizedSearchKeys.length || !searchTerm) {
      setFilteredData(data)
      return
    }

    const filtered = data.filter((item: T) =>
      memoizedSearchKeys.some((key) => {
        const value = item[key]
        return typeof value === "string" && value.toLowerCase().includes(searchTerm.toLowerCase())
      })
    )
    setFilteredData(filtered)
  }, [searchTerm, data, memoizedSearchKeys])

  console.log("data", data)
  return {
    data: data || [],
    filteredData,
    loading,
    searchTerm,
    setSearchTerm,
    refetch: loadData,
  }
}
