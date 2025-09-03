// FILE: src/lib/api/client.ts
import { createBrowserClient } from '@/lib/auth/supabase'

export const supabaseDirect = createBrowserClient()

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  success: boolean
  error?: string
}

export async function paginatedRequest<T>(
  fetchFunction: (params: PaginationParams) => Promise<PaginatedResponse<T>>,
  params: PaginationParams
): Promise<PaginatedResponse<T>> {
  try {
    const response = await fetchFunction(params)
    return response
  } catch (error) {
    return {
      data: [],
      pagination: {
        page: params.page || 1,
        limit: params.limit || 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export interface PaginationParams {
  page?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export async function authenticatedRequest<T>(
  operation: (userId: string) => Promise<any>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabaseDirect.auth.getUser()

    if (authError || !user) {
      return { success: false, error: 'Unauthorized' }
    }

    const result = await operation(user.id)

    if (result.error) {
      return { success: false, error: result.error.message }
    }

    return { success: true, data: result.data }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// Auth API functions
export interface AuthApi {
  login: (
    email: string,
    password: string,
    rememberMe?: boolean
  ) => Promise<{ data?: any; error: string | null }>
  signup: (userData: {
    email: string
    password: string
    username: string
    displayName?: string
  }) => Promise<{ data?: any; error: string | null }>
  logout: () => Promise<{ error: string | null }>
}

export const authApi: AuthApi = {
  async login(email: string, password: string) {
    try {
      const { data, error } = await supabaseDirect.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  async signup(userData: {
    email: string
    password: string
    username: string
    displayName?: string
  }) {
    try {
      const { data, error } = await supabaseDirect.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            username: userData.username,
            display_name: userData.displayName || userData.username,
          },
        },
      })

      if (error) {
        return { error: error.message }
      }

      return { data, error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },

  async logout() {
    try {
      const { error } = await supabaseDirect.auth.signOut()

      if (error) {
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      return { error: 'An unexpected error occurred' }
    }
  },
}

export const apiClient = {
  authenticatedRequest,
  paginatedRequest,
  authApi,
  // Add any other methods you want to expose
}

export default apiClient
