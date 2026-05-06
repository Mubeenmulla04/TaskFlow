export function SkeletonCard({ className = '' }) {
  return (
    <div className={`glass rounded-2xl p-6 animate-pulse ${className}`}>
      <div className="h-4 bg-dark-600 rounded-lg w-3/4 mb-3" />
      <div className="h-3 bg-dark-600 rounded-lg w-1/2 mb-6" />
      <div className="h-3 bg-dark-600 rounded-lg w-full mb-2" />
      <div className="h-3 bg-dark-600 rounded-lg w-5/6" />
    </div>
  );
}

export function SkeletonRow({ className = '' }) {
  return (
    <div className={`flex items-center gap-4 p-4 glass rounded-xl animate-pulse ${className}`}>
      <div className="w-10 h-10 bg-dark-600 rounded-full flex-shrink-0" />
      <div className="flex-1">
        <div className="h-3 bg-dark-600 rounded w-1/3 mb-2" />
        <div className="h-2.5 bg-dark-600 rounded w-1/2" />
      </div>
      <div className="h-6 w-16 bg-dark-600 rounded-lg" />
    </div>
  );
}

export function SkeletonStat({ className = '' }) {
  return (
    <div className={`glass rounded-2xl p-6 animate-pulse ${className}`}>
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-dark-600 rounded-xl" />
        <div>
          <div className="h-3 bg-dark-600 rounded w-20 mb-2" />
          <div className="h-7 bg-dark-600 rounded w-12" />
        </div>
      </div>
    </div>
  );
}
