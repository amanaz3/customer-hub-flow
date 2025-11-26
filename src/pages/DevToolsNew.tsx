import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Wrench, Terminal, Database } from "lucide-react";

export default function DevToolsNew() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">DevTools</h1>
          <p className="text-muted-foreground mt-1">
            Developer and admin tools
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dev Card */}
        <Card className="border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Code className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Dev</CardTitle>
                <CardDescription>Developer and admin tools</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/dev-tools')}
            >
              <Wrench className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Admin Tools</p>
                <p className="text-xs text-muted-foreground">Developer and admin testing tools</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/dev-management')}
            >
              <Terminal className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">Dev</p>
                <p className="text-xs text-muted-foreground">Task management and development cycles</p>
              </div>
            </div>
            <div 
              className="p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors flex items-center gap-3"
              onClick={() => navigate('/dev-tools/database')}
            >
              <Database className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium text-sm">DB</p>
                <p className="text-xs text-muted-foreground">Database viewer and management</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
