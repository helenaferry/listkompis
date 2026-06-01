export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#1c1c1e]">
      <div className="max-w-md mx-auto px-4 py-6 animate-pulse">
        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <div className="h-4 w-20 bg-gray-200 dark:bg-zinc-700 rounded" />
          <div className="h-4 w-28 bg-gray-200 dark:bg-zinc-700 rounded" />
        </div>
        {/* Title row */}
        <div className="flex items-center gap-2 mb-4">
          <div className="h-6 w-48 bg-gray-200 dark:bg-zinc-700 rounded" />
        </div>
        {/* New item row */}
        <div className="bg-white dark:bg-zinc-800 rounded-lg border border-dashed border-gray-200 dark:border-zinc-700 px-4 py-3 mb-2 flex items-center gap-3">
          <div className="w-5 h-5 bg-gray-200 dark:bg-zinc-700 rounded" />
          <div className="h-4 w-32 bg-gray-200 dark:bg-zinc-700 rounded" />
        </div>
        {/* Item rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-800 rounded-lg border border-gray-100 dark:border-zinc-700 px-4 py-3 mb-2 flex items-center gap-3"
          >
            <div className="w-5 h-5 bg-gray-200 dark:bg-zinc-700 rounded flex-shrink-0" />
            <div
              className="h-4 bg-gray-200 dark:bg-zinc-700 rounded"
              style={{ width: `${55 + (i * 13) % 35}%` }}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
