export default function NewTaskLoading() {
  return (
    <main className="flex-1 px-4 py-6 max-w-lg mx-auto w-full">
      <div className="h-4 w-24 bg-gray-100 rounded animate-pulse mb-4" />
      <div className="h-6 w-48 bg-gray-100 rounded-lg animate-pulse mb-2" />
      <div className="h-4 w-56 bg-gray-100 rounded animate-pulse mb-6" />
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-3">
          <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
          <div className="h-12 bg-gray-200 rounded-2xl animate-pulse" />
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-4 flex flex-col gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-1.5">
              <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-14 bg-gray-200 rounded-2xl animate-pulse" />
      </div>
    </main>
  );
}
