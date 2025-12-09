import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Database, ArrowLeft, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DatabaseViewerSection } from "@/components/DevTools/DatabaseViewerSection";
import { DataMigrationSection } from "@/components/DevTools/DataMigrationSection";
import { PermanentDeleteSection } from "@/components/DevTools/PermanentDeleteSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/SecureAuthContext";

export default function DevToolsDatabase() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  return (
    <div className="container mx-auto p-6 max-w-7xl">
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
          <Database className="w-8 h-8" />
          Database Tools
        </h1>
        <p className="text-muted-foreground mt-2">
          Database viewer and data migration tools
        </p>
      </div>

      <Tabs defaultValue="viewer" className="space-y-4">
        <TabsList>
          <TabsTrigger value="viewer" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Database Viewer
          </TabsTrigger>
          <TabsTrigger value="migration" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Data Migration
          </TabsTrigger>
          {isAdmin && (
            <TabsTrigger value="delete" className="flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Permanent Delete
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="viewer">
          <Card>
            <CardHeader>
              <CardTitle>Database Tables</CardTitle>
              <CardDescription>
                View table schema, metadata, and data (showing 50 most recent rows)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DatabaseViewerSection />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="migration">
          <Card>
            <CardHeader>
              <CardTitle>Customer to Applications Migration</CardTitle>
              <CardDescription>
                Convert customer records into application records for the new system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataMigrationSection />
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="delete">
            <Card>
              <CardHeader>
                <CardTitle className="text-destructive flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Permanent Delete - Junk Data Removal
                </CardTitle>
                <CardDescription>
                  Permanently delete test/junk customer data with full cascade deletion. Admin only.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PermanentDeleteSection />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
