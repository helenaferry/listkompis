export default function Loading() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-[#1c1c1e]">
      <div className="max-w-lg mx-auto px-4 pt-4 pb-8 animate-pulse">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-5 w-28 bg-gray-200 dark:bg-zinc-700 rounded" />
          <div className="flex items-center gap-3">
            <div className="h-3 w-32 bg-gray-200 dark:bg-zinc-700 rounded" />
            <div className="w-8 h-8 bg-gray-200 dark:bg-zinc-700 rounded-full" />
          </div>
        </div>
        {/* List cards */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-800 rounded-xl border border-gray-100 dark:border-zinc-700 px-4 py-3 mb-3 flex items-center justify-between"
          >
            <div className="h-4 bg-gray-200 dark:bg-zinc-700 rounded w-2/3" />
            <div className="h-6 w-6 bg-gray-200 dark:bg-zinc-700 rounded" />
          </div>
        ))}
      </div>
    </main>
  );
}
