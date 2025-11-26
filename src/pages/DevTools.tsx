import { useNavigate } from "react-router-dom";
import { Wrench } from "lucide-react";

export default function DevTools() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wrench className="w-8 h-8" />
          Admin Tools
        </h1>
        <p className="text-muted-foreground mt-2">
          Admin-only testing and debugging features
        </p>
      </div>

      <div className="text-muted-foreground text-center py-12">
        <p>All tools have been moved to Configure → Dev section</p>
      </div>
    </div>
  );
}
