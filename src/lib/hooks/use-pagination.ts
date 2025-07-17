// FILE: src/lib/hooks/use-pagination.ts
// Pagination management hook for consistent pagination across components

import { PaginationParams } from '@/lib/types'
import { useCallback, useMemo, useState } from 'react'

interface PaginationState {
  page: number
  limit: number
  total: number
  totalPages: number
  hasNext: boolean
  hasPrev: boolean
  sortBy: string | undefined
  sortOrder?: 'asc' | 'desc'
}

interface UsePaginationReturn {
  pagination: PaginationState
  goToPage: (page: number) => void
  nextPage: () => void
  prevPage: () => void
  setLimit: (limit: number) => void
  setSort: (sortBy: string, sortOrder?: 'asc' | 'desc') => void
  reset: () => void
  updateTotal: (total: number) => void
  getOffset: () => number
  getParams: () => PaginationParams
}

interface UsePaginationOptions {
  initialPage?: number
  initialLimit?: number
  initialSortBy?: string
  initialSortOrder?: 'asc' | 'desc'
}

export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    initialPage = 1,
    initialLimit = 20,
    initialSortBy,
    initialSortOrder = 'desc'
  } = options

  const [state, setState] = useState<PaginationState>({
    page: initialPage,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
    sortBy: initialSortBy,
    sortOrder: initialSortOrder
  })

  // Calculate derived values
  const derivedState = useMemo(() => {
    const totalPages = Math.ceil(state.total / state.limit)
    const hasNext = state.page < totalPages
    const hasPrev = state.page > 1

    return {
      ...state,
      totalPages,
      hasNext,
      hasPrev
    }
  }, [state])

  // Go to specific page
  const goToPage = useCallback((page: number) => {
    setState(prev => {
      const totalPages = Math.ceil(prev.total / prev.limit)
      const validPage = Math.max(1, Math.min(page, totalPages || 1))
      
      return {
        ...prev,
        page: validPage
      }
    })
  }, [])

  // Go to next page
  const nextPage = useCallback(() => {
    setState(prev => {
      const totalPages = Math.ceil(prev.total / prev.limit)
      if (prev.page < totalPages) {
        return {
          ...prev,
          page: prev.page + 1
        }
      }
      return prev
    })
  }, [])

  // Go to previous page
  const prevPage = useCallback(() => {
    setState(prev => {
      if (prev.page > 1) {
        return {
          ...prev,
          page: prev.page - 1
        }
      }
      return prev
    })
  }, [])

  // Set items per page
  const setLimit = useCallback((limit: number) => {
    setState(prev => ({
      ...prev,
      limit: Math.max(1, limit),
      page: 1 // Reset to first page when changing limit
    }))
  }, [])

  // Set sort parameters
  const setSort = useCallback((sortBy: string, sortOrder: 'asc' | 'desc' = 'desc') => {
    setState(prev => ({
      ...prev,
      sortBy,
      sortOrder,
      page: 1 // Reset to first page when changing sort
    }))
  }, [])

  // Reset pagination to initial state
  const reset = useCallback(() => {
    setState({
      page: initialPage,
      limit: initialLimit,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
      sortBy: initialSortBy === undefined ? undefined : initialSortBy,
      sortOrder: initialSortOrder
    })
  }, [initialPage, initialLimit, initialSortBy, initialSortOrder])

  // Update total count (usually called after fetching data)
  const updateTotal = useCallback((total: number) => {
    setState(prev => ({
      ...prev,
      total: Math.max(0, total)
    }))
  }, [])

  // Get offset for database queries
  const getOffset = useCallback(() => {
    return (derivedState.page - 1) * derivedState.limit
  }, [derivedState.page, derivedState.limit])

  // Get pagination parameters for API calls
  const getParams = useCallback((): PaginationParams => {
    const params: PaginationParams = {
      page: derivedState.page,
      limit: derivedState.limit,
    }
    if (derivedState.sortBy !== undefined) {
      params.sortBy = derivedState.sortBy
    }
    if (derivedState.sortOrder !== undefined) {
      params.sortOrder = derivedState.sortOrder
    }
    return params
  }, [derivedState])

  return {
    pagination: derivedState,
    goToPage,
    nextPage,
    prevPage,
    setLimit,
    setSort,
    reset,
    updateTotal,
    getOffset,
    getParams
  }
}

// Helper hook for infinite scroll pagination
interface UseInfiniteScrollReturn {
  pagination: PaginationState
  loadMore: () => void
  reset: () => void
  updateTotal: (total: number) => void
  isLastPage: boolean
}

export function useInfiniteScroll(options: UsePaginationOptions = {}): UseInfiniteScrollReturn {
  const {
    pagination,
    nextPage,
    reset,
    updateTotal
  } = usePagination(options)

  const loadMore = useCallback(() => {
    if (pagination.hasNext) {
      nextPage()
    }
  }, [pagination.hasNext, nextPage])

  const isLastPage = !pagination.hasNext

  return {
    pagination,
    loadMore,
    reset,
    updateTotal,
    isLastPage
  }
}

// Helper hook for table pagination with common page sizes
interface UseTablePaginationReturn extends UsePaginationReturn {
  pageSizeOptions: number[]
  setPageSize: (size: number) => void
  getRowNumbers: () => { start: number; end: number }
}

export function useTablePagination(options: UsePaginationOptions = {}): UseTablePaginationReturn {
  const pagination = usePagination(options)
  const pageSizeOptions = [10, 20, 50, 100]

  const setPageSize = useCallback((size: number) => {
    pagination.setLimit(size)
  }, [pagination])

  const getRowNumbers = useCallback(() => {
    const start = (pagination.pagination.page - 1) * pagination.pagination.limit + 1
    const end = Math.min(
      pagination.pagination.page * pagination.pagination.limit,
      pagination.pagination.total
    )
    return { start, end }
  }, [pagination.pagination])

  return {
    ...pagination,
    pageSizeOptions,
    setPageSize,
    getRowNumbers
  }
}