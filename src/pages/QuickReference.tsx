import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import QuickReferencePanel from "@/components/Playbook/QuickReferencePanel";

const QuickReference = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/playbook-editor')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Playbook Editor
        </Button>
      </div>
      <div className="p-6">
        <QuickReferencePanel />
      </div>
    </div>
  );
};

export default QuickReference;
