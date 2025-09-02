// src/app/dashboard/loading.tsx
export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Welcome Section Skeleton */}
          <div className="mb-8 animate-pulse rounded-lg bg-white p-6 shadow">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="mb-2 h-8 w-1/2 rounded bg-gray-200"></div>
                <div className="h-4 w-2/3 rounded bg-gray-200"></div>
              </div>
              <div className="h-12 w-12 rounded-full bg-gray-200"></div>
            </div>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left Column */}
            <div className="space-y-8">
              {/* Today's Bets Skeleton */}
              <div className="animate-pulse rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-6 w-32 rounded bg-gray-200"></div>
                  <div className="h-5 w-5 rounded bg-gray-200"></div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded bg-gray-200"></div>
                  ))}
                </div>
              </div>

              {/* Analytics Preview Skeleton */}
              <div className="animate-pulse rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-6 w-40 rounded bg-gray-200"></div>
                  <div className="h-5 w-5 rounded bg-gray-200"></div>
                </div>
                <div className="mb-6 flex space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-8 w-20 rounded bg-gray-200"></div>
                  ))}
                </div>
                <div className="mb-4 h-4 w-24 rounded bg-gray-200"></div>
                <div className="h-40 rounded bg-gray-200"></div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-8">
              {/* Seller Preview Skeleton */}
              <div className="animate-pulse rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-6 w-32 rounded bg-gray-200"></div>
                  <div className="h-5 w-5 rounded bg-gray-200"></div>
                </div>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded bg-gray-200"></div>
                  ))}
                </div>
              </div>

              {/* Subscriptions Preview Skeleton */}
              <div className="animate-pulse rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-6 w-40 rounded bg-gray-200"></div>
                  <div className="h-5 w-5 rounded bg-gray-200"></div>
                </div>
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="h-16 rounded bg-gray-200"></div>
                  ))}
                </div>
              </div>

              {/* Marketplace Preview Skeleton */}
              <div className="animate-pulse rounded-lg bg-white p-6 shadow">
                <div className="mb-4 flex items-center justify-between">
                  <div className="h-6 w-32 rounded bg-gray-200"></div>
                  <div className="h-5 w-5 rounded bg-gray-200"></div>
                </div>
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded bg-gray-200"></div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
