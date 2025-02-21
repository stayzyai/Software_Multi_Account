const MessageShimmer = () => {
  return (
    <div className="rounded-xl border bg-white p-4">
      <div className="mb-6 flex items-center justify-between">
        <div className="h-6 w-52 animate-pulse rounded bg-gray-200"></div>
        <div className="flex gap-4 mt-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 lg:w-20 animate-pulse rounded bg-gray-100"></div>
          ))}
        </div>
      </div>
      <div className="space-y-8 pb-6">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4">
            {/* <div className="h-5 w-5 animate-pulse rounded border border-gray-200"></div> */}
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200"></div>
            <div className="h-6 w-44 animate-pulse rounded bg-gray-200"></div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MessageShimmer