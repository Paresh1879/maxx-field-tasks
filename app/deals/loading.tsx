export default function DealsLoading() {
  return (
    <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
      <div className="h-8 w-32 bg-gray-100 rounded-lg animate-pulse mb-2" />
      <div className="h-4 w-48 bg-gray-100 rounded animate-pulse mb-6" />
      <div className="flex gap-2 mb-5">
        <div className="flex-1 h-10 bg-gray-100 rounded-xl animate-pulse" />
        <div className="w-24 h-10 bg-gray-100 rounded-xl animate-pulse" />
      </div>
      <ul className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 shadow-sm">
            <div className="shrink-0 w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
