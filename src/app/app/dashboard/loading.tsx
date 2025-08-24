// src/app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-10">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="mb-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-200 rounded-md"></div>
                    <div className="ml-3">
                      <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="mb-8">
            <div className="h-6 bg-gray-200 rounded w-48 mb-4 animate-pulse"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-200 rounded-md"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-24"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Bets Skeleton */}
          <div className="mb-8">
            <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
            <div className="bg-white shadow rounded-lg">
              <div className="divide-y divide-gray-200">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="px-6 py-4 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="w-12 h-5 bg-gray-200 rounded-full mr-2"></div>
                          <div className="w-16 h-4 bg-gray-200 rounded"></div>
                        </div>
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="text-right">
                        <div className="w-16 h-5 bg-gray-200 rounded mb-1"></div>
                        <div className="w-12 h-6 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// src/app/analytics/loading.tsx
export function AnalyticsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Filters Skeleton */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-20 mb-6"></div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="space-y-2">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="h-4 bg-gray-200 rounded w-full"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="lg:col-span-3 space-y-8">
              {/* Metrics Skeleton */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                    <div className="h-12 bg-gray-200 rounded mb-4"></div>
                    <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                ))}
              </div>

              {/* Charts Skeleton */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white p-6 rounded-lg shadow border border-gray-200 animate-pulse">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
