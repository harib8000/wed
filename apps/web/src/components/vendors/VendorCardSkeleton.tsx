'use client';

export function VendorCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Image skeleton */}
          <div className="relative h-48 bg-gray-200 animate-pulse">
            <div className="absolute top-3 left-3 h-5 w-16 bg-gray-300/60 rounded-full" />
            <div className="absolute top-3 right-3 h-8 w-8 bg-gray-300/60 rounded-full" />
          </div>
          {/* Content skeleton */}
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="flex items-center gap-2">
              <div className="h-3.5 bg-gray-200 rounded animate-pulse w-12" />
              <div className="h-3.5 bg-gray-200 rounded animate-pulse w-20" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div className="space-y-1.5">
                <div className="h-2.5 bg-gray-200 rounded animate-pulse w-10" />
                <div className="h-4.5 bg-gray-200 rounded animate-pulse w-16" />
              </div>
              <div className="h-8 bg-gray-200 rounded-lg animate-pulse w-24" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
