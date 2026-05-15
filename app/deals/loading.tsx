export default function DealsLoading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="bg-white border-b border-[#ebebeb]">
        <div className="max-w-lg mx-auto px-4 pt-5 pb-4">
          <div className="flex justify-end mb-4">
            <div className="h-5 w-14 bg-[#ebebeb] rounded animate-pulse" />
          </div>
          <div className="flex justify-center mb-5">
            <div className="h-12 w-40 bg-[#ebebeb] rounded animate-pulse" />
          </div>
          <div className="flex items-center justify-between">
            <div className="h-6 w-24 bg-[#ebebeb] rounded animate-pulse" />
            <div className="h-5 w-20 bg-[#ebebeb] rounded animate-pulse" />
          </div>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 pt-4 pb-12">
        <div className="h-11 bg-white border border-[#ebebeb] rounded-xl animate-pulse mb-3" />
        <ul className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <li key={i} className="bg-white rounded-xl border border-[#ebebeb] overflow-hidden">
              <div className="px-4 py-4">
                <div className="h-4 bg-[#ebebeb] rounded animate-pulse w-3/4 mb-2" />
                <div className="h-3 bg-[#ebebeb] rounded animate-pulse w-1/2" />
              </div>
              <div className="flex border-t border-[#f0f0f0]">
                <div className="flex-1 h-12 bg-[#FAFAF8] animate-pulse border-r border-[#f0f0f0]" />
                <div className="flex-1 h-12 bg-[#FAFAF8] animate-pulse" />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
