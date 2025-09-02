// src/app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-10">
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="mb-2 h-8 w-1/3 animate-pulse rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200"></div>
          </div>

          {/* Quick Actions Skeleton */}
          <div className="mb-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-gray-200 bg-white p-6"
                >
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-md bg-gray-200"></div>
                    <div className="ml-3">
                      <div className="mb-1 h-4 w-20 rounded bg-gray-200"></div>
                      <div className="h-3 w-16 rounded bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="mb-8">
            <div className="mb-4 h-6 w-48 animate-pulse rounded bg-gray-200"></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-lg border border-gray-200 bg-white p-4"
                >
                  <div className="flex items-center">
                    <div className="h-12 w-12 rounded-md bg-gray-200"></div>
                    <div className="ml-4 flex-1">
                      <div className="mb-2 h-4 w-20 rounded bg-gray-200"></div>
                      <div className="mb-2 h-8 w-16 rounded bg-gray-200"></div>
                      <div className="h-3 w-24 rounded bg-gray-200"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Bets Skeleton */}
          <div className="mb-8">
            <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200"></div>
            <div className="rounded-lg bg-white shadow">
              <div className="divide-y divide-gray-200">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center">
                          <div className="mr-2 h-5 w-12 rounded-full bg-gray-200"></div>
                          <div className="h-4 w-16 rounded bg-gray-200"></div>
                        </div>
                        <div className="mb-2 h-5 w-3/4 rounded bg-gray-200"></div>
                        <div className="h-4 w-1/2 rounded bg-gray-200"></div>
                      </div>
                      <div className="text-right">
                        <div className="mb-1 h-5 w-16 rounded bg-gray-200"></div>
                        <div className="h-6 w-12 rounded bg-gray-200"></div>
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
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {/* Filters Skeleton */}
            <div className="lg:col-span-1">
              <div className="animate-pulse rounded-lg bg-white p-6 shadow">
                <div className="mb-6 h-6 w-20 rounded bg-gray-200"></div>
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i}>
                      <div className="mb-2 h-4 w-24 rounded bg-gray-200"></div>
                      <div className="space-y-2">
                        {[...Array(4)].map((_, j) => (
                          <div key={j} className="h-4 w-full rounded bg-gray-200"></div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Main Content Skeleton */}
            <div className="space-y-8 lg:col-span-3">
              {/* Metrics Skeleton */}
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-lg border border-gray-200 bg-white p-4"
                  >
                    <div className="mb-4 h-12 rounded bg-gray-200"></div>
                    <div className="mb-2 h-8 w-20 rounded bg-gray-200"></div>
                    <div className="h-4 w-16 rounded bg-gray-200"></div>
                  </div>
                ))}
              </div>

              {/* Charts Skeleton */}
              <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
                {[...Array(2)].map((_, i) => (
                  <div
                    key={i}
                    className="animate-pulse rounded-lg border border-gray-200 bg-white p-6 shadow"
                  >
                    <div className="mb-4 h-6 w-32 rounded bg-gray-200"></div>
                    <div className="h-64 rounded bg-gray-200"></div>
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
