'use client'

/**
 * PageLoader — skeleton overlay used inside dashboard panels while data loads.
 * Shows a content-area skeleton (no sidebar, that's already visible).
 */
export default function PageLoader() {
  return (
    <div className="relative w-full animate-fade-in">
      {/* Skeleton rows */}
      <div className="space-y-5 animate-pulse">
        {/* Header row */}
        <div className="flex items-center justify-between">
          <div className="h-7 w-48 bg-gray-200 rounded-xl" />
          <div className="h-9 w-28 bg-gray-200 rounded-xl" />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[100, 90, 80, 70].map((op, i) => (
            <div
              key={i}
              className="h-28 bg-white rounded-2xl border border-gray-100 shadow-sm"
              style={{ opacity: op / 100 }}
            />
          ))}
        </div>

        {/* Main content area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 h-52 bg-white rounded-2xl border border-gray-100 shadow-sm opacity-90" />
          <div className="h-52 bg-white rounded-2xl border border-gray-100 shadow-sm opacity-80" />
        </div>

        {/* List rows */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3 opacity-80">
          {[100, 85, 70, 55].map((op, i) => (
            <div key={i} className="flex items-center gap-3" style={{ opacity: op / 100 }}>
              <div className="w-9 h-9 rounded-xl bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 bg-gray-200 rounded-lg w-2/3" />
                <div className="h-3 bg-gray-100 rounded-lg w-1/3" />
              </div>
              <div className="h-7 w-16 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>

        <div className="h-28 bg-white rounded-2xl border border-gray-100 shadow-sm opacity-60" />
      </div>

      {/* Centered spinner overlay */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 bg-white/80 backdrop-blur-sm px-8 py-6 rounded-2xl shadow-lg border border-gray-100">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg
              className="w-5 h-5 text-white animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-600">Loading...</p>
        </div>
      </div>
    </div>
  )
}
