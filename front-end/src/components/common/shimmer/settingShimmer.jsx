const SettingShimmer = ({title}) => {
  return (
    <div className="space-y-8 p-8 pt-32">
      {/* Hostaway Account Section */}
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200" />

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
          </div>

          <div className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
            <div className="h-10 w-full animate-pulse rounded-md bg-gray-200" />
          </div>
        </div>

        <div className="h-10 w-36 animate-pulse rounded-md bg-gray-100" />
      </div>

      {/* Extension Section */}
      {title === "Integrations" && <div className="space-y-6">
        <div className="h-8 w-32 animate-pulse rounded-md bg-gray-200" />

        <div className="h-5 w-96 animate-pulse rounded bg-gray-200" />

        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="h-5 flex-1 animate-pulse rounded bg-gray-200" />
            <div className="h-5 w-5 animate-pulse rounded bg-gray-200" />
          </div>

          <div className="flex items-center space-x-4">
            <div className="h-10 w-48 animate-pulse rounded-md bg-gray-200" />
            <div className="h-10 w-36 animate-pulse rounded-md bg-gray-100" />
          </div>
        </div>
      </div>}
    </div>
  );
};

export default SettingShimmer;
