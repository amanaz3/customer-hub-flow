import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, AlertCircle, Lightbulb, CheckCircle2, ArrowUpRight, FileText } from "lucide-react";
import { ComplianceFlag } from "@/pages/DocSearchQA";

interface ComplianceFlagsProps {
  flags: ComplianceFlag[];
  onFlagAction: (flagId: string, action: "approve" | "escalate" | "resolve") => void;
}

export const ComplianceFlags = ({ flags, onFlagAction }: ComplianceFlagsProps) => {
  const getFlagIcon = (type: ComplianceFlag["flagType"]) => {
    switch (type) {
      case "error":
        return <AlertCircle className="h-5 w-5 text-destructive" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case "suggestion":
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
    }
  };

  const getFlagColor = (type: ComplianceFlag["flagType"]) => {
    switch (type) {
      case "error":
        return "border-destructive/50 bg-destructive/5";
      case "warning":
        return "border-amber-500/50 bg-amber-500/5";
      case "suggestion":
        return "border-blue-500/50 bg-blue-500/5";
    }
  };

  const getStatusBadge = (status: ComplianceFlag["status"]) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending Review</Badge>;
      case "approved":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>;
      case "escalated":
        return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">Escalated</Badge>;
      case "resolved":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Resolved</Badge>;
    }
  };

  const pendingFlags = flags.filter(f => f.status === "pending");
  const resolvedFlags = flags.filter(f => f.status !== "pending");

  if (flags.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-medium">No Compliance Issues</h3>
          <p className="text-muted-foreground text-center mt-1">
            All documents are compliant. Run a search to check for new flags.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {pendingFlags.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Pending Review</h2>
            <Badge variant="destructive">{pendingFlags.length} items</Badge>
          </div>

          <ScrollArea className="h-[400px]">
            <div className="space-y-3 pr-4">
              {pendingFlags.map((flag) => (
                <Card key={flag.id} className={`${getFlagColor(flag.flagType)} border`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        {getFlagIcon(flag.flagType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium capitalize">{flag.flagType}</h3>
                          {getStatusBadge(flag.status)}
                        </div>
                        <p className="text-sm mb-2">{flag.message}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                          <FileText className="h-4 w-4" />
                          <span>{flag.documentTitle}</span>
                        </div>
                        <div className="bg-muted/50 rounded-md p-3 mb-3">
                          <p className="text-sm font-medium mb-1">Suggested Action:</p>
                          <p className="text-sm text-muted-foreground">{flag.suggestedAction}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => onFlagAction(flag.id, "resolve")}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-1" />
                            Resolve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onFlagAction(flag.id, "approve")}
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => onFlagAction(flag.id, "escalate")}
                          >
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            Escalate
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {resolvedFlags.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Resolved Items</h2>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2 pr-4">
              {resolvedFlags.map((flag) => (
                <Card key={flag.id} className="bg-muted/30">
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getFlagIcon(flag.flagType)}
                        <div>
                          <p className="text-sm font-medium">{flag.message}</p>
                          <p className="text-xs text-muted-foreground">{flag.documentTitle}</p>
                        </div>
                      </div>
                      {getStatusBadge(flag.status)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
