import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Database, Wrench, ChevronDown, ChevronUp, RefreshCw } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { NotificationTestingSection } from "@/components/DevTools/NotificationTestingSection";
import { DatabaseViewerSection } from "@/components/DevTools/DatabaseViewerSection";
import { DataMigrationSection } from "@/components/DevTools/DataMigrationSection";

export default function DevTools() {
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [databaseOpen, setDatabaseOpen] = useState(false);
  const [migrationOpen, setMigrationOpen] = useState(false);

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Wrench className="w-8 h-8" />
          Developer Tools
        </h1>
        <p className="text-muted-foreground mt-2">
          Admin-only testing and debugging features
        </p>
      </div>

      <div className="grid gap-6">
        <Collapsible open={notificationOpen} onOpenChange={setNotificationOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    <CardTitle>Notification Testing</CardTitle>
                  </div>
                  {notificationOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <CardDescription>
                  Test in-app and email notifications without affecting production data
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <NotificationTestingSection />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={databaseOpen} onOpenChange={setDatabaseOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    <CardTitle>Database Viewer</CardTitle>
                  </div>
                  {databaseOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <CardDescription>
                  Browse and inspect database tables and records (showing 50 most recent rows)
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <DatabaseViewerSection />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <Collapsible open={migrationOpen} onOpenChange={setMigrationOpen}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5" />
                    <CardTitle>Data Migration</CardTitle>
                  </div>
                  {migrationOpen ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <CardDescription>
                  Migrate customer records to the new applications architecture
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0">
                <DataMigrationSection />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}
