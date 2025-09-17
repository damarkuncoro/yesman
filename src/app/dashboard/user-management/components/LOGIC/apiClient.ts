export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
}

export interface ApiClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: any
  token?: string
  headers?: Record<string, string>
}

/**
 * Centralized API client untuk semua HTTP requests
 * Mendukung semua HTTP methods dengan error handling yang konsisten
 */
export async function apiClient<T>(
  url: string, 
  options: ApiClientOptions = {}
): Promise<T> {
  const { method = 'GET', body, token, headers = {} } = options

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const requestOptions: RequestInit = {
    method,
    headers: requestHeaders,
    ...(body && method !== 'GET' ? { body: JSON.stringify(body) } : {}),
  }

  const response = await fetch(url, requestOptions)
  const result = await response.json()

  if (!response.ok) {
    throw new Error(result.message || `HTTP Error: ${response.status}`)
  }

//   console.log('API Response:', result)
  return result
}
