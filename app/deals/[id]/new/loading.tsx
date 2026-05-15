export default function NewTaskLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="bg-white border-b border-[#ebebeb]">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="h-4 w-16 bg-[#ebebeb] rounded animate-pulse mb-4" />
          <div className="h-5 w-48 bg-[#ebebeb] rounded animate-pulse mb-1.5" />
          <div className="h-4 w-56 bg-[#ebebeb] rounded animate-pulse" />
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pt-5 pb-6">
        <div className="bg-white rounded-xl border border-[#ebebeb] p-4 mb-4">
          <div className="h-28 bg-[#FAFAF8] rounded animate-pulse mb-3" />
          <div className="h-4 w-24 bg-[#ebebeb] rounded animate-pulse" />
        </div>
        <div className="bg-white rounded-xl border border-[#ebebeb] p-4 flex flex-col gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i}>
              <div className="h-3 w-16 bg-[#ebebeb] rounded animate-pulse mb-1.5" />
              <div className="h-11 bg-[#FAFAF8] border border-[#ebebeb] rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
        <div className="h-14 bg-[#ebebeb] rounded-xl animate-pulse mt-4" />
      </div>
    </div>
  );
}
