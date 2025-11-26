import { Settings } from "lucide-react";

export default function AdminManage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Manage
          </h1>
          <p className="text-muted-foreground mt-1">
            Management tools and settings
          </p>
        </div>
      </div>

      <div className="text-muted-foreground text-center py-12">
        <p>No items configured yet</p>
      </div>
    </div>
  );
}
