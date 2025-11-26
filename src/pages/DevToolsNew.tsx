import { useNavigate } from "react-router-dom";
import { ArrowLeft, Code } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DevToolsNew() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/manage')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Configure
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Code className="w-8 h-8" />
          DevTools
        </h1>
        <p className="text-muted-foreground mt-2">
          Developer tools and utilities
        </p>
      </div>

      <div className="text-muted-foreground text-center py-12">
        <p>No tools configured yet</p>
      </div>
    </div>
  );
}
