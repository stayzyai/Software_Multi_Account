import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SettingSkeleton() {
  return (
    <div className="p-8 overflow-auto">
      <div className="max-w-4xl mx-auto">
        <div className="h-10 w-40 mb-6 bg-gray-200 animate-pulse rounded" />{" "}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="h-6 w-1/3 mb-2 bg-gray-200 animate-pulse rounded" />{" "}
              <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded" />{" "}
            </CardHeader>
            <CardContent className="space-y-4">
              {["First Name", "Last Name", "Email"].map((field) => (
                <div key={field} className="space-y-2">
                  <div className="h-4 w-1/4 bg-gray-200 animate-pulse rounded" />{" "}
                  <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />{" "}
                </div>
              ))}
              <div className="h-10 w-1/3 mt-2 bg-gray-200 animate-pulse rounded" />{" "}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="h-6 w-1/3 mb-2 bg-gray-200 animate-pulse rounded" />{" "}
              <div className="h-4 w-2/3 bg-gray-200 animate-pulse rounded" />{" "}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 w-1/4 bg-gray-200 animate-pulse rounded" />{" "}
                <div className="h-10 w-full bg-gray-200 animate-pulse rounded" />{" "}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
